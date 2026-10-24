import { describe, it, expect } from "vitest";
import {
  CLASSES,
  SKILLS,
  createCharacter,
  EMPTY_BASELINE,
  demoCharacter,
  stats,
  classLevel,
  professionLevel,
  objectives,
  switchClass,
  totalXP,
  adventurerXP,
  level,
  archetypeXP,
  available,
  classRequirements,
  learnSkill,
  skillPointsAvailable,
  skillWallet,
  upgradeProgression,
  awardSkills,
} from "./domain";
import { xpForLevel, levelFromXP, levelProgress } from "./progression";
import { CAREER_CATEGORIES, careerCategory } from "./careers";
import { CLASS_ROLES, COMBAT_EFFECTS } from "./class-roles";
import { validateCharacter } from "./storage";
import type { Character, Attribute } from "./domain";
function training(
  c: Character,
  classId: string,
  xp: number,
  scope: "class" | "profession" = "class",
) {
  let left = xp,
    index = 0;
  const completions = [...c.completions];
  while (left > 0) {
    const reward = Math.min(left, 100);
    completions.push({
      id: `training-${classId}-${index++}-${scope}`,
      period: "2026-01",
      at: "2026-01-01T12:00:00Z",
      xp: reward,
      stat: "STR" as Attribute,
      classId,
      title: "Training fixture",
      scope,
      ...(scope === "profession" ? { profession: c.profession } : {}),
    });
    left -= reward;
  }
  return { ...c, completions };
}
describe("uncapped progression and migration", () => {
  it("round trips exact boundaries above level 10,000 and increases the next cost", () => {
    for (const base of [100, 250])
      for (const lv of [1, 2, 5, 100, 1000, 10000]) {
        const xp = xpForLevel(lv, base);
        expect(levelFromXP(xp, base)).toBe(lv);
        if (lv > 1) expect(levelFromXP(xp - 1, base)).toBe(lv - 1);
        expect(levelProgress(xp, base).current).toBe(0);
        expect(
          xpForLevel(lv + 2, base) - xpForLevel(lv + 1, base),
        ).toBeGreaterThan(xpForLevel(lv + 1, base) - xp);
      }
  });
  it("gives only one stat at each fifth level and distributes hybrid milestones", () => {
    const initial = { ...demoCharacter(), activeClass: "paladin" };
    let c = training(initial, "paladin", xpForLevel(4));
    expect(stats(c)).toEqual(c.baseStats);
    c = training(initial, "paladin", xpForLevel(5));
    expect(stats(c).STR).toBe(c.baseStats.STR + 1);
    c = training(initial, "paladin", xpForLevel(10));
    expect(stats(c).STR).toBe(c.baseStats.STR + 1);
    expect(stats(c).WIS).toBe(c.baseStats.WIS + 1);
    c = training(initial, "paladin", xpForLevel(50));
    expect(stats(c).STR - c.baseStats.STR).toBe(7);
    expect(stats(c).WIS - c.baseStats.WIS).toBe(3);
  });
  it("retains a v1.1 save’s levels, attributes, earned skills, and point balances exactly once", () => {
    let old = training(demoCharacter(), "warrior", 900);
    old = training(old, "warrior", 400, "profession");
    delete old.progressionVersion;
    delete old.vocation;
    delete old.unlockedClasses;
    old.earnedSkills = [
      "warrior-root",
      "sub-warpriest",
      "network-intermediate",
    ];
    old.learnedSkills = ["warrior-root"];
    old.skillPurchases = [
      { id: "warrior-root", wallet: "class:warrior", cost: 1 },
    ];
    old.subclass = "warpriest";
    const rawXP = totalXP(old),
      next = upgradeProgression(old);
    expect(classLevel(next, "warrior")).toBe(10);
    expect(professionLevel(next)).toBe(5);
    expect(level(adventurerXP(next))).toBe(6);
    expect(stats(next).STR).toBe(old.baseStats.STR + 9);
    expect(stats(next).INT).toBe(old.baseStats.INT + 4);
    expect(next.completions).toEqual(old.completions);
    expect(totalXP(next)).toBe(rawXP);
    expect(next.earnedSkills).toEqual(old.earnedSkills);
    expect(next.subclass).toBe("warpriest");
    expect(skillPointsAvailable(next, "combat")).toBe(53);
    expect(upgradeProgression(next)).toBe(next);
    expect(validateCharacter(JSON.parse(JSON.stringify(next)))).toBe(true);
  });
  it("preserves raw XP, vocation, learned skills and earlier records on prestige promotion", () => {
    let c = training(demoCharacter(), "warrior", xpForLevel(15));
    c = training(c, "disciple", xpForLevel(10));
    c.baseStats = { STR: 20, DEX: 20, CON: 20, INT: 20, WIS: 20, CHA: 20 };
    c.earnedSkills = ["arc-fighter-1"];
    const xp = totalXP(c),
      prior = classLevel(c, "warrior"),
      base = stats(c),
      next = switchClass(c, "paladin");
    expect(next.activeClass).toBe("paladin");
    expect(classLevel(next, "paladin")).toBe(1);
    expect(classLevel(next, "warrior")).toBe(prior);
    expect(totalXP(next)).toBe(xp);
    expect(stats(next)).toEqual(base);
    expect(next.vocation).toBe("networking");
    expect(next.earnedSkills).toContain("arc-fighter-1");
  });
});
describe("class and career catalogs", () => {
  it("exposes open starters, mixed requirements, unique signatures, and complete prestige chains", () => {
    expect(CLASSES).toHaveLength(51);
    expect(new Set(CLASSES.map((p) => p.id)).size).toBe(CLASSES.length);
    expect(new Set(CLASSES.map((p) => p.signature.name)).size).toBe(
      CLASSES.length,
    );
    const beginner = createCharacter(
      "Test",
      EMPTY_BASELINE,
      "warrior",
      "Analyst",
    );
    expect(
      CLASSES.filter((p) => p.tier === "Basic").every((p) =>
        available(p, stats(beginner), 0, beginner),
      ),
    ).toBe(true);
    expect(
      available(
        CLASSES.find((p) => p.id === "paladin")!,
        stats(beginner),
        0,
        beginner,
      ),
    ).toBe(false);
    expect(
      createCharacter("Test", EMPTY_BASELINE, "paladin", "Analyst")
        .unlockedClasses,
    ).not.toContain("paladin");
    for (const p of CLASSES) {
      expect(Object.values(p.mix).reduce((n, v) => n + v!, 0)).toBe(100);
      expect(p.goal.length).toBeGreaterThan(30);
      expect(CLASS_ROLES[p.id]).toBeDefined();
      expect(COMBAT_EFFECTS[p.signature.effect]).toBeDefined();
      for (const r of p.classRequirements || [])
        expect(CLASSES.some((c) => c.id === r.id)).toBe(true);
      for (const id of p.requiredSkills || [])
        expect(SKILLS.some((s) => s.id === id)).toBe(true);
      if (["Prestige", "Ascendant"].includes(p.tier))
        expect(p.classRequirements?.length).toBeGreaterThan(0);
    }
    expect(CLASSES.some((p) => p.professionCategories?.length)).toBe(true);
    expect(CLASSES.some((p) => p.requiredSkills?.length)).toBe(true);
  });
  it("enforces skills and career requirements in addition to attributes", () => {
    const c = demoCharacter(),
      p = CLASSES.find((p) => p.id === "network-weaver")!;
    expect(classRequirements(p, stats(c), 0, c).some((r) => !r.met)).toBe(true);
    const unlocked = awardSkills({
      ...c,
      earnedSkills: ["network-intermediate"],
    });
    expect(available(p, stats(unlocked), 0, unlocked)).toBe(true);
    const engineer = CLASSES.find((p) => p.id === "engineer")!;
    expect(available(engineer, stats(c), 0, c)).toBe(false);
    expect(
      available(engineer, stats(c), 0, {
        ...c,
        profession: "Network Engineer",
      }),
    ).toBe(true);
  });
  it("shares archetype training and career trees across relevant roles", () => {
    let c = training(demoCharacter(), "warrior", 1000);
    c = training(c, "paladin", 1000);
    expect(archetypeXP(c, "fighter")).toBe(1700);
    expect(archetypeXP(c, "cleric")).toBe(300);
    expect(CAREER_CATEGORIES).toHaveLength(20);
    for (const g of CAREER_CATEGORIES) {
      const skills = SKILLS.filter(
        (s) => !s.legacy && s.owner === g.id && s.category === "profession",
      );
      expect(skills).toHaveLength(10);
      expect(skills.every((s) => s.nonCombat && !s.combat)).toBe(true);
      expect(new Set(skills.map((s) => s.description)).size).toBe(10);
    }
    expect(careerCategory("Analyst").id).toBe(
      careerCategory("Business Analyst").id,
    );
    const a = SKILLS.find((s) => s.id === "profession-business-0")!;
    expect(skillWallet(c, a)).toBe(
      skillWallet({ ...c, profession: "Business Analyst" }, a),
    );
  });
  it("requires multi-point purchases, charges shared combat points once, and leaves base stats unchanged", () => {
    const c = training(demoCharacter(), "warrior", 600),
      base = stats(c),
      before = skillPointsAvailable(c, "combat");
    const untrained = demoCharacter();
    expect(learnSkill(untrained, "arc-fighter-1")).toBe(untrained);
    const next = learnSkill(c, "arc-fighter-1");
    expect(next).not.toBe(c);
    expect(skillPointsAvailable(next, "combat")).toBe(before - 4);
    expect(stats(next)).toEqual(base);
    expect(learnSkill(next, "arc-fighter-1")).toBe(next);
  });
  it("validates independent vocations and rejects malformed upgrade credits", () => {
    const c = demoCharacter();
    expect(validateCharacter({ ...c, vocation: "invented" })).toBe(false);
    expect(
      validateCharacter({
        ...c,
        legacyProgress: {
          adventurerXP: 0,
          classes: { warrior: -1 },
          professions: {},
          stats: {},
          skillPoints: {},
        },
      }),
    ).toBe(false);
    const different = { ...c, profession: "Teacher", vocation: "networking" };
    expect(validateCharacter(different)).toBe(true);
    expect(
      objectives(different).some((o) => o.id === "vocation-networking-daily"),
    ).toBe(true);
  });
});
