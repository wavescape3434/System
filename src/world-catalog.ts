import type { Stats } from "./domain";
export interface Region {
  id: string;
  name: string;
  biome: string;
  enemies: string[];
  boss: string;
  recruit?: string;
  town: string;
  description: string;
  resources: string[];
}
export const WORLD_REGIONS: Region[] = [
  {
    id: "mossfall",
    name: "Mossfall Woods",
    biome: "forest",
    enemies: ["slime", "wolf", "bandit"],
    boss: "alpha",
    recruit: "orin",
    town: "alderhaven",
    description:
      "Woodland paths, flooded groves, and a root-bound barrow around Alderhaven.",
    resources: ["sunleaf", "softwood", "wolf-pelt"],
  },
  {
    id: "quarry",
    name: "Stonepass Quarry",
    biome: "quarry",
    enemies: ["bat", "crawler", "bandit"],
    boss: "golem",
    recruit: "lyra",
    town: "brassford",
    description:
      "Terraced quarries, echoing mines, and the abandoned workings beneath Brassford.",
    resources: ["iron-ore", "copper-ore", "stonebloom"],
  },
  {
    id: "ruins",
    name: "Ember Ruins",
    biome: "ruins",
    enemies: ["wisp", "skeleton", "sentinel"],
    boss: "construct",
    recruit: "gideon",
    town: "embermere",
    description:
      "Ash gardens, shattered libraries, and vaults still lit by old mechanisms.",
    resources: ["emberglass", "old-relic", "moonmint"],
  },
  {
    id: "ridge",
    name: "Stormridge",
    biome: "mountain",
    enemies: ["harpy", "wolf", "wisp"],
    boss: "wyvern",
    town: "greywatch",
    description:
      "High passes, wind-cut plateaus, and a watchtower lost above the clouds.",
    resources: ["storm-crystal", "hardwood", "sky-herb"],
  },
  {
    id: "keep",
    name: "Blackthorn March",
    biome: "keep",
    enemies: ["skeleton", "sentinel", "crawler"],
    boss: "warden",
    town: "greywatch",
    description:
      "Briar fields and ruined fortifications surrounding Blackthorn Keep.",
    resources: ["black-iron", "old-relic", "thornroot"],
  },
  {
    id: "coast",
    name: "Amber Coast",
    biome: "coast",
    enemies: ["crab", "serpent", "bandit"],
    boss: "leviathan",
    town: "tidecross",
    description:
      "Tidal flats, sea cliffs, and the drowned halls beyond Tidecross harbor.",
    resources: ["sea-salt", "amber-pearl", "kelp"],
  },
  {
    id: "fen",
    name: "Lantern Fen",
    biome: "swamp",
    enemies: ["mushroom", "spider", "wisp"],
    boss: "hydra",
    town: "tidecross",
    description:
      "Lantern-lit causeways, reed islands, and a cistern swallowed by the marsh.",
    resources: ["fen-lily", "bog-iron", "glowcap"],
  },
  {
    id: "frost",
    name: "Frostmarch",
    biome: "snow",
    enemies: ["icewolf", "gargoyle", "revenant"],
    boss: "frostwyrm",
    town: "frostholm",
    description:
      "Snowbound trails, blue-glass caverns, and the citadel above Frostholm.",
    resources: ["frost-herb", "mythril-ore", "frost-shard"],
  },
];
export interface Place {
  id: string;
  region: string;
  name: string;
  kind: "field" | "wilds" | "dungeon";
  biome: string;
  description: string;
  stages: string[];
  resources: string[];
  bossBase: number;
  bossStep: number;
  bossPity: number;
  ambushBase: number;
  ambushStep: number;
  ambushPity: number;
}
const PLACE_NAMES: Record<string, [string, string, string]> = {
  mossfall: ["Briar Road", "Willowmere Grove", "Rootbound Barrow"],
  quarry: ["Stonepass Road", "Echoing Mine", "Deepforge Works"],
  ruins: ["Ash Gardens", "Fallen Archive", "Ember Vault"],
  ridge: ["Windward Pass", "Cloudbreak Plateau", "Skywatch Tower"],
  keep: ["Briar Fields", "Broken Ramparts", "Blackthorn Keep"],
  coast: ["Pearlstrand", "Gullwatch Cliffs", "Drowned Palace"],
  fen: ["Lantern Causeway", "Reedwater Isles", "Sunken Cistern"],
  frost: ["Whitepine Trail", "Blueglass Cavern", "Winter Citadel"],
};
export const PLACES: Place[] = WORLD_REGIONS.flatMap((r) =>
  PLACE_NAMES[r.id].map((name, j) => ({
    id: `${r.id}-${["path", "wilds", "dungeon"][j]}`,
    region: r.id,
    name,
    kind: (["field", "wilds", "dungeon"] as const)[j],
    biome:
      j === 2
        ? r.biome === "forest"
          ? "barrow"
          : r.biome === "coast"
            ? "sea-cave"
            : r.biome === "snow"
              ? "ice-cave"
              : "dungeon"
        : j === 1 && r.biome === "forest"
          ? "grove"
          : r.biome,
    description:
      j === 0
        ? `The outer trails of ${r.name}.`
        : j === 1
          ? `The remote interior of ${r.name}.`
          : `An enclosed dungeon in ${r.name}.`,
    stages:
      j === 0
        ? [`${r.id}-1`, `${r.id}-2`, `${r.id}-boss`, `${r.id}-path-4`]
        : Array.from(
            { length: 4 },
            (_, i) => `${r.id}-${j === 1 ? "wilds" : "dungeon"}-${i + 1}`,
          ),
    resources: [r.resources[j], r.resources[(j + 1) % 3]],
    bossBase: [0.04, 0.07, 0.1][j],
    bossStep: [0.025, 0.03, 0.04][j],
    bossPity: [24, 20, 16][j],
    ambushBase: [0.08, 0.1, 0.14][j],
    ambushStep: 0.08,
    ambushPity: 10,
  })),
);
export interface WorldEncounter {
  id: string;
  name: string;
  region: string;
  placeId: string;
  tier: number;
  enemies: string[];
  gold: number;
  recruit?: string;
  kind: "stage" | "wild" | "roaming-boss";
  loot: Record<string, number>;
}
export const WORLD_ENCOUNTERS: WorldEncounter[] = PLACES.flatMap((p) => {
  const r = WORLD_REGIONS.find((r) => r.id === p.region)!,
    ri = WORLD_REGIONS.indexOf(r),
    pi = PLACES.filter((x) => x.region === r.id).indexOf(p),
    tier = ri + 1 + pi;
  const stages = p.stages.map((id, i) => ({
    id,
    name: `${p.name}: ${["Approach", "Patrol", "Guardian", "Sanctum"][i]}`,
    region: r.id,
    placeId: p.id,
    tier,
    enemies:
      i === 2 || (i === 3 && p.kind === "dungeon")
        ? [r.boss]
        : [r.enemies[(i + pi) % 3], r.enemies[(i + pi + 1) % 3]],
    gold: (i === 2 ? 60 : i === 0 ? 20 : 30) + ri * 20 + pi * 15,
    recruit: pi === 0 && i === 2 ? r.recruit : undefined,
    kind: "stage" as const,
    loot: { [p.resources[i % p.resources.length]]: i === 2 ? 2 : 1 },
  }));
  return [
    ...stages,
    ...[0, 1].map((n) => ({
      id: `${p.id}-wild-${n}`,
      name: `${p.name}: ${n ? "Roving pack" : "Wild encounter"}`,
      region: r.id,
      placeId: p.id,
      tier,
      enemies: [r.enemies[(n + pi) % 3], r.enemies[(n + pi + 1) % 3]],
      gold: 25 + ri * 15 + pi * 10,
      kind: "wild" as const,
      loot: { [p.resources[n % 2]]: 1 },
    })),
    {
      id: `${p.id}-roaming-boss`,
      name: `${p.name}: ${r.boss[0].toUpperCase() + r.boss.slice(1)}`,
      region: r.id,
      placeId: p.id,
      tier: tier + 1,
      enemies: [r.boss],
      gold: 100 + ri * 40 + pi * 25,
      kind: "roaming-boss" as const,
      loot: { [p.resources[0]]: 4, [p.resources[1]]: 2 },
    },
  ];
});
export const RESOURCE_NAMES: Record<string, string> = {
  sunleaf: "Sunleaf",
  softwood: "Softwood",
  "wolf-pelt": "Briar Pelt",
  "iron-ore": "Iron Ore",
  "copper-ore": "Copper Ore",
  stonebloom: "Stonebloom",
  emberglass: "Emberglass",
  "old-relic": "Archive Relic",
  moonmint: "Moonmint",
  "storm-crystal": "Storm Crystal",
  hardwood: "Hardwood",
  "sky-herb": "Sky Herb",
  "black-iron": "Black Iron",
  thornroot: "Thornroot",
  "sea-salt": "Sea Salt",
  "amber-pearl": "Amber Pearl",
  kelp: "Medicinal Kelp",
  "fen-lily": "Fen Lily",
  "bog-iron": "Bog Iron",
  glowcap: "Glowcap",
  "frost-herb": "Frost Herb",
  "mythril-ore": "Mythril Ore",
  "frost-shard": "Frost Shard",
};
export interface Town {
  id: string;
  name: string;
  region: string;
  smith: number;
  herb: string;
  ore: string;
  description: string;
  stock: Record<string, number>;
}
export const TOWNS: Town[] = [
  {
    id: "alderhaven",
    name: "Alderhaven",
    region: "mossfall",
    smith: 1,
    herb: "sunleaf",
    ore: "softwood",
    description:
      "A woodland guild town. The clinic needs Sunleaf before the general store can brew more healing potions.",
    stock: { potion: 0, ether: 3 },
  },
  {
    id: "brassford",
    name: "Brassford",
    region: "quarry",
    smith: 2,
    herb: "stonebloom",
    ore: "iron-ore",
    description:
      "A quarry town with dependable steelwork and a busy ore exchange.",
    stock: { potion: 6, ether: 2 },
  },
  {
    id: "embermere",
    name: "Embermere",
    region: "ruins",
    smith: 3,
    herb: "moonmint",
    ore: "emberglass",
    description:
      "A scholarly town whose smiths set recovered emberglass into weapons.",
    stock: { potion: 4, ether: 8 },
  },
  {
    id: "greywatch",
    name: "Greywatch",
    region: "ridge",
    smith: 4,
    herb: "sky-herb",
    ore: "storm-crystal",
    description: "A mountain garrison known for storm-tempered armor.",
    stock: { potion: 8, ether: 4 },
  },
  {
    id: "tidecross",
    name: "Tidecross",
    region: "coast",
    smith: 3,
    herb: "kelp",
    ore: "amber-pearl",
    description:
      "A trading port linking the coast and Lantern Fen. Its caravans depend on guild escorts.",
    stock: { potion: 10, ether: 10 },
  },
  {
    id: "frostholm",
    name: "Frostholm",
    region: "frost",
    smith: 5,
    herb: "frost-herb",
    ore: "mythril-ore",
    description:
      "A snowbound city where a grandmaster works mythril and frost crystal.",
    stock: { potion: 3, ether: 6 },
  },
];
export interface TownGear {
  id: string;
  town: string;
  name: string;
  slot: "weapon" | "armor" | "accessory";
  price: number;
  mod: Partial<Stats>;
  description: string;
  material: string;
  quantity: number;
}
export const TOWN_GEAR: TownGear[] = TOWNS.flatMap((t) =>
  (["blade", "staff", "bow", "armor", "charm"] as const).map((kind, i) => {
    const power = 2 ** t.smith + 1,
      stat =
        i === 1
          ? "INT"
          : i === 2
            ? "DEX"
            : i === 3
              ? "CON"
              : i === 4
                ? "WIS"
                : "STR";
    return {
      id: `${t.id}-${kind}`,
      town: t.id,
      name: `${({ alderhaven: "Woodland", brassford: "Brassforged", embermere: "Emberglass", greywatch: "Stormforged", tidecross: "Pearlguard", frostholm: "Frostbound" } as Record<string, string>)[t.id]} ${kind[0].toUpperCase() + kind.slice(1)}`,
      slot: i === 3 ? "armor" : i === 4 ? "accessory" : "weapon",
      price: 150 * 3 ** (t.smith - 1),
      mod: { [stat]: power },
      description: `+${power} combat ${stat}`,
      material: t.ore,
      quantity: t.smith + 1,
    };
  }),
);
export interface WorldContract {
  id: string;
  town: string;
  title: string;
  description: string;
  kind: "delivery" | "hunt" | "dungeon" | "boss";
  placeId: string;
  resource?: string;
  target?: string;
  quantity: number;
  gold: number;
  restock?: Record<string, number>;
}
export const MONSTER_NAMES: Record<string, string> = {
  slime: "Forest Slime",
  wolf: "Briar Wolf",
  bandit: "Road Bandit",
  alpha: "Briar Alpha",
  bat: "Cave Bat",
  crawler: "Stone Crawler",
  golem: "Quarry Golem",
  wisp: "Ember Wisp",
  skeleton: "Ruins Guard",
  sentinel: "Iron Sentinel",
  construct: "Ember Construct",
  harpy: "Storm Harpy",
  wyvern: "Ridge Wyvern",
  warden: "Blackthorn Warden",
  crab: "Amber Crab",
  serpent: "Tide Serpent",
  leviathan: "Reef Leviathan",
  mushroom: "Sporeling",
  spider: "Fen Spider",
  hydra: "Lantern Hydra",
  icewolf: "Frost Wolf",
  gargoyle: "Ice Gargoyle",
  revenant: "Winter Revenant",
  frostwyrm: "Frost Wyrm",
};
export const WORLD_CONTRACTS: WorldContract[] = TOWNS.flatMap(
  (t): WorldContract[] => {
    const p = PLACES.find((p) => p.region === t.region && p.kind === "field")!,
      d = PLACES.find((p) => p.region === t.region && p.kind === "dungeon")!;
    const target = WORLD_REGIONS.find((r) => r.id === t.region)!.enemies[0];
    const research = WORLD_REGIONS.find(
      (r) => r.id === t.region,
    )!.resources.find((id) => id !== t.herb && id !== t.ore)!;
    return [
      {
        id: `${t.id}-monster`,
        town: t.id,
        title: `${MONSTER_NAMES[target]} hunt`,
        description: `Defeat four ${MONSTER_NAMES[target]} monsters in ${p.name} after accepting this bounty.`,
        kind: "hunt",
        placeId: p.id,
        target,
        quantity: 4,
        gold: 110 * t.smith,
      },
      {
        id: `${t.id}-herbs`,
        town: t.id,
        title: `${t.name} clinic supplies`,
        description: `Deliver six ${RESOURCE_NAMES[t.herb]} to the guild clinic. This restores healing-potion stock.`,
        kind: "delivery" as const,
        placeId: PLACES.find(
          (area) => area.region === t.region && area.resources.includes(t.herb),
        )!.id,
        resource: t.herb,
        quantity: 6,
        gold: 80 + t.smith * 20,
        restock: { potion: 8 },
      },
      {
        id: `${t.id}-ore`,
        town: t.id,
        title: `${t.name} smith's commission`,
        description: `Deliver five ${RESOURCE_NAMES[t.ore]} to the smith.`,
        kind: "delivery" as const,
        placeId: p.id,
        resource: t.ore,
        quantity: 5,
        gold: 100 * t.smith,
      },
      {
        id: `${t.id}-hunt`,
        town: t.id,
        title: `${p.name} patrol`,
        description: `Defeat six monsters in ${p.name} after taking this request.`,
        kind: "hunt" as const,
        placeId: p.id,
        quantity: 6,
        gold: 120 * t.smith,
      },
      {
        id: `${t.id}-relics`,
        town: t.id,
        title: `${t.name} field research`,
        description: `Recover four ${RESOURCE_NAMES[research]} for the guild's researchers.`,
        kind: "delivery" as const,
        placeId: PLACES.find(
          (p) => p.region === t.region && p.resources.includes(research),
        )!.id,
        resource: research,
        quantity: 4,
        gold: 90 * t.smith,
      },
      {
        id: `${t.id}-supplies`,
        town: t.id,
        title: `${t.name} supply route`,
        description: `Defeat eight monsters in ${p.name}; the general store can then receive an ether shipment.`,
        kind: "hunt" as const,
        placeId: p.id,
        quantity: 8,
        gold: 140 * t.smith,
        restock: { ether: 6 },
      },
      {
        id: `${t.id}-dungeon`,
        town: t.id,
        title: `Clear ${d.name}`,
        description: `Complete all four stages of ${d.name}, then report to the guild.`,
        kind: "dungeon" as const,
        placeId: d.id,
        quantity: 4,
        gold: 250 * t.smith,
      },
      {
        id: `${t.id}-boss`,
        town: t.id,
        title: `${p.name} roaming boss`,
        description: `Defeat the roaming boss of ${p.name} after taking this bounty.`,
        kind: "boss" as const,
        placeId: p.id,
        quantity: 1,
        gold: 300 * t.smith,
      },
    ];
  },
);
export const BOSS_KINDS = new Set(WORLD_REGIONS.map((r) => r.boss));

