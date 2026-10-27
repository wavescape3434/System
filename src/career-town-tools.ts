import type { Character } from "./domain";
import { SKILLS } from "./skill-catalog";
import { resolvedLoadout } from "./combat-progression";
import { campaign, adventureParty, SUPPLY_PRICES } from "./rpg";
import {
  PLACES,
  WORLD_REGIONS,
  TOWNS,
  WORLD_CONTRACTS,
  TOWN_GEAR,
} from "./world-catalog";
import {
  placeOpen,
  placeCleared,
  placeProgress,
  regionOpen,
} from "./world-state";
import { contractProgress } from "./world";
import { hasCareerUtility } from "./career-payoffs";
import { resourceRoutes } from "./career-field-tools";

export function routeFolio(c: Character, regionId: string) {
  if (!hasCareerUtility(c, "folio")) return null;
  const data = campaign(c),
    region = WORLD_REGIONS.find((r) => r.id === regionId);
  if (!region) return null;
  return {
    region: region.name,
    biome: region.biome,
    open: regionOpen(data, regionId),
    places: PLACES.filter((p) => p.region === regionId).map((p) => ({
      id: p.id,
      name: p.name,
      kind: p.kind,
      open: placeOpen(data, p.id),
      cleared: placeCleared(data, p.id),
      stages: p.stages.filter((id) => data.cleared.includes(id)).length,
      total: p.stages.length,
      visits: placeProgress(data.world!, p.id).visits,
      landmarks: data.world!.journal.filter(
        (e) => e.placeId === p.id && e.kind === "landmark",
      ).length,
    })),
  };
}
export function deliveryExchange(c: Character, townId: string) {
  if (!hasCareerUtility(c, "exchange")) return null;
  const data = campaign(c),
    town = TOWNS.find((t) => t.id === townId);
  if (!town || !regionOpen(data, town.region)) return null;
  return {
    town: town.name,
    offers: WORLD_CONTRACTS.filter(
      (r) => r.town === townId && r.kind === "delivery",
    )
      .map((r) => ({
        id: r.id,
        title: r.title,
        resource: r.resource!,
        quantity: r.quantity,
        gold: r.gold,
        perUnit: r.gold / r.quantity,
        carried: data.inventory[r.resource!] || 0,
        shortfall: Math.max(0, r.quantity - (data.inventory[r.resource!] || 0)),
        taken: data.world!.taken.some((t) => t.id === r.id),
        sourceOpen: placeOpen(data, r.placeId),
        placeId: r.placeId,
        place: PLACES.find((p) => p.id === r.placeId)!.name,
        restock: r.restock,
      }))
      .sort((a, b) => b.perUnit - a.perUnit || a.id.localeCompare(b.id)),
  };
}
export function receiptRegister(
  c: Character,
  days: 7 | 30 | "all" = 30,
  now = new Date(),
) {
  if (!hasCareerUtility(c, "register")) return null;
  const after =
      days === "all"
        ? null
        : new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - (days - 1),
          ),
    data = campaign(c, now);
  const entries = data
    .world!.receipts.filter(
      (r) => new Date(r.at) <= now && (!after || new Date(r.at) >= after),
    )
    .map((r) => {
      const contract = WORLD_CONTRACTS.find((q) => q.id === r.contractId)!;
      return {
        ...r,
        title: contract.title,
        townId: contract.town,
        town: TOWNS.find((t) => t.id === contract.town)!.name,
      };
    })
    .sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
  return {
    days,
    after: after?.toISOString(),
    through: now.toISOString(),
    entries,
    total: entries.reduce((n, r) => n + r.gold, 0),
    commissions: new Set(entries.map((r) => r.contractId)).size,
    towns: TOWNS.map((t) => ({
      id: t.id,
      name: t.name,
      count: entries.filter((r) => r.townId === t.id).length,
      gold: entries
        .filter((r) => r.townId === t.id)
        .reduce((n, r) => n + r.gold, 0),
    })).filter((t) => t.count),
  };
}
export function receiptRegisterText(
  c: Character,
  days: 7 | 30 | "all" = 30,
  now = new Date(),
) {
  const r = receiptRegister(c, days, now);
  if (!r) return null;
  return [
    `${c.name} — Adventure commission receipts`,
    `Window: ${r.after || "All retained receipts"} through ${r.through}`,
    `${r.entries.length} turn-ins | ${r.commissions} distinct commissions | ${r.total} gold received`,
    `Commission income only; excludes spending, battles, login rewards and real-world requests.`,
    "",
    ...r.entries.map(
      (e) => `${e.at} | ${e.id} | ${e.town} | ${e.title} | ${e.gold} gold`,
    ),
  ].join("\n");
}
export function townServices(c: Character) {
  if (!hasCareerUtility(c, "concierge")) return null;
  const data = campaign(c);
  return TOWNS.map((t) => ({
    ...t,
    open: regionOpen(data, t.region),
    current: t.id === data.world!.townId,
    stock: data.world!.stock[t.id],
    prices: SUPPLY_PRICES,
    crafts: TOWN_GEAR.filter((g) => g.town === t.id).map((g) => ({
      id: g.id,
      name: g.name,
      slot: g.slot,
      price: g.price,
      material: g.material,
      quantity: g.quantity,
      owned: !!data.inventory[g.id],
    })),
    restocking: WORLD_CONTRACTS.filter((r) => r.town === t.id && r.restock).map(
      (r) => ({ id: r.id, title: r.title, restock: r.restock! }),
    ),
  }));
}
export function forgeOrder(c: Character, ids: string[]) {
  if (!hasCareerUtility(c, "work-order")) return null;
  const data = campaign(c),
    town = TOWNS.find((t) => t.id === data.world!.townId)!,
    options = TOWN_GEAR.filter((g) => g.town === town.id),
    unique = [...new Set(ids)];
  const valid =
    unique.length === ids.length &&
    unique.every(
      (id) => options.some((g) => g.id === id) && !data.inventory[id],
    );
  const items = valid ? options.filter((g) => unique.includes(g.id)) : [],
    total = items.reduce((n, g) => n + g.price, 0),
    materialIds = [...new Set(items.map((g) => g.material))];
  const materials = materialIds.map((id) => {
    const needed = items
        .filter((g) => g.material === id)
        .reduce((n, g) => n + g.quantity, 0),
      carried = data.inventory[id] || 0;
    return {
      id,
      needed,
      carried,
      shortfall: Math.max(0, needed - carried),
      routes: resourceRoutes(c, id),
    };
  });
  return {
    town: town.name,
    valid,
    options: options.map((g) => ({ ...g, owned: !!data.inventory[g.id] })),
    items,
    total,
    gold: data.gold,
    remaining: data.gold - total,
    shortfall: Math.max(0, total - data.gold),
    materials,
    ready:
      valid &&
      !data.battle &&
      regionOpen(data, town.region) &&
      items.length > 0 &&
      total <= data.gold &&
      materials.every((m) => m.shortfall === 0),
    battleBlocked: !!data.battle,
  };
}
export function departureCheck(c: Character, placeId: string) {
  if (!hasCareerUtility(c, "departure")) return null;
  const data = campaign(c),
    place = PLACES.find((p) => p.id === placeId);
  if (!place || !placeOpen(data, placeId)) return null;
  const party = adventureParty(c),
    cleared = placeCleared(data, placeId),
    next = place.stages.find((id) => !data.cleared.includes(id)),
    taken = data.world!.taken.flatMap((t) => {
      const r = WORLD_CONTRACTS.find((r) => r.id === t.id);
      return r?.placeId === placeId
        ? [
            {
              id: r.id,
              title: r.title,
              progress: Math.min(r.quantity, contractProgress(c, r.id)),
              quantity: r.quantity,
            },
          ]
        : [];
    });
  return {
    id: placeId,
    name: place.name,
    mode: cleared ? "Exploration" : "Stage route",
    remaining: place.stages.filter((id) => !data.cleared.includes(id)).length,
    next,
    canDepart: party.some((u) => u.hp > 0) && !data.battle,
    fallen: party.filter((u) => u.hp === 0).map((u) => u.name),
    lowHp: party
      .filter((u) => u.hp > 0 && u.hp / u.maxHp < 0.25)
      .map((u) => u.name),
    unusable: party
      .filter((u) => u.hp > 0 && u.abilities.some((a) => a.cost > u.mp))
      .map((u) => u.name),
    potion: data.inventory.potion || 0,
    ether: data.inventory.ether || 0,
    skillCount: resolvedLoadout(c.earnedSkills, data.equippedSkills, SKILLS)
      .length,
    pendingBoss: !!placeProgress(data.world!, placeId).pendingBoss,
    taken,
  };
}
