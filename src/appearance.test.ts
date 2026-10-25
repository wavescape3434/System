import { describe, it, expect } from "vitest";
import {
  CHARACTER_APPEARANCES,
  characterAppearance,
  unitAppearance,
  COMPANION_APPEARANCES,
  findAppearance,
} from "./appearance-catalog";
import { selectAppearance } from "./appearance";
import { demoCharacter, stats, totalXP, switchClass } from "./domain";
import { campaign, startBattle, combatAttributes } from "./rpg";
import { validateCharacter } from "./storage";
import atlas from "./character-frames.json";
describe("character appearances", () => {
  it("offers 24 unique complete atlas frames, both silhouettes and all style groups", () => {
    expect(CHARACTER_APPEARANCES).toHaveLength(24);
    expect(new Set(CHARACTER_APPEARANCES.map((a) => a.id)).size).toBe(24);
    expect(new Set(CHARACTER_APPEARANCES.map((a) => a.cell)).size).toBe(24);
    expect(new Set(CHARACTER_APPEARANCES.map((a) => a.silhouette)).size).toBe(
      2,
    );
    expect(new Set(CHARACTER_APPEARANCES.map((a) => a.group)).size).toBe(4);
    expect(atlas.frames).toHaveLength(24);
    for (const frame of atlas.frames) {
      expect(frame.x).toBeGreaterThanOrEqual(0);
      expect(frame.y).toBeGreaterThanOrEqual(0);
      expect(frame.x + frame.width).toBeLessThanOrEqual(atlas.width);
      expect(frame.y + frame.height).toBeLessThanOrEqual(atlas.height);
      expect(frame.height).toBeGreaterThan(200);
      expect(frame.clip).toMatch(/^M.* Z$/);
    }
  });
  it("retains old saves and supplies class defaults without changing stats or progression", () => {
    const old = demoCharacter();
    expect(old.appearance).toBeUndefined();
    expect(validateCharacter(old)).toBe(true);
    expect(characterAppearance(old).id).toBe("dawnblade");
    const base = stats(old),
      xp = totalXP(old),
      next = selectAppearance(old, "moonsilk-dancer");
    expect(characterAppearance(next).id).toBe("moonsilk-dancer");
    expect(stats(next)).toEqual(base);
    expect(totalXP(next)).toBe(xp);
    expect(next.activeClass).toBe(old.activeClass);
    expect(next.completions).toBe(old.completions);
    expect(validateCharacter(JSON.parse(JSON.stringify(next)))).toBe(true);
    expect(selectAppearance(old, "unlisted")).toBe(old);
    expect(selectAppearance(next, "moonsilk-dancer")).toBe(next);
  });
  it("keeps a chosen appearance on a class switch and applies it to the next battle without changing class abilities", () => {
    const c = selectAppearance(demoCharacter(), "velvet-enchantress"),
      bard = switchClass(
        { ...c, unlockedClasses: [...(c.unlockedClasses || []), "bard"] },
        "bard",
      );
    expect(bard.activeClass).toBe("bard");
    expect(bard.appearance).toBe(c.appearance);
    const next = startBattle(bard, "mossfall-1"),
      hero = campaign(next).battle!.party[0];
    expect(hero.appearance).toBe("velvet-enchantress");
    expect(hero.sprite).toBe("bard");
    expect(hero.abilities[0].id).toBe("signature-bard");
    expect(unitAppearance(hero)?.id).toBe("velvet-enchantress");
  });
  it("updates an ongoing battle cosmetically while retaining damage, MP, turn order, inventory, and base/combat stats", () => {
    const c = startBattle(demoCharacter(), "mossfall-1");
    c.campaign!.battle!.party[0].hp -= 20;
    c.campaign!.battle!.party[0].mp -= 4;
    const before = structuredClone(c),
      next = selectAppearance(c, "crimson-corsair");
    expect(next.campaign!.battle!.party[0]).toEqual({
      ...before.campaign!.battle!.party[0],
      appearance: "crimson-corsair",
    });
    expect(next.campaign!.battle!.party.slice(1)).toEqual(
      before.campaign!.battle!.party.slice(1),
    );
    expect(next.campaign!.battle!.enemies).toEqual(
      before.campaign!.battle!.enemies,
    );
    expect(next.campaign!.battle!.actor).toBe(before.campaign!.battle!.actor);
    expect(next.campaign!.inventory).toEqual(before.campaign!.inventory);
    expect(stats(next)).toEqual(stats(c));
    expect(combatAttributes(next)).toEqual(combatAttributes(c));
    expect(c).toEqual(before);
    expect(validateCharacter(next)).toBe(true);
  });
  it("gives every companion a distinct valid design, leaves monsters as monsters, and rejects malformed saved style ids", () => {
    expect(new Set(Object.values(COMPANION_APPEARANCES)).size).toBe(7);
    for (const [id, appearance] of Object.entries(COMPANION_APPEARANCES)) {
      expect(findAppearance(appearance)).toBeDefined();
      expect(unitAppearance({ id, sprite: id })?.id).toBe(appearance);
    }
    expect(unitAppearance({ id: "enemy-0", sprite: "wolf" })).toBeUndefined();
    const c = demoCharacter();
    expect(validateCharacter({ ...c, appearance: "no-such-design" })).toBe(
      false,
    );
    const fighting = startBattle(c, "mossfall-1");
    fighting.campaign!.battle!.party[0].appearance = "no-such-design";
    expect(validateCharacter(fighting)).toBe(false);
  });
});
