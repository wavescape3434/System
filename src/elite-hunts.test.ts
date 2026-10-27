import { describe, it, expect, vi, afterEach } from "vitest";
import { demoCharacter, stats, totalXP, period } from "./domain";
import {
  ELITE_HUNTS,
  HUNT_GRADES,
  PLACES,
  WORLD_REGIONS,
  WORLD_ENCOUNTERS,
} from "./world-catalog";
import {
  campaign,
  startBattle,
  encounterEnemies,
  takeAction,
  act,
  claimVictory,
  adventureParty,
  enemyVolley,
} from "./rpg";
import { continueAdventure, returnToMap } from "./world";
import { validateCharacter } from "./storage";
import { enemyIntent, huntTarget } from "./enemy-tactics";
const fixture = () => {
  const c = demoCharacter();
  c.campaign = campaign(c);
  c.campaign.cleared = [...PLACES[0].stages];
  return c;
};
afterEach(() => vi.useRealTimers());
describe("elite hunts", () => {
  it("adds four fixed grades per region without changing the 240 campaign stages", () => {
    expect(ELITE_HUNTS).toHaveLength(32);
    expect(HUNT_GRADES).toHaveLength(4);
    expect(WORLD_ENCOUNTERS.filter((e) => e.kind === "stage")).toHaveLength(
      240,
    );
    for (const r of WORLD_REGIONS) {
      const hunts = ELITE_HUNTS.filter((h) => h.region === r.id);
      expect(hunts).toHaveLength(4);
      const hp = hunts.map((h) => encounterEnemies(h.id)[0].maxHp);
      expect(hp).toEqual([...hp].sort((a, b) => a - b));
      expect(new Set(hp).size).toBe(4);
    }
  });
  it("requires all ten regional path stages and refuses another snapshot", () => {
    const c = demoCharacter();
    expect(startBattle(c, "mossfall-hunt-1")).toBe(c);
    const unlocked = fixture(),
      fighting = startBattle(unlocked, "mossfall-hunt-1");
    expect(fighting).not.toBe(unlocked);
    expect(startBattle(fighting, "mossfall-hunt-2")).toBe(fighting);
    fighting.campaign!.battle!.phase = "won";
    fighting.campaign!.battle!.claimed = true;
    expect(startBattle(fighting, "mossfall-hunt-2")).toBe(fighting);
    expect(startBattle(unlocked, "quarry-hunt-1")).toBe(unlocked);
  });
  it("does not scale enemies to character stats, party size or player level", () => {
    const c = fixture(),
      before = encounterEnemies("mossfall-hunt-4"),
      high = structuredClone(c);
    high.baseStats = {
      STR: 100,
      DEX: 100,
      CON: 100,
      INT: 100,
      WIS: 100,
      CHA: 100,
    };
    high.campaign!.party = [];
    expect(startBattle(c, "mossfall-hunt-4").campaign!.battle!.enemies).toEqual(
      before,
    );
    expect(
      startBattle(high, "mossfall-hunt-4").campaign!.battle!.enemies,
    ).toEqual(before);
  });
  it("stores the hunt and tactic state in a valid backup and rejects corrupt tactics", () => {
    const c = startBattle(fixture(), "mossfall-hunt-1");
    expect(validateCharacter(JSON.parse(JSON.stringify(c)))).toBe(true);
    c.campaign!.battle!.enemies[0].tactic = "invented" as never;
    expect(validateCharacter(c)).toBe(false);
  });
  it("pays exactly once, leaves real progression and pending roaming bosses intact, and replays with reserves", () => {
    let c = fixture();
    const old = {
      visits: 4,
      sinceBoss: 3,
      ignored: 2,
      bossVictories: 1,
      pendingBoss: true,
    };
    c.campaign!.world!.areas["mossfall-path"] = old;
    c = startBattle(c, "mossfall-hunt-1");
    const b = c.campaign!.battle!;
    b.phase = "won";
    b.enemies.forEach((e) => (e.hp = 0));
    b.party[0].hp = 7;
    b.party[0].mp = 2;
    c.campaign!.vitals!.members.hero = {
      hp: 7,
      mp: 2,
      maxHp: b.party[0].maxHp,
      maxMp: b.party[0].maxMp,
    };
    const s = stats(c),
      xp = totalXP(c),
      before = c.campaign!.gold;
    c = claimVictory(c);
    expect(c.campaign!.gold).toBe(before + 35);
    expect(c.campaign!.inventory.sunleaf).toBe(2);
    expect(claimVictory(c)).toBe(c);
    expect(c.campaign!.world!.areas["mossfall-path"]).toEqual(old);
    expect(stats(c)).toEqual(s);
    expect(totalXP(c)).toBe(xp);
    c = continueAdventure(c);
    expect(c.campaign!.battle!.encounterId).toBe("mossfall-hunt-1");
    expect(c.campaign!.battle!.party[0].hp).toBe(7);
    expect(c.campaign!.battle!.party[0].mp).toBe(2);
    expect(c.campaign!.gold).toBe(before + 35);
  });
  it("retreat preserves damage/items and does not advance roaming-boss probabilities", () => {
    let c = fixture();
    c.campaign!.world!.areas["mossfall-path"] = {
      visits: 5,
      sinceBoss: 4,
      ignored: 3,
      bossVictories: 0,
      pendingBoss: true,
    };
    const old = structuredClone(c.campaign!.world!.areas);
    c = startBattle(c, "mossfall-hunt-1");
    c.campaign!.battle!.party[0].hp = 10;
    c = act(c, { kind: "potion", target: 0 });
    const items = c.campaign!.inventory.potion;
    c = act(c, { kind: "flee", target: 0 });
    const hp = c.campaign!.vitals!.members.hero.hp;
    c = returnToMap(c);
    expect(c.campaign!.inventory.potion).toBe(items);
    expect(adventureParty(c)[0].hp).toBe(hp);
    expect(c.campaign!.world!.areas).toEqual(old);
  });
  it("keeps the actual local midnight as the full recovery boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 1, 1, 23, 59));
    let c = startBattle(fixture(), "mossfall-hunt-1");
    c.campaign!.battle!.party[0].hp = 1;
    c = act(c, { kind: "flee", target: 0 });
    c = returnToMap(c);
    expect(adventureParty(c)[0].hp).toBe(1);
    expect(c.campaign!.vitals!.day).toBe(period("daily"));
    vi.setSystemTime(new Date(2027, 1, 2, 0, 0));
    expect(adventureParty(c)[0].hp).toBe(adventureParty(c)[0].maxHp);
  });
});
describe("hunt tactics", () => {
  it("shows shell regrowth and lets techniques break a regenerated shell", () => {
    const b = startBattle(fixture(), "mossfall-hunt-1").campaign!.battle!;
    const enemy = b.enemies[1];
    expect(enemy.tactic).toBe("bulwark");
    b.enemies[0].hp = 0;
    enemy.hp = enemy.maxHp = 10000;
    enemy.attack = 1;
    enemy.shell = 0;
    b.round = 4;
    expect(enemyIntent(enemy, 4)).toContain("Shell reforms");
    const after = enemyVolley(structuredClone(b));
    expect(after.enemies[1].shell).toBe(2);
    after.party[0].abilities = [
      { id: "break", name: "Break", type: "fire", cost: 1, power: 1 },
    ];
    expect(
      takeAction(after, { kind: "ability", abilityId: "break", target: 1 })
        .enemies[1].shell,
    ).toBe(0);
  });
  it("targets the wounded ally by percentage while taunt can intercept", () => {
    const b = startBattle(fixture(), "mossfall-hunt-1").campaign!.battle!;
    b.enemies[1].hp = 0;
    const e = b.enemies[0];
    e.tactic = "stalker";
    e.cleave = false;
    e.attack = 1;
    b.party[0].hp = 20;
    b.party[1].hp = 40;
    expect(huntTarget(e, b.party)?.id).toBe("hero");
    expect(enemyIntent(e, 1)).toContain("lowest HP%");
    const next = enemyVolley(structuredClone(b));
    expect(next.party[0].hp).toBe(19);
    b.party[1].taunt = 2;
    expect(enemyVolley(structuredClone(b)).party[1].hp).toBe(39);
  });
  it("telegraphs mana siphon and guarding reduces drain without reviving a fallen target", () => {
    const b = startBattle(fixture(), "mossfall-hunt-1").campaign!.battle!;
    b.enemies[1].hp = 0;
    const e = b.enemies[0];
    e.tactic = "siphon";
    e.cleave = false;
    e.attack = 10;
    e.chargeEvery = 2;
    b.round = 2;
    b.party[0].mp = 30;
    b.party[1].mp = 10;
    expect(enemyIntent(e, 2)).toContain("MP siphon");
    const plain = enemyVolley(structuredClone(b));
    b.party[0].guard = true;
    const guarded = enemyVolley(structuredClone(b));
    expect(guarded.party[0].mp).toBeGreaterThan(plain.party[0].mp);
    expect(plain.party[0].mp).toBe(21);
  });
  it("shows and applies the ravager wounded phase and guards reduce its cleave", () => {
    const b = startBattle(fixture(), "mossfall-hunt-1").campaign!.battle!;
    b.enemies[1].hp = 0;
    const e = b.enemies[0];
    e.attack = 20;
    e.hp = e.maxHp * 0.4;
    b.round = 3;
    expect(enemyIntent(e, 3)).toContain("Enraged");
    const plain = enemyVolley(structuredClone(b));
    b.party.forEach((u) => (u.guard = true));
    const guarded = enemyVolley(structuredClone(b));
    expect(guarded.party[0].hp).toBeGreaterThan(plain.party[0].hp);
    expect(plain.log.some((l) => l.includes("Frenzy Cleave"))).toBe(true);
  });
});

