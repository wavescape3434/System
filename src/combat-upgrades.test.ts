import { describe, it, expect } from "vitest";
import { demoCharacter, SKILLS, stats, totalXP } from "./domain";
import {
  campaign,
  startBattle,
  takeAction,
  act,
  combatAttributes,
  toggleEquippedSkill,
} from "./rpg";
import {
  combatFamily,
  combatProfile,
  resolvedLoadout,
} from "./combat-progression";
import { enemyIntent } from "./enemy-tactics";
import { validateCharacter } from "./storage";

const spark = ["opening-mage-0-0", "opening-mage-0-1", "opening-mage-0-2"];
const mage = (id: string) => {
  const c = demoCharacter();
  c.activeClass = "scholar";
  c.earnedSkills.push(id);
  c.campaign = { ...campaign(c), equippedSkills: [id] };
  return c;
};
describe("meaningful combat upgrades", () => {
  it("makes Spark refinements stronger and more efficient than their preceding ranks", () => {
    const profiles = spark.map((id) =>
      combatProfile(SKILLS.find((s) => s.id === id)!),
    );
    expect(profiles.map((p) => p.rank)).toEqual([1, 2, 3]);
    expect(profiles.map((p) => p.mp)).toEqual([5, 4, 4]);
    expect(profiles.map((p) => p.statBonus)).toEqual([1, 2, 3]);
    const damage = spark.map((id) => {
      const c = mage(id),
        b = campaign(startBattle(c, "mossfall-1")).battle!;
      b.enemies[0].hp = b.enemies[0].maxHp = 1000;
      const after = takeAction(b, {
        kind: "ability",
        abilityId: id,
        target: 0,
      });
      return 1000 - after.enemies[0].hp;
    });
    expect(damage[1]).toBeGreaterThan(damage[0]);
    expect(damage[2]).toBeGreaterThan(damage[1]);
  });
  it("keeps one upgraded slot, ownership, recorded spending, base stats and real XP", () => {
    const c = mage(spark[0]);
    c.earnedSkills.push(spark[1], spark[2]);
    c.skillPurchases = [
      { id: spark[0], wallet: "combat", cost: 1 },
      { id: spark[1], wallet: "combat", cost: 3 },
      { id: spark[2], wallet: "combat", cost: 6 },
    ];
    const before = stats(c),
      xp = totalXP(c),
      history = JSON.stringify(c.skillPurchases);
    c.campaign!.equippedSkills = [...spark];
    expect(campaign(c).equippedSkills).toEqual([spark[2]]);
    expect(combatAttributes(c).INT).toBe(stats(c).INT + 5);
    const next = toggleEquippedSkill(c, spark[0]);
    expect(campaign(next).equippedSkills).toEqual([]);
    expect(
      campaign(toggleEquippedSkill(next, spark[0])).equippedSkills,
    ).toEqual([spark[2]]);
    expect(stats(next)).toEqual(before);
    expect(totalXP(next)).toBe(xp);
    expect(JSON.stringify(next.skillPurchases)).toBe(history);
    expect(next.earnedSkills).toEqual(c.earnedSkills);
    expect(validateCharacter(next)).toBe(true);
    expect(resolvedLoadout([spark[0]], [spark[2]], SKILLS)).toEqual([]);
  });
  it("gives each repeated current technique strictly improving ranks", () => {
    const families = new Map<string, typeof SKILLS>();
    for (const s of SKILLS.filter((s) => !!s.combatFamily)) {
      const key = combatFamily(s);
      families.set(key, [...(families.get(key) || []), s]);
    }
    for (const members of families.values()) {
      const ranks = members.map((s) => combatProfile(s).rank);
      expect(new Set(ranks).size).toBe(ranks.length);
      for (const rank of ranks) expect(rank).toBeGreaterThanOrEqual(1);
    }
    expect(
      new Set(spark.map((id) => combatFamily(SKILLS.find((s) => s.id === id)!)))
        .size,
    ).toBe(1);
  });
  it("retains an active battle snapshot when a stronger owned technique becomes available", () => {
    const c = startBattle(mage(spark[0]), "mossfall-1"),
      before = JSON.stringify(c.campaign!.battle);
    c.earnedSkills.push(spark[1], spark[2]);
    expect(campaign(c).equippedSkills).toEqual([spark[2]]);
    expect(JSON.stringify(campaign(c).battle)).toBe(before);
    expect(
      campaign(c).battle!.party[0].abilities.find((a) => a.id === spark[0])
        ?.cost,
    ).toBe(5);
    expect(act(c, { kind: "ability", abilityId: spark[2], target: 0 })).toBe(c);
    expect(validateCharacter(JSON.parse(JSON.stringify(c)))).toBe(true);
  });
  it("scales utility effects and counter damage as well as direct damage", () => {
    const c = demoCharacter(),
      b = campaign(startBattle(c, "mossfall-1")).battle!;
    b.party[0].abilities = [
      {
        id: "scan",
        name: "Scan",
        type: "scan",
        cost: 1,
        power: 1,
        potency: 1.4,
      },
    ];
    b.enemies[0].defense = 30;
    b.enemies[0].shell = 3;
    const scanned = takeAction(b, {
      kind: "ability",
      abilityId: "scan",
      target: 0,
    });
    expect(scanned.enemies[0].defense).toBe(26);
    expect(scanned.enemies[0].shell).toBe(0);
    const counter = (potency: number) => {
      const input = structuredClone(b);
      input.party = [input.party[0]];
      input.enemies = [
        { ...input.enemies[0], hp: 1000, maxHp: 1000, attack: 15 },
      ];
      input.party[0].abilities = [
        {
          id: "counter",
          name: "Counter",
          type: "counter",
          cost: 1,
          power: 1,
          potency,
        },
      ];
      return takeAction(input, {
        kind: "ability",
        abilityId: "counter",
        target: 0,
      });
    };
    expect(counter(1.4).enemies[0].hp).toBeLessThan(counter(1).enemies[0].hp);
  });
});
describe("Bard support progression", () => {
  it("makes higher combat CHA strengthen party buffs while base stats stay unchanged", () => {
    const buff = (cha: number) => {
      const c = demoCharacter();
      c.activeClass = "bard";
      c.baseStats.CHA = cha;
      const before = stats(c),
        b = campaign(startBattle(c, "mossfall-1")).battle!;
      const after = takeAction(b, {
        kind: "ability",
        abilityId: "signature-bard",
        target: 0,
      });
      expect(stats(c)).toEqual(before);
      expect(
        validateCharacter({
          ...c,
          campaign: { ...campaign(c), battle: after },
        }),
      ).toBe(true);
      return after.party[1].attack - b.party[1].attack;
    };
    expect(buff(60)).toBeGreaterThan(buff(10));
  });
});
describe("Briar Road tactics", () => {
  it("keeps the first encounters simple and introduces breakable shells at stage three", () => {
    const c = demoCharacter();
    expect(
      campaign(startBattle(c, "mossfall-1")).battle!.enemies[0].shell,
    ).toBeUndefined();
    c.campaign = { ...campaign(c), cleared: ["mossfall-1", "mossfall-2"] };
    const b = campaign(startBattle(c, "mossfall-path-3")).battle!;
    expect(b.enemies[0].shell).toBe(2);
    const normal = takeAction(b, { kind: "attack", target: 0 });
    expect(normal.enemies[0].shell).toBe(1);
    const skilled = takeAction(b, {
      kind: "ability",
      abilityId: b.party[0].abilities[0].id,
      target: 0,
    });
    expect(skilled.enemies[0].shell).toBe(0);
    expect(skilled.enemies[0].hp).toBeLessThan(normal.enemies[0].hp);
  });
  it("telegraphs cleaves, allows party guarding, and retains a valid saved battle", () => {
    const c = demoCharacter();
    c.campaign = { ...campaign(c), cleared: ["mossfall-path-9"] };
    const fighting = startBattle(c, "mossfall-boss"),
      b = campaign(fighting).battle!;
    b.round = 3;
    expect(enemyIntent(b.enemies[0], 2)).toBe("Preparing cleave");
    expect(enemyIntent(b.enemies[0], 3)).toBe("Cleave · all allies");
    const guarded = takeAction(takeAction(b, { kind: "guard", target: 0 }), {
      kind: "guard",
      target: 0,
    });
    const exposed = takeAction(takeAction(b, { kind: "attack", target: 0 }), {
      kind: "attack",
      target: 0,
    });
    for (let i = 0; i < 2; i++)
      expect(guarded.party[i].hp).toBeGreaterThan(exposed.party[i].hp);
    expect(validateCharacter(act(fighting, { kind: "guard", target: 0 }))).toBe(
      true,
    );
    const malformed = structuredClone(fighting);
    malformed.campaign!.battle!.enemies[0].chargeEvery = 0;
    expect(validateCharacter(malformed)).toBe(false);
  });
});
