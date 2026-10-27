import type { Campaign } from "./rpg";
import type { Character } from "./domain";
import {
  PLACES,
  WORLD_REGIONS,
  WORLD_ENCOUNTERS,
  TOWNS,
  WORLD_CONTRACTS,
  RESOURCE_NAMES,
} from "./world-catalog";
export interface ExplorationEvent {
  id: string;
  at: string;
  placeId: string;
  kind: "encounter" | "boss" | "ambush" | "gather" | "cache" | "landmark";
  text: string;
  encounterId?: string;
  resource?: string;
  quantity?: number;
  gold?: number;
  declined?: boolean;
  resolved?: boolean;
}
export interface PlaceProgress {
  visits: number;
  sinceBoss: number;
  ignored: number;
  bossVictories: number;
  pendingBoss?: boolean;
  last?: ExplorationEvent;
}
export interface WorldState {
  version: 1;
  stageVersion?: 2;
  preservedPlaces?: string[];
  preservedExploration?: string[];
  townId: string;
  placeId?: string;
  lastHunt?: string;
  expedition?: string;
  areas: Record<string, PlaceProgress>;
  kills: Record<string, number>;
  taken: { id: string; at: string; baseline: number }[];
  receipts: { id: string; contractId: string; at: string; gold: number }[];
  stock: Record<string, Record<string, number>>;
  journal: ExplorationEvent[];
}
export function newWorld(): WorldState {
  return {
    version: 1,
    stageVersion: 2,
    townId: "alderhaven",
    areas: {},
    kills: {},
    taken: [],
    receipts: [],
    stock: Object.fromEntries(TOWNS.map((t) => [t.id, { ...t.stock }])),
    journal: [],
  };
}
export const placeProgress = (w: WorldState, id: string): PlaceProgress =>
  w.areas[id] || { visits: 0, sinceBoss: 0, ignored: 0, bossVictories: 0 };
export function upgradeWorldStages(data: Campaign): WorldState {
  const world = data.world || newWorld();
  if (world.stageVersion === 2) return world;
  const oldStages = (p: (typeof PLACES)[number]) =>
    p.kind === "field"
      ? [
          `${p.region}-1`,
          `${p.region}-2`,
          `${p.region}-boss`,
          `${p.region}-path-4`,
        ]
      : Array.from({ length: 4 }, (_, i) => `${p.id}-${i + 1}`);
  const preservedPlaces = PLACES.filter((p) => {
    if (!regionOpen(data, p.region)) return false;
    const siblings = PLACES.filter((x) => x.region === p.region),
      i = siblings.indexOf(p);
    return i === 0 || data.cleared.includes(oldStages(siblings[i - 1])[3]);
  }).map((p) => p.id);
  const preservedExploration = PLACES.filter((p) =>
    oldStages(p).every((id) => data.cleared.includes(id)),
  ).map((p) => p.id);
  return { ...world, stageVersion: 2, preservedPlaces, preservedExploration };
}
export function upgradeAdventureStages(c: Character): Character {
  if (!c.campaign?.world || c.campaign.world.stageVersion === 2) return c;
  return {
    ...c,
    campaign: { ...c.campaign, world: upgradeWorldStages(c.campaign) },
  };
}
export function regionOpen(data: Campaign, id: string) {
  const index = WORLD_REGIONS.findIndex((r) => r.id === id);
  return (
    index === 0 ||
    (index > 0 && data.cleared.includes(`${WORLD_REGIONS[index - 1].id}-boss`))
  );
}
export function placeOpen(data: Campaign, id: string): boolean {
  const p = PLACES.find((p) => p.id === id);
  if (!p || !regionOpen(data, p.region)) return false;
  const siblings = PLACES.filter((x) => x.region === p.region),
    i = siblings.indexOf(p);
  return (
    !!data.world?.preservedPlaces?.includes(id) ||
    i === 0 ||
    data.cleared.includes(siblings[i - 1].stages.at(-1)!)
  );
}
export const placeCleared = (data: Campaign, id: string) =>
  !!data.world?.preservedExploration?.includes(id) ||
  !!PLACES.find((p) => p.id === id)?.stages.every((s) =>
    data.cleared.includes(s),
  );
