import { describe, it, expect } from "vitest";
import { demoCharacter, stats, totalXP } from "./domain";
import {
  campaign,
  startBattle,
  takeAction,
  act,
  claimVictory,
  buy,
  equip,
  combatAttributes,
  ENCOUNTERS,
} from "./rpg";
import { validateCharacter } from "./storage";
function winFirst() {
  let c = startBattle(demoCharacter(), ENCOUNTERS[0].id);
  for (let i = 0; i < 50 && campaign(c).battle?.phase === "player"; i++) {
    const b = campaign(c).battle!;
    c = act(c, {
      kind: "attack",
      target: b.enemies.findIndex((e) => e.hp > 0),
    });
  }
  return c;
}
describe("JRPG combat", () => {
  it("takes a turn for each living ally before enemies act", () => {
    let c = startBattle(demoCharacter(), "mossfall-1");
    expect(campaign(c).battle?.actor).toBe(0);
    c = act(c, { kind: "attack", target: 0 });
    expect(campaign(c).battle?.actor).toBe(1);
    expect(campaign(c).battle?.round).toBe(1);
    c = act(c, { kind: "attack", target: 1 });
    expect(campaign(c).battle?.round).toBe(2);
  });
  it("refuses nonexistent skills and unavailable encounters", () => {
    const c = demoCharacter();
    expect(startBattle(c, "keep-boss")).toBe(c);
    const fighting = startBattle(c, "mossfall-1");
    expect(
      act(fighting, { kind: "ability", target: 0, abilityId: "invented" }),
    ).toBe(fighting);
  });
  it("uses MP for companion healing and consumes items", () => {
    let c = startBattle(demoCharacter(), "mossfall-1");
    c = act(c, { kind: "guard", target: 0 });
    const before = campaign(c).battle!.party[1].mp;
    c = act(c, { kind: "ability", abilityId: "mira-skill", target: 0 });
    expect(campaign(c).battle!.party[1].mp).toBe(before - 5);
    const stock = campaign(c).inventory.potion;
    c = act(c, { kind: "potion", target: 0 });
    expect(campaign(c).inventory.potion).toBe(stock - 1);
  });
  it("awards combat rewards once without real-world XP or base attribute gains", () => {
    let c = winFirst();
    expect(campaign(c).battle?.phase).toBe("won");
    const base = stats(c),
      xp = totalXP(c);
    c = claimVictory(c);
    expect(campaign(c).gold).toBe(20);
    expect(campaign(c).cleared).toContain("mossfall-1");
    expect(stats(c)).toEqual(base);
    expect(totalXP(c)).toBe(xp);
    expect(claimVictory(c)).toBe(c);
  });
  it("equipment applies combat modifiers and leaves base stats unchanged", () => {
    let c = demoCharacter();
    c.campaign = { ...campaign(c), gold: 100 };
    const base = stats(c);
    c = buy(c, "iron-sword");
    c = equip(c, "iron-sword");
    expect(campaign(c).gold).toBe(25);
    expect(combatAttributes(c).STR).toBe(base.STR + 5);
    expect(stats(c)).toEqual(base);
  });
  it("persists a complete battle in a validated character backup", () => {
    const c = act(startBattle(demoCharacter(), "mossfall-1"), {
      kind: "attack",
      target: 0,
    });
    expect(validateCharacter(JSON.parse(JSON.stringify(c)))).toBe(true);
    expect(
      validateCharacter({
        ...c,
        campaign: {
          ...campaign(c),
          battle: { ...campaign(c).battle, actor: 999 },
        },
      }),
    ).toBe(false);
  });
});

