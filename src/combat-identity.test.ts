import { describe, expect, it } from "vitest";
import { demoCharacter, stats, totalXP, CLASSES } from "./domain";
import { SKILLS } from "./skill-catalog";
import {
  adventureParty,
  campaign,
  startBattle,
  takeAction,
  enemyVolley,
  act,
} from "./rpg";
import { combatIdentity, ENEMY_AFFINITIES } from "./combat-identity";
import { combatProfile, resolvedLoadout } from "./combat-progression";
import { validateCharacter } from "./storage";
import { enemyIntent } from "./enemy-tactics";
import { skillStyle } from "./skill-atlas";

function fixture(id = "martial-axe-1", classId = "warrior") {
  const c = demoCharacter();
  c.activeClass = classId;
  c.baseStats = { STR: 30, DEX: 30, CON: 30, INT: 30, WIS: 30, CHA: 30 };
  c.earnedSkills = [...new Set([...c.earnedSkills, id])];
  c.campaign = {
    ...campaign(c),
    equippedSkills: [id],
    party: ["mira"],
    vitals: undefined,
  };
  const fighting = startBattle(c, "mossfall-1");
  const b = fighting.campaign!.battle!;
  b.enemies[0].hp = b.enemies[0].maxHp = 10000;
  b.enemies[0].defense = 40;
  return {
    c: fighting,
    b,
    command: { kind: "ability" as const, abilityId: id, target: 0 },
  };
}
const damage = (b: ReturnType<typeof fixture>["b"], after: typeof b) =>
  b.enemies[0].hp - after.enemies[0].hp;

describe("martial and focused-stat builds", () => {
  it("sword follow-through requires guarding the previous enemy round and expires on the next turn", () => {
    const { b, command } = fixture("martial-sword-2");
    const base = takeAction(b, command);
    const guarded = structuredClone(b);
    guarded.party[0].guard = true;
    enemyVolley(guarded);
    expect(guarded.party[0].poise).toBe(true);
    const after = takeAction(guarded, command);
    expect(damage(guarded, after)).toBeGreaterThan(damage(b, base));
    expect(after.party[0].poise).toBeUndefined();
    const itemTurn = takeAction(guarded, { kind: "guard", target: 0 });
    expect(itemTurn.party[0].poise).toBeUndefined();
  });
  it("spear techniques gain an intercept only on the charged enemy round", () => {
    const { b, command } = fixture("martial-spear-2");
    b.enemies[0].chargeEvery = 3;
    const base = takeAction(b, command);
    b.round = 3;
    const intercept = takeAction(b, command);
    expect(damage(b, intercept)).toBeGreaterThan(damage(b, base));
    expect(intercept.log).toContain("Spear intercept: +25% damage.");
    const plain = structuredClone(b);
    delete plain.party[0].abilities.find((a) => a.id === command.abilityId)!
      .discipline;
    expect(damage(b, intercept)).toBeGreaterThan(
      damage(plain, takeAction(plain, command)),
    );
    const thrust = fixture("martial-spear-1");
    thrust.b.round = 3;
    thrust.b.enemies[0].defense = 0;
    const unarmored = damage(thrust.b, takeAction(thrust.b, thrust.command));
    thrust.b.enemies[0].defense = 80;
    expect(damage(thrust.b, takeAction(thrust.b, thrust.command))).toBe(
      unarmored,
    );
  });
  it("axe damage permanently removes a share of remaining defense without going negative", () => {
    const { b, command } = fixture();
    const after = takeAction(b, command);
    expect(after.enemies[0].defense).toBe(32);
    expect(b.enemies[0].defense).toBe(40);
    b.enemies[0].defense = 1;
    expect(takeAction(b, command).enemies[0].defense).toBe(0);
  });
  it("unarmed techniques use higher DEX power and pay the displayed reduced cost", () => {
    const { b, command } = fixture("martial-unarmed-2");
    b.party[0].attack = 20;
    b.party[0].precision = 100;
    const after = takeAction(b, command);
    const plain = structuredClone(b);
    delete plain.party[0].abilities.find((a) => a.id === command.abilityId)!
      .discipline;
    expect(damage(b, after)).toBeGreaterThan(
      damage(plain, takeAction(plain, command)),
    );
    const profile = combatProfile(
      SKILLS.find((s) => s.id === command.abilityId)!,
    );
    expect(b.party[0].mp - after.party[0].mp).toBe(profile.mp);
    expect(profile.description).toContain("DEX technique power");
  });
  it("spear counters penetrate armor and sword counters benefit from poised preparation", () => {
    const spear = fixture("martial-spear-3"),
      sword = fixture("martial-sword-3");
    for (const f of [spear, sword]) {
      f.b.enemies[0].attack = 10;
      f.b.party[0].poise = true;
    }
    const braced = takeAction(spear.b, spear.command),
      riposte = takeAction(sword.b, sword.command);
    expect(braced.party[0].counterPierce).toBe(true);
    expect(riposte.party[0].counterPower).toBeGreaterThan(
      braced.party[0].counterPower!,
    );
    const noPierce = structuredClone(braced);
    noPierce.party[0].counterPierce = false;
    braced.party[0].taunt = noPierce.party[0].taunt = 1;
    expect(enemyVolley(braced).enemies[0].hp).toBeLessThan(
      enemyVolley(noPierce).enemies[0].hp,
    );
  });
  it("DEX-led attackers and WIS-led healers improve without reducing stronger existing sources", () => {
    const c = demoCharacter();
    c.baseStats = { STR: 10, DEX: 100, CON: 10, INT: 10, WIS: 10, CHA: 10 };
    c.activeClass = "ranger";
    const dex = adventureParty(c)[0].attack;
    c.activeClass = "warrior";
    expect(dex).toBeGreaterThan(adventureParty(c)[0].attack);
    c.baseStats.WIS = 100;
    c.baseStats.DEX = 10;
    c.activeClass = "disciple";
    const wis = adventureParty(c)[0].magic;
    c.activeClass = "scholar";
    expect(wis).toBeGreaterThan(adventureParty(c)[0].magic);
  });
  it("unarmed counters also use DEX power, and penetrating counters keep HP integral", () => {
    const { b, command } = fixture("martial-unarmed-3");
    b.party[0].attack = 20;
    b.party[0].precision = 100;
    const after = takeAction(b, command);
    after.party[0].taunt = 1;
    const plain = structuredClone(after);
    plain.party[0].counterPower = 1;
    expect(enemyVolley(after).enemies[0].hp).toBeLessThan(
      enemyVolley(plain).enemies[0].hp,
    );
    const spear = fixture("martial-spear-3");
    spear.b.enemies[0].defense = 41;
    const counter = takeAction(spear.b, spear.command);
    counter.party[0].taunt = 1;
    expect(Number.isInteger(enemyVolley(counter).enemies[0].hp)).toBe(true);
  });
});