describe("companion tactical roles", () => {
  it("retains every recruited companion signature and gives each a complementary command", () => {
    const c = fixture();
    c.campaign!.roster = [
      "mira",
      "orin",
      "lyra",
      "gideon",
      "nessa",
      "toma",
      "elara",
    ];
    for (const id of c.campaign!.roster) {
      c.campaign!.party = [id];
      const npc = adventureParty(c)[1];
      expect(npc.abilities).toHaveLength(2);
      expect(npc.abilities[0].id).toBe(`${id}-skill`);
      expect(npc.abilities[1].description).toBeTruthy();
    }
  });
  it("Orin guards the living party and draws attacks without granting base stats or HP", () => {
    const c = fixture();
    c.campaign!.roster = ["mira", "orin"];
    c.campaign!.party = ["orin", "mira"];
    const b = startBattle(c, "mossfall-hunt-1").campaign!.battle!;
    b.actor = 1;
    const next = takeAction(b, {
      kind: "ability",
      abilityId: "orin-hold-line",
      target: 0,
    });
    expect(next.party.every((u) => u.guard)).toBe(true);
    expect(next.party[1].taunt).toBe(2);
    expect(next.party.map((u) => u.hp)).toEqual(b.party.map((u) => u.hp));
  });
  it("Gideon can break armor, Nessa cannot revive, and Elara can guard and counter", () => {
    for (const [id, command] of [
      ["gideon", "gideon-expose-fault"],
      ["nessa", "nessa-renewal"],
      ["elara", "elara-riposte"],
    ]) {
      const c = fixture();
      c.campaign!.roster = [id, "mira"];
      c.campaign!.party = [id, "mira"];
      const b = startBattle(c, "mossfall-hunt-1").campaign!.battle!;
      b.actor = 1;
      b.enemies[0].shell = 2;
      b.party[2].hp = 0;
      if (id === "elara") {
        [b.party[0], b.party[1]] = [b.party[1], b.party[0]];
        b.actor = 0;
      }
      const actor = b.actor;
      const next = takeAction(b, {
        kind: "ability",
        abilityId: command,
        target: 0,
      });
      if (id === "gideon") expect(next.enemies[0].shell).toBe(0);
      if (id === "nessa") expect(next.party[2].hp).toBe(0);
      if (id === "elara") {
        expect(next.party[actor].guard).toBe(true);
        expect(next.party[actor].counter).toBe(true);
      }
    }
  });
});
