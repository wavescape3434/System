import type { Character } from "./domain";
import { campaign, startBattle } from "./rpg";
import {
  PLACES,
  TOWNS,
  WORLD_CONTRACTS,
  RESOURCE_NAMES,
} from "./world-catalog";
import {
  newWorld,
  placeOpen,
  placeCleared,
  regionOpen,
  placeProgress,
  bossChance,
  ambushChance,
} from "./world-state";
import type { ExplorationEvent, WorldState } from "./world-state";
const ready = (c: Character) => !campaign(c).battle;
const worldOf = (c: Character) => campaign(c).world || newWorld();
function save(
  c: Character,
  world: WorldState,
  inventory = campaign(c).inventory,
  gold = campaign(c).gold,
): Character {
  return { ...c, campaign: { ...campaign(c), world, inventory, gold } };
}
export function travelTown(c: Character, id: string): Character {
  const town = TOWNS.find((t) => t.id === id);
  if (!town || !regionOpen(campaign(c), town.region) || !ready(c)) return c;
  return save(c, { ...worldOf(c), townId: id, placeId: undefined });
}
export function explore(
  c: Character,
  id: string,
  random: () => number = Math.random,
  now = new Date(),
): Character {
  const data = campaign(c),
    p = PLACES.find((p) => p.id === id);
  if (!p || !placeOpen(data, id) || !placeCleared(data, id) || !ready(c))
    return c;
  let world = worldOf(c);
  const before = placeProgress(world, id),
    old = { ...before, visits: before.visits + 1 };
  const roll = () => Math.max(0, Math.min(0.999999999, random()));
  let event: ExplorationEvent = {
    id: crypto.randomUUID(),
    at: now.toISOString(),
    placeId: id,
    kind: "landmark",
    text: `You chart a quiet passage through ${p.name}.`,
    resolved: true,
  };
  let inventory = { ...data.inventory },
    gold = data.gold;
  if (old.pendingBoss) {
    old.ignored++;
    if (roll() < ambushChance(id, before.ignored))
      event = {
        ...event,
        kind: "ambush",
        text: "The roaming boss attacks from cover.",
        encounterId: `${id}-roaming-boss`,
        resolved: false,
      };
  }
  if (event.kind !== "ambush") {
    if (!old.pendingBoss && roll() < bossChance(id, before.sinceBoss)) {
      old.pendingBoss = true;
      event = {
        ...event,
        kind: "boss",
        text: `A powerful presence blocks the paths of ${p.name}.`,
        encounterId: `${id}-roaming-boss`,
        resolved: false,
      };
    } else {
      old.sinceBoss++;
      const outcome = roll();
      if (outcome < 0.52)
        event = {
          ...event,
          kind: "encounter",
          text: "Monsters emerge along the trail.",
          encounterId: `${id}-wild-${Math.floor(roll() * 2)}`,
          resolved: false,
        };
      else if (outcome < 0.84) {
        const resource = p.resources[Math.floor(roll() * p.resources.length)],
          quantity = 1 + Math.floor(roll() * 3);
        inventory[resource] = (inventory[resource] || 0) + quantity;
        event = {
          ...event,
          kind: "gather",
          text: `Found ${quantity} ${RESOURCE_NAMES[resource]}.`,
          resource,
          quantity,
        };
      } else if (outcome < 0.96) {
        const found = 15 + PLACES.indexOf(p) * 3;
        gold += found;
        event = {
          ...event,
          kind: "cache",
          text: `Found a weathered cache: ${found} gold.`,
          gold: found,
        };
      } else {
        const resource = p.resources[1];
        inventory[resource] = (inventory[resource] || 0) + 1;
        event = {
          ...event,
          kind: "landmark",
          text: `Charted an old waymarker and recovered ${RESOURCE_NAMES[resource]}.`,
          resource,
          quantity: 1,
        };
      }
    }
  }
  old.last = event;
  world = {
    ...world,
    placeId: id,
    areas: { ...world.areas, [id]: old },
    journal: [event, ...world.journal].slice(0, 120),
  };
  const next = save(c, world, inventory, gold);
  return event.kind === "encounter" || event.kind === "ambush"
    ? startBattle(next, event.encounterId!)
    : next;
}
export function declineBoss(c: Character, id: string): Character {
  const world = worldOf(c),
    area = placeProgress(world, id);
  if (!ready(c) || !area.pendingBoss || !area.last || area.last.declined)
    return c;
  return save(c, {
    ...world,
    areas: {
      ...world.areas,
      [id]: {
        ...area,
        ignored: area.ignored + 1,
        last: {
          ...area.last,
          declined: true,
          text: "The boss remains nearby. You withdraw to another trail.",
        },
      },
    },
  });
}
export function challengeBoss(c: Character, id: string): Character {
  const world = worldOf(c),
    area = placeProgress(world, id);
  if (!ready(c) || !area.pendingBoss) return c;
  const event: ExplorationEvent = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    placeId: id,
    kind: "boss",
    text: "You challenge the roaming boss.",
    encounterId: `${id}-roaming-boss`,
    resolved: false,
  };
  return startBattle(
    save(c, {
      ...world,
      placeId: id,
      areas: { ...world.areas, [id]: { ...area, last: event } },
    }),
    event.encounterId!,
  );
}
export function leaveBattle(c: Character): Character {
  const data = campaign(c),
    b = data.battle;
  if (!b || b.phase === "player" || (b.phase === "won" && !b.claimed)) return c;
  const next = { ...data };
  delete next.battle;
  if (next.world && b.source) {
    const area = placeProgress(next.world, b.source.placeId);
    next.world = {
      ...next.world,
      areas: {
        ...next.world.areas,
        [b.source.placeId]: {
          ...area,
          ...(b.phase !== "won" &&
          ["roaming-boss", "ambush"].includes(b.source.kind)
            ? { ignored: area.ignored + 1 }
            : {}),
          ...(area.last ? { last: { ...area.last, resolved: true } } : {}),
        },
      },
    };
  }
  return { ...c, campaign: next };
}
export function contractProgress(c: Character, id: string): number {
  const contract = WORLD_CONTRACTS.find((x) => x.id === id);
  if (!contract) return 0;
  const data = campaign(c),
    world = worldOf(c),
    taken = world.taken.find((t) => t.id === id);
  if (contract.kind === "delivery")
    return data.inventory[contract.resource!] || 0;
  if (contract.kind === "dungeon")
    return PLACES.find((p) => p.id === contract.placeId)!.stages.filter((id) =>
      data.cleared.includes(id),
    ).length;
  const count =
    contract.kind === "hunt"
      ? world.kills[
          contract.target
            ? `${contract.placeId}:${contract.target}`
            : contract.placeId
        ] || 0
      : placeProgress(world, contract.placeId).bossVictories;
  return Math.max(0, count - (taken?.baseline || 0));
}
export function takeWorldContract(
  c: Character,
  id: string,
  now = new Date(),
): Character {
  const contract = WORLD_CONTRACTS.find((r) => r.id === id),
    world = worldOf(c);
  if (
    !contract ||
    (contract.kind === "dungeon" &&
      world.receipts.some((r) => r.contractId === id)) ||
    world.taken.some((t) => t.id === id) ||
    !regionOpen(
      campaign(c),
      TOWNS.find((t) => t.id === contract.town)!.region,
    ) ||
    !ready(c)
  )
    return c;
  const baseline =
    contract.kind === "hunt"
      ? world.kills[
          contract.target
            ? `${contract.placeId}:${contract.target}`
            : contract.placeId
        ] || 0
      : contract.kind === "boss"
        ? placeProgress(world, contract.placeId).bossVictories
        : 0;
  return save(c, {
    ...world,
    taken: [...world.taken, { id, at: now.toISOString(), baseline }],
  });
}
export function completeWorldContract(
  c: Character,
  id: string,
  now = new Date(),
): Character {
  const r = WORLD_CONTRACTS.find((r) => r.id === id),
    world = worldOf(c);
  if (
    !r ||
    world.townId !== r.town ||
    !world.taken.some((t) => t.id === id) ||
    contractProgress(c, id) < r.quantity ||
    !ready(c)
  )
    return c;
  const inventory = { ...campaign(c).inventory };
  if (r.kind === "delivery") inventory[r.resource!] -= r.quantity;
  const stock = { ...world.stock, [r.town]: { ...world.stock[r.town] } };
  for (const [id, n] of Object.entries(r.restock || {}))
    stock[r.town][id] = (stock[r.town][id] || 0) + n;
  return save(
    c,
    {
      ...world,
      taken: world.taken.filter((t) => t.id !== id),
      receipts: [
        ...world.receipts,
        {
          id: crypto.randomUUID(),
          contractId: id,
          at: now.toISOString(),
          gold: r.gold,
        },
      ],
      stock,
    },
    inventory,
    campaign(c).gold + r.gold,
  );
}