describe("elemental paths", () => {
  it("offers three early styles with distinct families, increasing ranks and one-slot upgrades", () => {
    for (const e of ["fire", "ice", "storm"]) {
      const nodes = [0, 1, 2].map((n) =>
        SKILLS.find((s) => s.id === `element-${e}-${n}`)!,
      );
      expect(nodes.map((s) => combatProfile(s).rank)).toEqual([1, 2, 3]);
      expect(nodes[0].requiredLevel).toBe(1);
      expect(skillStyle(nodes[0], SKILLS)).toBe(
        { fire: "Pyromancy", ice: "Frostcraft", storm: "Stormcalling" }[e],
      );
      expect(
        resolvedLoadout(
          nodes.map((s) => s.id),
          nodes.map((s) => s.id),
          SKILLS,
        ),
      ).toEqual([nodes[2].id]);
    }
  });
  it("uses visible weaknesses and resistances while keeping untyped spells neutral", () => {
    const { b, command } = fixture("element-fire-0", "scholar");
    b.enemies[0].weak = "fire";
    b.enemies[0].resist = "ice";
    const weak = damage(b, takeAction(b, command));
    const neutral = structuredClone(b);
    delete neutral.enemies[0].weak;
    const resisted = structuredClone(neutral);
    resisted.enemies[0].resist = "fire";
    expect(weak).toBeGreaterThan(damage(neutral, takeAction(neutral, command)));
    expect(damage(neutral, takeAction(neutral, command))).toBeGreaterThan(
      damage(resisted, takeAction(resisted, command)),
    );
    expect(combatIdentity("signature-scholar", "fire").element).toBeUndefined();
    for (const a of Object.values(ENEMY_AFFINITIES))
      expect(a.weak).not.toBe(a.resist);
  });
  it("ice weakens even boss damage for exactly two enemy rounds and never stacks its multiplier", () => {
    const { b, command } = fixture("element-ice-0", "scholar");
    const chilled = takeAction(b, command);
    chilled.enemies[0].boss = true;
    expect(chilled.enemies[0].chill).toBe(2);
    expect(enemyIntent(chilled.enemies[0], 1)).toContain("attack damage −25%");
    const plain = structuredClone(chilled);
    delete plain.enemies[0].chill;
    const h = chilled.party.reduce((n, u) => n + u.hp, 0);
    const a = enemyVolley(chilled),
      z = enemyVolley(plain);
    expect(a.party.reduce((n, u) => n + u.hp, 0)).toBeGreaterThan(
      z.party.reduce((n, u) => n + u.hp, 0),
    );
    expect(a.party.reduce((n, u) => n + u.hp, 0)).toBeLessThanOrEqual(h);
    expect(a.enemies[0].chill).toBe(1);
    expect(enemyVolley(a).enemies[0].chill).toBe(0);
  });
  it("storm arcs to every other living enemy and breaks shells", () => {
    const { b, command } = fixture("element-storm-0", "scholar");
    b.enemies.push({ ...structuredClone(b.enemies[0]), id: "extra", shell: 2 });
    const after = takeAction(b, command);
    expect(after.enemies[0].hp).toBeLessThan(b.enemies[0].hp);
    expect(after.enemies[1].hp).toBeLessThan(b.enemies[1].hp);
    expect(after.enemies.at(-1)!.shell).toBe(0);
  });
});

