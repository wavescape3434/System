import type { Character, Attribute } from "./domain";
import { ATTRIBUTES } from "./domain";
import { campaign, EQUIPMENT, SUPPLY_PRICES } from "./rpg";
import { PLACES, TOWNS, TOWN_GEAR, WORLD_CONTRACTS } from "./world-catalog";
import {
  placeOpen,
  placeCleared,
  placeProgress,
  bossChance,
  ambushChance,
} from "./world-state";
import { contractProgress } from "./world";
import { hasCareerUtility } from "./career-payoffs";

export function resourceRoutes(c: Character, resource?: string) {
  const data = campaign(c);
  return PLACES.filter(
    (p) =>
      placeOpen(data, p.id) && (!resource || p.resources.includes(resource)),
  ).map((p) => ({
    id: p.id,
    name: p.name,
    region: p.region,
    resources: p.resources,
    ready: placeCleared(data, p.id),
    stages: p.stages.filter((id) => data.cleared.includes(id)).length,
    total: p.stages.length,
  }));
}
export function guildDocket(c: Character) {
  if (!hasCareerUtility(c, "docket")) return null;
  const world = campaign(c).world!;
  return world.taken
    .flatMap((t) => {
      const r = WORLD_CONTRACTS.find((r) => r.id === t.id);
      if (!r) return [];
      const progress = Math.min(r.quantity, contractProgress(c, r.id));
      return [
        {
          ...r,
          progress,
          remaining: Math.max(0, r.quantity - progress),
          townName: TOWNS.find((t) => t.id === r.town)!.name,
          placeName: PLACES.find((p) => p.id === r.placeId)!.name,
          canReport: progress >= r.quantity && world.townId === r.town,
        },
      ];
    })
    .sort(
      (a, b) =>
        Number(b.canReport) - Number(a.canReport) ||
        a.remaining - b.remaining ||
        a.title.localeCompare(b.title),
    );
}
export function deliveryManifest(c: Character) {
  if (!hasCareerUtility(c, "manifest")) return null;
  const data = campaign(c),
    world = data.world!;
  const deliveries = world.taken.flatMap((t) => {
    const r = WORLD_CONTRACTS.find((r) => r.id === t.id);
    return r?.kind === "delivery" && r.resource ? [r] : [];
  });
  return [...new Set(deliveries.map((r) => r.resource!))].map((resource) => {
    const requests = deliveries.filter((r) => r.resource === resource),
      needed = requests.reduce((sum, r) => sum + r.quantity, 0),
      carried = data.inventory[resource] || 0;
    return {
      resource,
      needed,
      carried,
      shortfall: Math.max(0, needed - carried),
      requests: requests.map((r) => ({
        id: r.id,
        title: r.title,
        town: TOWNS.find((t) => t.id === r.town)!.name,
      })),
      routes: resourceRoutes(c, resource),
    };
  });
}
export function resourceAtlas(c: Character) {
  if (!hasCareerUtility(c, "atlas")) return null;
  const inventory = campaign(c).inventory,
    routes = resourceRoutes(c);
  return [...new Set(routes.flatMap((p) => p.resources))].map((resource) => ({
    resource,
    carried: inventory[resource] || 0,
    routes: routes.filter((p) => p.resources.includes(resource)),
  }));
}
export function equipmentAppraisal(c: Character) {
  if (!hasCareerUtility(c, "appraisal")) return null;
  const data = campaign(c),
    town = TOWNS.find((t) => t.id === data.world!.townId)!;
  return {
    town: town.name,
    smith: town.smith,
    items: TOWN_GEAR.filter((g) => g.town === town.id).map((g) => {
      const old = data.equipment
        .map((id) => EQUIPMENT.find((e) => e.id === id))
        .find((e) => e?.slot === g.slot);
      const owned = !!data.inventory[g.id];
      const changes = Object.fromEntries(
        ATTRIBUTES.map((stat) => [
          stat,
          (g.mod[stat] || 0) - (old?.mod[stat] || 0),
        ]),
      ) as Record<Attribute, number>;
      return {
        ...g,
        owned,
        equipped: data.equipment.includes(g.id),
        replaces: old?.name || "Empty slot",
        changes,
        goldShortfall: owned ? 0 : Math.max(0, g.price - data.gold),
        materialShortfall: owned
          ? 0
          : Math.max(0, g.quantity - (data.inventory[g.material] || 0)),
      };
    }),
  };
}
export function dangerWatch(c: Character) {
  if (!hasCareerUtility(c, "watch")) return null;
  const data = campaign(c),
    world = data.world!;
  return PLACES.filter((p) => placeOpen(data, p.id) && placeCleared(data, p.id))
    .map((p) => {
      const area = placeProgress(world, p.id),
        pending = !!area.pendingBoss;
      return {
        id: p.id,
        name: p.name,
        pending,
        visits: area.visits,
        ignored: area.ignored,
        chance: pending
          ? ambushChance(p.id, area.ignored)
          : bossChance(p.id, area.sinceBoss),
        untilGuaranteed: Math.max(
          1,
          (pending
            ? p.ambushPity - area.ignored
            : p.bossPity - area.sinceBoss) + 1,
        ),
      };
    })
    .sort(
      (a, b) =>
        Number(b.pending) - Number(a.pending) ||
        b.chance - a.chance ||
        a.name.localeCompare(b.name),
    );
}
export function supplyPlan(
  c: Character,
  counts: { potion: number; ether: number },
) {
  if (!hasCareerUtility(c, "treasury")) return null;
  const data = campaign(c),
    world = data.world!,
    town = TOWNS.find((t) => t.id === world.townId)!;
  const valid = Object.values(counts).every(
    (n) => Number.isSafeInteger(n) && n >= 0 && n <= 9999,
  );
  const total = valid
    ? counts.potion * SUPPLY_PRICES.potion + counts.ether * SUPPLY_PRICES.ether
    : 0;
  return {
    valid,
    town: town.name,
    gold: data.gold,
    total,
    remaining: data.gold - total,
    shortfall: Math.max(0, total - data.gold),
    stock: world.stock[town.id],
    prices: SUPPLY_PRICES,
    stockShortage: valid
      ? (["potion", "ether"] as const).filter(
          (id) => counts[id] > (world.stock[town.id][id] || 0),
        )
      : [],
    available:
      valid &&
      total <= data.gold &&
      (["potion", "ether"] as const).every(
        (id) => counts[id] <= (world.stock[town.id][id] || 0),
      ),
  };
}