describe("class combat effects", () => {
  it("stuns a regular enemy for one turn", () => {
    const c = startBattle(demoCharacter(), "mossfall-1");
    const b = structuredClone(campaign(c).battle!);
    b.party[0].attack = 5;
    b.party[0].abilities = [
      { id: "bash", name: "Shield Bash", type: "bash", cost: 5, power: 1.15 },
    ];
    const first = takeAction(b, {
      kind: "ability",
      target: 0,
      abilityId: "bash",
    });
    expect(first.enemies[0].stun).toBe(1);
    const after = takeAction(first, { kind: "guard", target: 0 });
    expect(after.log.some((s) => s.includes("is stunned"))).toBe(true);
    expect(after.enemies[0].stun).toBe(0);
  });
  it("party wards protect companions through their own action", () => {
    const c = startBattle(demoCharacter(), "mossfall-1"),
      b = structuredClone(campaign(c).battle!);
    b.party[0].attack = 1;
    b.party[0].abilities = [
      { id: "ward", name: "Shield Wall", type: "ward", cost: 5, power: 1 },
    ];
    const protectedTurn = takeAction(
      takeAction(b, { kind: "ability", target: 0, abilityId: "ward" }),
      { kind: "attack", target: 0 },
    );
    const normalTurn = takeAction(
      takeAction(b, { kind: "attack", target: 0 }),
      { kind: "attack", target: 0 },
    );
    expect(protectedTurn.party[1].hp).toBeGreaterThan(normalTurn.party[1].hp);
  });
  it("class stance modifiers apply only inside combat", () => {
    const c = demoCharacter(),
      before = stats(c),
      sentinel = { ...c, activeClass: "sentinel" };
    const fighting = startBattle(sentinel, "mossfall-1");
    const hero = campaign(fighting).battle!.party.find((u) => u.id === "hero")!;
    expect(hero.maxHp).toBe(40 + combatAttributes(sentinel).CON * 5 + 25);
    expect(stats(fighting)).toEqual(before);
  });
});

describe("class signatures", () => {
  it("grants every class its own signature without purchasing it or using a loadout slot", async () => {
    const { CLASSES } = await import("./domain");
    for (const p of CLASSES) {
      const c = { ...demoCharacter(), activeClass: p.id },
        before = stats(c),
        battle = campaign(startBattle(c, "mossfall-1")).battle!;
      expect(
        battle.party[0].abilities.some(
          (a) => a.id === `signature-${p.id}` && a.name === p.signature.name,
        ),
      ).toBe(true);
      expect(campaign(c).equippedSkills).toHaveLength(0);
      expect(stats(c)).toEqual(before);
    }
  });
  it("makes prestige signatures stronger and removes an earlier signature when changing class", () => {
    const warrior = campaign(
      startBattle(demoCharacter(), "mossfall-1"),
    ).battle!;
    const c = { ...demoCharacter(), activeClass: "paladin" },
      b = campaign(startBattle(c, "mossfall-1")).battle!;
    expect(b.party[0].abilities.some((a) => a.id === "signature-warrior")).toBe(
      false,
    );
    expect(b.party[0].abilities[0].potency).toBe(1.2);
    expect(warrior.party[0].abilities[0].potency).toBe(1);
    const ordinary = structuredClone(b),
      prestige = structuredClone(b);
    for (const battle of [ordinary, prestige]) {
      battle.party[0].attack = 10;
      battle.party[0].magic = 10;
      battle.enemies[0].hp = battle.enemies[0].maxHp = 1000;
    }
    ordinary.party[0].abilities[0].potency = 1;
    const action = {
      kind: "ability" as const,
      target: 0,
      abilityId: "signature-paladin",
    };
    expect(takeAction(prestige, action).enemies[0].hp).toBeLessThan(
      takeAction(ordinary, action).enemies[0].hp,
    );
  });
  it("prevents non-combat career competencies from supplying combat attributes or commands", () => {
    const c = demoCharacter();
    c.earnedSkills = ["profession-technology-0"];
    c.campaign = {
      ...campaign(c),
      equippedSkills: ["profession-technology-0"],
    };
    expect(combatAttributes(c)).toEqual(
      combatAttributes({
        ...c,
        campaign: { ...campaign(c), equippedSkills: [] },
      }),
    );
    expect(
      campaign(startBattle(c, "mossfall-1")).battle!.party[0].abilities.some(
        (a) => a.id === "profession-technology-0",
      ),
    ).toBe(false);
  });
});