export function worldEncounterOpen(data: Campaign, id: string): boolean {
  const e = WORLD_ENCOUNTERS.find((e) => e.id === id);
  if (!e || !placeOpen(data, e.placeId)) return false;
  const p = PLACES.find((p) => p.id === e.placeId)!;
  if (e.kind === "elite-hunt") return !data.battle && placeCleared(data, p.id);
  if (e.kind === "stage") {
    const i = p.stages.indexOf(id);
    return i === 0 || data.cleared.includes(p.stages[i - 1]);
  }
  const event = data.world?.areas[p.id]?.last;
  return (
    placeCleared(data, p.id) &&
    !!event &&
    !event.resolved &&
    event.encounterId === id &&
    data.world?.placeId === p.id
  );
}
export function bossChance(id: string, sinceBoss: number) {
  const p = PLACES.find((p) => p.id === id)!;
  return sinceBoss >= p.bossPity
    ? 1
    : Math.min(0.85, p.bossBase + p.bossStep * Math.max(0, sinceBoss));
}
export function ambushChance(id: string, ignored: number) {
  const p = PLACES.find((p) => p.id === id)!;
  return ignored >= p.ambushPity
    ? 1
    : Math.min(0.95, p.ambushBase + p.ambushStep * Math.max(0, ignored));
}
export function validWorld(w: WorldState): boolean {
  const n = (v: unknown) =>
      typeof v === "number" &&
      Number.isFinite(v) &&
      v >= 0 &&
      Number.isInteger(v),
    date = (v: string) =>
      typeof v === "string" && Number.isFinite(Date.parse(v));
  const event = (e: ExplorationEvent) =>
    !!e &&
    typeof e.id === "string" &&
    PLACES.some((p) => p.id === e.placeId) &&
    date(e.at) &&
    ["encounter", "boss", "ambush", "gather", "cache", "landmark"].includes(
      e.kind,
    ) &&
    typeof e.text === "string" &&
    (e.encounterId === undefined ||
      WORLD_ENCOUNTERS.some((x) => x.id === e.encounterId)) &&
    (e.resource === undefined ||
      typeof RESOURCE_NAMES[e.resource] === "string") &&
    (e.resolved === undefined || typeof e.resolved === "boolean") &&
    (e.declined === undefined || typeof e.declined === "boolean") &&
    (e.quantity === undefined || n(e.quantity)) &&
    (e.gold === undefined || n(e.gold));
  try {
    return (
      !!w &&
      w.version === 1 &&
      (w.stageVersion === undefined || w.stageVersion === 2) &&
      [w.preservedPlaces, w.preservedExploration].every(
        (ids) =>
          ids === undefined ||
          (Array.isArray(ids) &&
            ids.every((id) => PLACES.some((p) => p.id === id))),
      ) &&
      TOWNS.some((t) => t.id === w.townId) &&
      (w.placeId === undefined || PLACES.some((p) => p.id === w.placeId)) &&
      (w.lastHunt === undefined ||
        WORLD_ENCOUNTERS.some(
          (e) => e.id === w.lastHunt && e.kind === "elite-hunt",
        )) &&
      (w.expedition === undefined ||
        PLACES.some((p) => p.id === w.expedition)) &&
      !!w.areas &&
      Object.entries(w.areas).every(
        ([id, p]) =>
          PLACES.some((x) => x.id === id) &&
          [p.visits, p.sinceBoss, p.ignored, p.bossVictories].every(n) &&
          (p.pendingBoss === undefined || typeof p.pendingBoss === "boolean") &&
          (p.last === undefined || event(p.last)),
      ) &&
      !!w.kills &&
      Object.values(w.kills).every(n) &&
      Array.isArray(w.taken) &&
      new Set(w.taken.map((t) => t.id)).size === w.taken.length &&
      w.taken.every(
        (t) =>
          WORLD_CONTRACTS.some((c) => c.id === t.id) &&
          date(t.at) &&
          n(t.baseline),
      ) &&
      Array.isArray(w.receipts) &&
      w.receipts.every(
        (r) =>
          typeof r.id === "string" &&
          WORLD_CONTRACTS.some((c) => c.id === r.contractId) &&
          date(r.at) &&
          n(r.gold),
      ) &&
      !!w.stock &&
      TOWNS.every(
        (t) => !!w.stock[t.id] && Object.values(w.stock[t.id]).every(n),
      ) &&
      Array.isArray(w.journal) &&
      w.journal.length <= 120 &&
      w.journal.every(event)
    );
  } catch {
    return false;
  }
}
