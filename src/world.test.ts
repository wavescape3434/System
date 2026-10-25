import { describe, it, expect } from "vitest";
import { simulationCharacter } from "./balance-simulation";
import {
  campaign,
  startBattle,
  act,
  claimVictory,
  buy,
  combatAttributes,
} from "./rpg";
import { totalXP, stats } from "./domain";
import type { Character } from "./domain";
import {
  PLACES,
  TOWNS,
  TOWN_GEAR,
  WORLD_CONTRACTS,
  WORLD_REGIONS,
  RESOURCE_NAMES,
  WORLD_ENCOUNTERS,
} from "./world-catalog";
import {
  newWorld,
  placeCleared,
  placeOpen,
  bossChance,
  ambushChance,
  validWorld,
} from "./world-state";
import {
  explore,
  declineBoss,
  challengeBoss,
  leaveBattle,
  takeWorldContract,
  completeWorldContract,
  contractProgress,
  travelTown,
} from "./world";
import { validateCharacter } from "./storage";
const at = new Date("2027-02-20T18:00:00Z");
function character(clear = true) {
  const c = simulationCharacter("World test");
  c.baseStats = { STR: 50, DEX: 50, CON: 50, INT: 50, WIS: 50, CHA: 50 };
  c.campaign = {
    ...campaign(c),
    gold: 500,
    ...(clear ? { cleared: [...PLACES[0].stages] } : {}),
  };
  return c;
}
function sequence(...values: number[]) {
  let i = 0;
  return () => values[i++] ?? 0.99;
}
function win(c: Character) {
  for (let i = 0; i < 100 && campaign(c).battle?.phase === "player"; i++) {
    const b = campaign(c).battle!;
    c = act(c, {
      kind: "attack",
      target: b.enemies.findIndex((e) => e.hp > 0),
    });
  }
  expect(campaign(c).battle?.phase).toBe("won");
  return claimVictory(c);
}
describe("exploration world", () => {
  it("has 8 regions, 24 places, 240 stages, 6 towns and 60 commissions with unique IDs", () => {
    expect(PLACES).toHaveLength(24);
    expect(WORLD_ENCOUNTERS.filter((e) => e.kind === "stage")).toHaveLength(
      240,
    );
    expect(TOWNS).toHaveLength(6);
    expect(WORLD_CONTRACTS).toHaveLength(60);
    expect(new Set(WORLD_ENCOUNTERS.map((e) => e.id)).size).toBe(
      WORLD_ENCOUNTERS.length,
    );
  });
  it("gives every region gathering, monster, dungeon and boss commissions with valid resource locations", () => {
    for (const region of WORLD_REGIONS) {
      const jobs = WORLD_CONTRACTS.filter(
        (r) => PLACES.find((p) => p.id === r.placeId)?.region === region.id,
      );
      for (const kind of ["delivery", "hunt", "dungeon", "boss"])
        expect(jobs.some((r) => r.kind === kind)).toBe(true);
    }
    for (const id of Object.keys(RESOURCE_NAMES))
      expect(
        WORLD_CONTRACTS.some((r) => r.kind === "delivery" && r.resource === id),
      ).toBe(true);
    for (const r of WORLD_CONTRACTS.filter((r) => r.kind === "delivery"))
      expect(PLACES.find((p) => p.id === r.placeId)!.resources).toContain(
        r.resource,
      );
  });
  it("requires all stages for free exploration and earlier stages for later places", () => {
    let c = character(false);
    expect(explore(c, PLACES[0].id)).toBe(c);
    expect(placeOpen(campaign(c), PLACES[1].id)).toBe(false);
    for (const id of PLACES[0].stages) c = leaveBattle(win(startBattle(c, id)));
    expect(placeCleared(campaign(c), PLACES[0].id)).toBe(true);
    expect(placeOpen(campaign(c), PLACES[1].id)).toBe(true);
    expect(validateCharacter(c)).toBe(true);
  });
  it("gathers region resources, records discoveries, and never grants real-world XP or base stats", () => {
    const c = character(),
      before = stats(c),
      xp = totalXP(c),
      next = explore(c, PLACES[0].id, sequence(0.99, 0.6, 0, 0.5), at);
    expect(campaign(next).inventory.sunleaf).toBe(2);
    expect(campaign(next).world!.areas[PLACES[0].id].visits).toBe(1);
    expect(campaign(next).world!.journal[0].kind).toBe("gather");
    expect(stats(next)).toEqual(before);
    expect(totalXP(next)).toBe(xp);
    expect(validateCharacter(next)).toBe(true);
  });
  it("starts repeatable monster encounters and settles each battle once", () => {
    let c = explore(character(), PLACES[0].id, sequence(0.99, 0.1, 0), at);
    expect(campaign(c).battle?.source?.kind).toBe("wild");
    c = win(c);
    const gold = campaign(c).gold;
    expect(claimVictory(c)).toBe(c);
    expect(campaign(c).world!.kills[PLACES[0].id]).toBe(2);
    c = leaveBattle(c);
    c = win(explore(c, PLACES[0].id, sequence(0.99, 0.1, 0), at));
    expect(campaign(c).gold).toBeGreaterThan(gold);
    expect(campaign(c).world!.kills[PLACES[0].id]).toBe(4);
    expect(validateCharacter(c)).toBe(true);
  });
  it("uses separately rising boss and ambush matrices with guaranteed late encounters", () => {
    for (const p of PLACES) {
      expect(bossChance(p.id, 0)).toBe(p.bossBase);
      expect(bossChance(p.id, 5)).toBeGreaterThan(bossChance(p.id, 0));
      expect(bossChance(p.id, p.bossPity)).toBe(1);
      expect(ambushChance(p.id, 1)).toBeGreaterThan(ambushChance(p.id, 0));
      expect(ambushChance(p.id, p.ambushPity)).toBe(1);
    }
  });
  it("offers a boss choice, remembers declining it, and gives an ambush an actual opening enemy turn", () => {
    let c = explore(character(), PLACES[0].id, () => 0, at);
    expect(campaign(c).battle).toBeUndefined();
    expect(campaign(c).world!.areas[PLACES[0].id].pendingBoss).toBe(true);
    c = declineBoss(c, PLACES[0].id);
    expect(declineBoss(c, PLACES[0].id)).toBe(c);
    const saved = JSON.parse(JSON.stringify(c));
    expect(validateCharacter(saved)).toBe(true);
    c = explore(saved, PLACES[0].id, () => 0, at);
    const b = campaign(c).battle!;
    expect(b.source?.kind).toBe("ambush");
    expect(b.party.some((p) => p.hp < p.maxHp)).toBe(true);
    expect(b.log.join(" ")).toContain("Ambush!");
    expect(validateCharacter(c)).toBe(true);
  });
  it("resets danger after a roaming boss victory and retains it after retreat", () => {
    let c = explore(character(), PLACES[0].id, () => 0, at);
    c = challengeBoss(c, PLACES[0].id);
    c = act(c, { kind: "flee", target: 0 });
    c = leaveBattle(c);
    expect(campaign(c).world!.areas[PLACES[0].id].pendingBoss).toBe(true);
    c = win(challengeBoss(c, PLACES[0].id));
    const a = campaign(c).world!.areas[PLACES[0].id];
    expect(a.pendingBoss).toBe(false);
    expect(a.ignored).toBe(0);
    expect(a.sinceBoss).toBe(0);
    expect(a.bossVictories).toBe(1);
  });
  it("blocks exploration and travel during an active or unclaimed battle", () => {
    let c = startBattle(character(), "mossfall-1");
    expect(explore(c, PLACES[0].id)).toBe(c);
    expect(travelTown(c, "alderhaven")).toBe(c);
    c = win(c);
    expect(explore(c, PLACES[0].id)).toBe(c);
  });
});
describe("town supplies and commissions", () => {
  it("restocks a depleted store only after a real resource delivery and consumes each delivered item", () => {
    let c = character();
    expect(buy(c, "potion")).toBe(c);
    c.campaign = {
      ...campaign(c),
      inventory: { ...campaign(c).inventory, sunleaf: 6 },
    };
    c = takeWorldContract(c, "alderhaven-herbs", at);
    const base = totalXP(c),
      gold = campaign(c).gold;
    c = completeWorldContract(c, "alderhaven-herbs", at);
    expect(campaign(c).inventory.sunleaf).toBe(0);
    expect(campaign(c).world!.stock.alderhaven.potion).toBe(8);
    expect(campaign(c).gold).toBe(gold + 100);
    expect(totalXP(c)).toBe(base);
    expect(completeWorldContract(c, "alderhaven-herbs", at)).toBe(c);
    c = buy(c, "potion");
    expect(campaign(c).world!.stock.alderhaven.potion).toBe(7);
    expect(campaign(c).gold).toBe(gold + 80);
    expect(validateCharacter(c)).toBe(true);
  });
  it("tracks hunt kills after acceptance and pays a bounty only once", () => {
    let c = character();
    c.campaign!.world!.kills[PLACES[0].id] = 10;
    c = takeWorldContract(c, "alderhaven-hunt", at);
    expect(contractProgress(c, "alderhaven-hunt")).toBe(0);
    for (let i = 0; i < 3; i++)
      c = leaveBattle(
        win(explore(c, PLACES[0].id, sequence(0.99, 0.1, 0), at)),
      );
    expect(contractProgress(c, "alderhaven-hunt")).toBe(6);
    c = completeWorldContract(c, "alderhaven-hunt", at);
    expect(completeWorldContract(c, "alderhaven-hunt", at)).toBe(c);
    c = takeWorldContract(c, "alderhaven-hunt", at);
    expect(contractProgress(c, "alderhaven-hunt")).toBe(0);
  });
  it("counts the requested monster species rather than unrelated patrol kills", () => {
    let c = takeWorldContract(character(), "alderhaven-monster", at);
    c = leaveBattle(win(explore(c, PLACES[0].id, sequence(0.99, 0.1, 0), at)));
    expect(campaign(c).world!.kills[PLACES[0].id]).toBe(2);
    expect(contractProgress(c, "alderhaven-monster")).toBe(1);
  });
  it("awards caches and landmark resources without a combat or real-world reward", () => {
    const c = character(),
      gold = campaign(c).gold;
    const cache = explore(c, PLACES[0].id, sequence(0.99, 0.9), at);
    expect(campaign(cache).gold).toBe(gold + 15);
    expect(campaign(cache).battle).toBeUndefined();
    const landmark = explore(c, PLACES[0].id, () => 0.99, at);
    expect(campaign(landmark).world!.journal[0].kind).toBe("landmark");
    expect(campaign(landmark).inventory.softwood).toBe(1);
    expect(totalXP(landmark)).toBe(0);
  });
  it("requires town access, sufficient materials and gold for smith work, without base stat changes", () => {
    let c = character(),
      base = stats(c);
    expect(travelTown(c, "frostholm")).toBe(c);
    expect(buy(c, "brassford-blade")).toBe(c);
    expect(buy(c, "alderhaven-blade")).toBe(c);
    c.campaign!.inventory.softwood = 2;
    c = buy(c, "alderhaven-blade");
    expect(campaign(c).inventory["alderhaven-blade"]).toBe(1);
    expect(campaign(c).inventory.softwood).toBe(0);
    expect(stats(c)).toEqual(base);
    const beginner = TOWN_GEAR.find((g) => g.id === "alderhaven-blade")!,
      master = TOWN_GEAR.find((g) => g.id === "frostholm-blade")!;
    expect(master.mod.STR!).toBeGreaterThan(beginner.mod.STR! * 10);
    expect(master.price).toBeGreaterThan(beginner.price * 50);
    expect(combatAttributes(c).STR).toBeGreaterThan(base.STR);
  });
  it("does not repeat an already-cleared dungeon bounty for free gold", () => {
    let c = character();
    c.campaign!.cleared = PLACES.filter((p) => p.region === "mossfall").flatMap(
      (p) => p.stages,
    );
    c = takeWorldContract(c, "alderhaven-dungeon", at);
    c = completeWorldContract(c, "alderhaven-dungeon", at);
    expect(takeWorldContract(c, "alderhaven-dungeon", at)).toBe(c);
    expect(validateCharacter(c)).toBe(true);
  });
  it("recruits later companions with usable commands and validated party saves", () => {
    let c = character();
    c.campaign!.cleared = ["coast-boss", "fen-boss", "frost-boss"];
    c.campaign!.roster = ["mira", "nessa", "toma", "elara"];
    c.campaign!.party = ["nessa", "toma"];
    c = startBattle(c, "mossfall-1");
    expect(campaign(c).battle!.party[1].abilities[0].name).toBe(
      "Tidal Barrier",
    );
    expect(campaign(c).battle!.party[2].abilities[0].name).toBe(
      "Fenfang Strike",
    );
    expect(validateCharacter(c)).toBe(true);
  });
  it("validates persisted world state and rejects corrupt counters and locations", () => {
    const w = newWorld();
    expect(validWorld(w)).toBe(true);
    expect(validWorld({ ...w, townId: "invented" })).toBe(false);
    expect(
      validWorld({ ...w, stock: { ...w.stock, alderhaven: { potion: NaN } } }),
    ).toBe(false);
  });
});
