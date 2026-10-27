import type { Character } from "./domain";
import { objectives } from "./domain";
import {
  campaign,
  adventureParty,
  encounterEnemies,
  COMPANIONS,
  ENCOUNTERS,
  SUPPLY_RESTORE,
  breaksShellImmediately,
} from "./rpg";
import {
  PLACES,
  WORLD_REGIONS,
  WORLD_CONTRACTS,
  TOWNS,
  RESOURCE_NAMES,
  MONSTER_NAMES,
} from "./world-catalog";
import { placeOpen, regionOpen, worldEncounterOpen } from "./world-state";
import { contractProgress } from "./world";
import { adventureConditionMet } from "./calendar-goals";
import { hasCareerUtility } from "./career-payoffs";

export function recoveryTriage(c: Character, now = new Date()) {
  if (!hasCareerUtility(c, "triage")) return null;
  const data = campaign(c, now),
    next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return {
    nextRest: next.toISOString(),
    inventory: {
      potion: data.inventory.potion || 0,
      ether: data.inventory.ether || 0,
    },
    members: adventureParty(c, now)
      .map((u) => {
        const hpMissing = u.maxHp - u.hp,
          mpMissing = u.maxMp - u.mp,
          alive = u.hp > 0;
        const potion = alive ? Math.min(SUPPLY_RESTORE.potion, hpMissing) : 0,
          ether = alive ? Math.min(SUPPLY_RESTORE.ether, mpMissing) : 0;
        return {
          id: u.id,
          name: u.name,
          hp: u.hp,
          mp: u.mp,
          maxHp: u.maxHp,
          maxMp: u.maxMp,
          alive,
          potion,
          ether,
          potionWaste: alive
            ? SUPPLY_RESTORE.potion - potion
            : SUPPLY_RESTORE.potion,
          etherWaste: alive
            ? SUPPLY_RESTORE.ether - ether
            : SUPPLY_RESTORE.ether,
        };
      })
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp),
  };
}
export function battlePrimer(c: Character, placeId: string) {
  if (!hasCareerUtility(c, "battle-primer")) return null;
  const data = campaign(c),
    place = PLACES.find((p) => p.id === placeId);
  if (!place || !placeOpen(data, placeId)) return null;
  const id = place.stages.find((id) => !data.cleared.includes(id));
  if (!id) return null;
  const abilities = adventureParty(c).flatMap((u) =>
    u.abilities.map((a) => ({
      id: a.id,
      name: a.name,
      actor: u.name,
      type: a.type,
      mp: a.cost,
      alive: u.hp > 0,
      available: u.hp > 0 && u.mp >= a.cost,
      shortfall: Math.max(0, a.cost - u.mp),
      breaksShell: breaksShellImmediately(a.type),
    })),
  );
  return {
    id,
    name: ENCOUNTERS.find((e) => e.id === id)!.name,
    enemies: encounterEnemies(id).map((e) => ({
      id: e.id,
      name: e.name,
      shell: e.shell || 0,
      heavyEvery: e.chargeEvery || (e.boss ? 3 : 0),
      cleave: !!e.cleave,
    })),
    breakers: abilities.filter((a) => a.breaksShell),
    guards: abilities.filter((a) =>
      ["guard", "ward", "bulwark", "taunt", "counter", "formation"].includes(
        a.type,
      ),
    ),
  };
}
export function routePlan(c: Character, targetId: string) {
  if (!hasCareerUtility(c, "route-plan")) return null;
  const data = campaign(c),
    target = PLACES.find((p) => p.id === targetId);
  if (!target) return null;
  const ordered: string[] = [],
    seen = new Set<string>();
  const requirements = (id: string) => {
    const p = PLACES.find((p) => p.id === id)!;
    if (seen.has(id)) return;
    seen.add(id);
    const regionIndex = WORLD_REGIONS.findIndex((r) => r.id === p.region);
    if (!regionOpen(data, p.region) && regionIndex > 0)
      finish(`${WORLD_REGIONS[regionIndex - 1].id}-path`);
    const siblings = PLACES.filter((other) => other.region === p.region),
      index = siblings.findIndex((other) => other.id === id);
    if (!placeOpen(data, id) && index > 0) finish(siblings[index - 1].id);
  };
  const finish = (id: string) => {
    requirements(id);
    if (!ordered.includes(id)) ordered.push(id);
  };
  requirements(targetId);
  const steps = ordered
    .map((id) => {
      const p = PLACES.find((p) => p.id === id)!;
      return {
        id,
        name: p.name,
        remaining: p.stages.filter((id) => !data.cleared.includes(id)).length,
        open: placeOpen(data, id),
      };
    })
    .filter((p) => p.remaining > 0);
  const next =
    steps.find((p) => p.open)?.id ||
    (placeOpen(data, targetId) ? targetId : undefined);
  return {
    target: target.name,
    targetId,
    open: placeOpen(data, targetId),
    remaining: steps.reduce((n, p) => n + p.remaining, 0),
    targetRemaining: target.stages.filter((id) => !data.cleared.includes(id))
      .length,
    steps,
    next,
  };
}
export function fieldRecord(c: Character, placeId?: string) {
  if (!hasCareerUtility(c, "field-record")) return null;
  const data = campaign(c),
    world = data.world!,
    events = world.journal.filter((e) => !placeId || e.placeId === placeId);
  const outcomes = Object.fromEntries(
    ["encounter", "boss", "ambush", "gather", "cache", "landmark"].map(
      (kind) => [kind, events.filter((e) => e.kind === kind).length],
    ),
  );
  const gathered = new Map<string, number>();
  for (const e of events)
    if (e.resource && e.quantity)
      gathered.set(e.resource, (gathered.get(e.resource) || 0) + e.quantity);
  const creatures = PLACES.filter((p) => !placeId || p.id === placeId).flatMap(
    (p) =>
      Object.entries(MONSTER_NAMES).flatMap(([id, name]) => {
        const count = world.kills[`${p.id}:${id}`] || 0;
        return count ? [{ id, placeId: p.id, place: p.name, name, count }] : [];
      }),
  );
  return {
    scope: PLACES.find((p) => p.id === placeId)?.name || "All recorded areas",
    recordLimit: 120,
    total: events.length,
    outcomes,
    creatures,
    gathered: [...gathered].map(([id, count]) => ({
      id,
      name: RESOURCE_NAMES[id],
      count,
    })),
  };
}
export function fieldRecordText(c: Character, placeId?: string) {
  const r = fieldRecord(c, placeId);
  if (!r) return null;
  return [
    `${c.name} — Field record`,
    r.scope,
    `Exploration outcomes: ${r.total} matching records from a journal capped at ${r.recordLimit}. Counts are observations, not drop probabilities.`,
    "",
    ...Object.entries(r.outcomes).map(([kind, count]) => `${kind}: ${count}`),
    "",
    "Confirmed defeats (lifetime counters):",
    ...r.creatures.map((e) => `${e.place} | ${e.name}: ${e.count}`),
    "",
    "Gathered materials in these journal records:",
    ...r.gathered.map((g) => `${g.name}: ${g.count}`),
  ].join("\n");
}
export function contractWrit(c: Character, id: string, now = new Date()) {
  if (!hasCareerUtility(c, "writ")) return null;
  const data = campaign(c, now),
    world = data.world!,
    r = WORLD_CONTRACTS.find((r) => r.id === id);
  if (!r) return null;
  const taken = world.taken.find((t) => t.id === id),
    paid = world.receipts.some((p) => p.contractId === id),
    progress = taken ? Math.min(r.quantity, contractProgress(c, id)) : 0,
    consumes =
      r.kind === "delivery"
        ? {
            resource: r.resource!,
            quantity: r.quantity,
            carried: data.inventory[r.resource!] || 0,
            after: Math.max(0, (data.inventory[r.resource!] || 0) - r.quantity),
          }
        : null;
  return {
    ...r,
    townName: TOWNS.find((t) => t.id === r.town)!.name,
    taken: !!taken,
    once: r.kind === "dungeon",
    alreadyPaid: paid,
    progress,
    baseline: taken?.baseline || 0,
    canAccept:
      !data.battle &&
      !taken &&
      !(r.kind === "dungeon" && paid) &&
      regionOpen(data, TOWNS.find((t) => t.id === r.town)!.region),
    canReport:
      !data.battle &&
      !!taken &&
      progress >= r.quantity &&
      world.townId === r.town,
    consumes,
    links: objectives(c)
      .filter(
        (o) =>
          o.adventureRequirement === id || o.adventureBonus?.contractId === id,
      )
      .map((o) => ({
        id: o.id,
        title: o.title,
        kind: o.adventureRequirement === id ? "Required" : "Bonus",
        cadence: o.cadence,
        met: adventureConditionMet(c, id, o.cadence, now),
      })),
  };
}
export function companionServices(c: Character) {
  if (!hasCareerUtility(c, "service-roster")) return null;
  const data = campaign(c);
  return COMPANIONS.map((npc) => {
    const encounter = ENCOUNTERS.find((e) => e.id === npc.requires),
      place = PLACES.find((p) => p.id === encounter?.placeId);
    return {
      ...npc,
      recruited: data.roster.includes(npc.id),
      active: data.party.includes(npc.id),
      eligible: !npc.requires || data.cleared.includes(npc.requires),
      placeId: place?.id,
      placeName: place?.name,
      reachable: place ? placeOpen(data, place.id) : true,
      stageName: encounter?.name,
      encounterReady: npc.requires
        ? worldEncounterOpen(data, npc.requires)
        : true,
    };
  });
}