describe("prestige techniques and saved builds", () => {
  it.each(["paladin", "high-cleric", "dawn-sovereign", "lightbearer"])(
    "%s combines its signature with party protection",
    (id) => {
      const { b } = fixture("martial-axe-1", id);
      const after = takeAction(b, {
        kind: "ability",
        abilityId: `signature-${id}`,
        target: 0,
      });
      expect(after.party.every((u) => u.guard)).toBe(true);
      expect(b.party.every((u) => !u.guard)).toBe(true);
    },
  );
  it("spellblades burn, shadowblades execute, archmages echo and artificers spread burning", () => {
    for (const id of [
      "eldritch-knight",
      "shadowblade",
      "archmage",
      "grand-artificer",
    ]) {
      const { b } = fixture("martial-axe-1", id);
      b.enemies.push({ ...structuredClone(b.enemies[0]), id: "extra" });
      b.enemies[0].hp = 5000;
      const command = {
        kind: "ability" as const,
        abilityId: `signature-${id}`,
        target: 0,
      };
      const after = takeAction(b, command);
      if (id === "eldritch-knight") expect(after.enemies[0].burn).toBe(3);
      if (id === "shadowblade") {
        const plain = structuredClone(b);
        delete plain.party[0].abilities[0].signature;
        expect(damage(b, after)).toBeGreaterThan(
          damage(plain, takeAction(plain, command)),
        );
      }
      if (id === "archmage") expect(b.party[0].mp - after.party[0].mp).toBe(4);
      if (id === "grand-artificer")
        expect(after.enemies[1].burnDamage).toBeGreaterThan(0);
    }
  });
  it("retains identity in learned focus techniques and describes it in class dossiers", () => {
    const f = fixture("focus-paladin-1", "warrior");
    expect(
      f.b.party[0].abilities.find((a) => a.id === "focus-paladin-1")?.signature,
    ).toBe("paladin");
    expect(
      CLASSES.find((p) => p.id === "paladin")!.signature.description,
    ).toContain("guard every living ally");
    expect(
      combatProfile(SKILLS.find((s) => s.id === "focus-paladin-1")!)
        .description,
    ).toContain("guard every living ally");
  });
  it("persists new fields, rejects invalid rules and leaves legacy active commands untouched", () => {
    const { c, command } = fixture("element-ice-0", "scholar");
    const before = stats(c),
      xp = totalXP(c);
    const after = act(c, command);
    expect(validateCharacter(JSON.parse(JSON.stringify(after)))).toBe(true);
    expect(stats(after)).toEqual(before);
    expect(totalXP(after)).toBe(xp);
    for (const field of ["element", "discipline", "signature"]) {
      const bad = structuredClone(after);
      Object.assign(bad.campaign!.battle!.party[0].abilities[0], {
        [field]: "unknown-rule",
      });
      expect(validateCharacter(bad)).toBe(false);
    }
    const old = structuredClone(c);
    for (const a of old.campaign!.battle!.party[0].abilities) {
      delete a.element;
      delete a.discipline;
      delete a.signature;
    }
    delete old.campaign!.battle!.enemies[0].weak;
    delete old.campaign!.battle!.enemies[0].resist;
    expect(validateCharacter(old)).toBe(true);
    const snapshot = JSON.stringify(old.campaign!.battle);
    expect(JSON.stringify(campaign(old).battle)).toBe(snapshot);
  });
});