// Regions sharing a town still need their own material sinks and repeat bounties.
for (const r of WORLD_REGIONS.filter(
  (r) => !TOWNS.some((t) => t.region === r.id),
)) {
  const town = TOWNS.find((t) => t.id === r.town)!,
    field = PLACES.find((p) => p.region === r.id && p.kind === "field")!,
    dungeon = PLACES.find((p) => p.region === r.id && p.kind === "dungeon")!,
    herb = r.id === "keep" ? "thornroot" : "fen-lily",
    material = r.id === "keep" ? r.resources[0] : r.resources[1],
    target = r.enemies[0];
  WORLD_CONTRACTS.push(
    {
      id: `${r.id}-herbs`,
      town: town.id,
      title: `${r.name} medicinal supplies`,
      description: `Deliver six ${RESOURCE_NAMES[herb]} to ${town.name}. The clinic will restore potion stock.`,
      kind: "delivery",
      placeId: PLACES.find(
        (p) => p.region === r.id && p.resources.includes(herb),
      )!.id,
      resource: herb,
      quantity: 6,
      gold: 100 * town.smith,
      restock: { potion: 8 },
    },
    {
      id: `${r.id}-materials`,
      town: town.id,
      title: `${r.name} material commission`,
      description: `Deliver five ${RESOURCE_NAMES[material]} from ${r.name} to ${town.name}.`,
      kind: "delivery",
      placeId: PLACES.find(
        (p) => p.region === r.id && p.resources.includes(material),
      )!.id,
      resource: material,
      quantity: 5,
      gold: 130 * town.smith,
    },
    {
      id: `${r.id}-monster`,
      town: town.id,
      title: `${r.name}: ${MONSTER_NAMES[target]} hunt`,
      description: `Defeat four ${MONSTER_NAMES[target]} monsters in ${field.name} after accepting this bounty.`,
      kind: "hunt",
      placeId: field.id,
      target,
      quantity: 4,
      gold: 150 * town.smith,
    },
    {
      id: `${r.id}-dungeon`,
      town: town.id,
      title: `Clear ${dungeon.name}`,
      description: `Complete all four stages of ${dungeon.name}, then report to ${town.name}.`,
      kind: "dungeon",
      placeId: dungeon.id,
      quantity: 4,
      gold: 300 * town.smith,
    },
    {
      id: `${r.id}-research`,
      town: town.id,
      title: `${r.name} field research`,
      description: `Recover four ${RESOURCE_NAMES[r.resources.find((id) => id !== herb && id !== material)!]} for ${town.name}'s researchers.`,
      kind: "delivery",
      placeId: PLACES.find(
        (p) =>
          p.region === r.id &&
          p.resources.includes(
            r.resources.find((id) => id !== herb && id !== material)!,
          ),
      )!.id,
      resource: r.resources.find((id) => id !== herb && id !== material)!,
      quantity: 4,
      gold: 120 * town.smith,
    },
    {
      id: `${r.id}-boss`,
      town: town.id,
      title: `${field.name} roaming boss`,
      description: `Defeat the roaming boss of ${field.name} after taking this bounty.`,
      kind: "boss",
      placeId: field.id,
      quantity: 1,
      gold: 350 * town.smith,
    },
  );
}
