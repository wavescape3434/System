import { describe, expect, it } from "vitest";
import {
  EMPTY_BASELINE,
  createCharacter,
  demoCharacter,
  startingStats,
  totalXP,
  objectives,
  complete,
  isComplete,
  period,
  switchClass,
  classXP,
  classLevel,
  stats,
  available,
  CLASSES,
  rank,
  awardSkills,
  learnSkill,
  skillPointsAvailable,
  professionLevel,
  rankXP,
  RANKS,
  selectSubclass,
  hasSkill,
  SKILLS,
} from "./domain";
import { validateCharacter } from "./storage";
const now = new Date(2026, 9, 23, 12);
describe("baseline and eligibility", () => {
  it("allows a beginner with no equipment to start without testing", () => {
    const c = createCharacter("Ari", EMPTY_BASELINE, "disciple", "Analyst");
    expect(Object.values(c.baseStats)).toEqual([3, 3, 3, 3, 3, 3]);
    expect(c.activeClass).toBe("disciple");
    expect(rank(totalXP(c)).name).toBe("F");
    expect(validateCharacter(c)).toBe(true);
  });
  it("supports weighted strength and clamps extreme scores", () => {
    const s = startingStats({
      ...EMPTY_BASELINE,
      mode: "weights",
      bodyweight: 70,
      load: 50,
      reps: 8,
    });
    expect(s.STR).toBeGreaterThan(3);
    expect(
      Math.max(
        ...Object.values(
          startingStats({
            ...EMPTY_BASELINE,
            pushups: 9999,
            walk: 9999,
            squats: 9999,
          }),
        ),
      ),
    ).toBeLessThanOrEqual(30);
  });
  it("enforces prerequisites for initial and advanced classes", () => {
    expect(
      createCharacter("A", EMPTY_BASELINE, "paladin", "Analyst").activeClass,
    ).toBe("disciple");
    expect(
      available(
        CLASSES.find((p) => p.id === "paladin")!,
        demoCharacter().baseStats,
        0,
      ),
    ).toBe(false);
  });
});
describe("real-world rewards and calendar recurrence", () => {
  it("awards daily XP once, even if the caller changes the reward", () => {
    const c = demoCharacter(),
      o = objectives(c)[0];
    const next = complete(c, { ...o, xp: 9999 }, now);
    expect(totalXP(next)).toBe(30);
    expect(complete(next, o, now)).toBe(next);
    expect(isComplete(next, o, now)).toBe(true);
  });
  it("refreshes daily rewards without losing lifetime progress", () => {
    const c = demoCharacter(),
      o = objectives(c)[0],
      next = complete(c, o, now),
      tomorrow = new Date(2026, 9, 24, 12);
    expect(isComplete(next, o, tomorrow)).toBe(false);
    expect(totalXP(complete(next, o, tomorrow))).toBe(60);
  });
  it("uses local calendar Mondays across year boundaries", () => {
    expect(period("weekly", new Date(2027, 0, 1))).toBe("2026-12-28");
    expect(period("weekly", new Date(2027, 0, 3))).toBe("2026-12-28");
    expect(period("weekly", new Date(2027, 0, 4))).toBe("2027-01-04");
  });
  it("refreshes monthly rewards on the first", () => {
    const c = demoCharacter(),
      o = objectives(c).find((x) => x.cadence === "monthly")!;
    expect(complete(c, o, now)).toBe(c);
    c.milestones[`${o.id}:${period(o.cadence, now)}`] = [0, 1, 2];
    const next = complete(c, o, now);
    expect(isComplete(next, o, new Date(2026, 9, 31))).toBe(true);
    expect(isComplete(next, o, new Date(2026, 10, 1))).toBe(false);
  });
  it("ignores invented objectives", () => {
    const c = demoCharacter();
    expect(complete(c, { ...objectives(c)[0], id: "invented" }, now)).toBe(c);
  });
  it("grows the rewarded attribute after 100 XP", () => {
    let c = demoCharacter();
    const base = c.baseStats.STR;
    for (let d = 1; d <= 4; d++)
      c = complete(c, objectives(c)[0], new Date(2026, 9, d));
    expect(stats(c).STR).toBe(base + 1);
    expect(classLevel(c, "warrior")).toBe(2);
  });
});
describe("permanent character history", () => {
  it("preserves class levels and XP when switching away and back", () => {
    let c = demoCharacter();
    for (let d = 1; d <= 4; d++)
      c = complete(c, objectives(c)[0], new Date(2026, 9, d));
    c = { ...c, subclass: "warpriest" };
    const xp = totalXP(c);
    c = switchClass(c, "bard");
    expect(c.activeClass).toBe("bard");
    expect(c.subclass).toBe(null);
    expect(classXP(c, "warrior")).toBe(120);
    expect(totalXP(c)).toBe(xp);
    c = switchClass(c, "warrior");
    expect(classLevel(c, "warrior")).toBe(2);
  });
  it("unlocks the intermediate networking skill through a recorded CCNA and retains it", () => {
    let c = demoCharacter();
    const skill = SKILLS.find((x) => x.id === "network-intermediate")!;
    expect(hasSkill(c, skill)).toBe(false);
    c.certificates.push({
      id: "proof",
      name: "CCNA",
      issuer: "Cisco",
      date: "2026-10-01",
      reference: "self-reported",
    });
    c = awardSkills(c);
    expect(hasSkill(c, skill)).toBe(true);
    c.certificates = [];
    expect(hasSkill(c, skill)).toBe(true);
  });
  it("does not unlock certifications from ordinary study XP", () => {
    let c = demoCharacter();
    for (let d = 1; d <= 3; d++)
      c = complete(
        c,
        objectives(c).find((o) => o.id === "network-daily")!,
        new Date(2026, 9, d),
      );
    c = awardSkills(c);
    expect(c.earnedSkills).not.toContain("network-initiate");
    c = learnSkill(c, "network-initiate");
    expect(c.earnedSkills).toContain("network-initiate");
    expect(c.earnedSkills).not.toContain("network-intermediate");
  });
  it("changes objectives with a subclass and keeps the profession independent", () => {
    const c = { ...demoCharacter(), subclass: "warpriest" };
    expect(
      objectives(c).some((o) => o.id === "warpriest-daily" && o.stat === "WIS"),
    ).toBe(true);
    expect(switchClass(c, "scholar").profession).toBe("Analyst");
  });
});
describe("revised progression rules", () => {
  it("doubles the cost of each rank promotion", () => {
    const costs = RANKS.slice(1).map((r, i) => r.xp - RANKS[i].xp);
    expect(costs[0]).toBe(500);
    for (let i = 1; i < costs.length; i++)
      expect(costs[i]).toBe(costs[i - 1] * 2);
  });
  it("keeps ordinary assessments at F and caps exceptional placement at D without granting XP", () => {
    const normal = demoCharacter();
    expect(normal.startingRank).toBe("F");
    const high = createCharacter(
      "Test",
      {
        ...EMPTY_BASELINE,
        pushups: 120,
        squats: 120,
        walk: 180,
        balance: 180,
        reading: 1200,
        reflection: 7,
        connection: 30,
      },
      "warrior",
      "Analyst",
    );
    expect(high.startingRank).toBe("D");
    expect(totalXP(high)).toBe(0);
    expect(rankXP(high)).toBe(1500);
  });
  it("changes base stats only at relevant class or profession levels or special rewards", () => {
    let c = demoCharacter(),
      s = stats(c);
    c = complete(
      c,
      objectives(c).find((o) => o.id === "reflection-daily")!,
      now,
    );
    expect(stats(c)).toEqual(s);
    c = complete(
      c,
      objectives(c).find((o) => o.id === "network-weekly")!,
      now,
    );
    expect(professionLevel(c)).toBe(2);
    expect(stats(c).INT).toBe(s.INT + 1);
    expect(stats(c).WIS).toBe(s.WIS);
    const before = stats(c);
    c = complete(
      c,
      objectives(c).find((o) => o.id === "warrior-review-weekly")!,
      now,
    );
    expect(stats(c).WIS).toBe(before.WIS + 1);
  });
  it("debits the correct skill wallet once and never changes base stats when purchasing", () => {
    let c = demoCharacter();
    for (let d = 1; d <= 3; d++)
      c = complete(
        c,
        objectives(c).find((o) => o.id === "network-daily")!,
        new Date(2026, 9, d),
      );
    const s = stats(c),
      before = skillPointsAvailable(c, `profession:${c.profession}`);
    c = learnSkill(c, "network-initiate");
    expect(stats(c)).toEqual(s);
    expect(skillPointsAvailable(c, `profession:${c.profession}`)).toBe(
      before - 1,
    );
    expect(learnSkill(c, "network-initiate")).toBe(c);
  });
  it("requires prerequisite nodes and unlocked level sections", () => {
    const c = demoCharacter();
    expect(learnSkill(c, "warrior-branch-0")).toBe(c);
    expect(learnSkill(c, "network-master")).toBe(c);
  });
  it("contains valid, acyclic branching skill trees", () => {
    expect(SKILLS.length).toBeGreaterThan(200);
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(SKILLS.length);
    const visit = (id: string, path: string[] = []) => {
      expect(path).not.toContain(id);
      const s = SKILLS.find((s) => s.id === id);
      expect(s).toBeDefined();
      for (const p of s!.parents) visit(p, [...path, id]);
    };
    for (const s of SKILLS) visit(s.id);
  });
  it("loads old characters without inventing a campaign or deleting history", () => {
    const old = JSON.parse(JSON.stringify(demoCharacter()));
    delete old.startingRank;
    delete old.learnedSkills;
    delete old.skillPurchases;
    expect(validateCharacter(old)).toBe(true);
  });
});
describe("backup validation", () => {
  it("accepts a complete round trip and rejects corrupt or duplicate rewards", () => {
    const c = complete(demoCharacter(), objectives(demoCharacter())[0], now);
    expect(validateCharacter(JSON.parse(JSON.stringify(c)))).toBe(true);
    expect(validateCharacter({ ...c, activeClass: "invalid" })).toBe(false);
    expect(
      validateCharacter({
        ...c,
        completions: [...c.completions, ...c.completions],
      }),
    ).toBe(false);
    expect(
      validateCharacter({
        ...c,
        journal: [{ id: "x", at: "invalid", text: "test" }],
      }),
    ).toBe(false);
    expect(
      validateCharacter({ ...c, baseStats: { ...c.baseStats, STR: NaN } }),
    ).toBe(false);
  });
});

describe("class and profession focus", () => {
  it("subclass selection adds content without changing base attributes", () => {
    let c = demoCharacter();
    const goal = objectives(c).find((o) => o.id === "warrior-monthly")!;
    c.milestones[`${goal.id}:${period(goal.cadence, now)}`] = [0, 1, 2];
    c = complete(c, goal, now);
    const before = stats(c),
      next = selectSubclass(c, "warpriest");
    expect(next.subclass).toBe("warpriest");
    expect(stats(next)).toEqual(before);
    expect(objectives(next).filter((o) => o.scope === "subclass")).toHaveLength(
      3,
    );
  });
  it("profession stat gains remain when selecting another profession", () => {
    let c = demoCharacter();
    c = complete(
      c,
      objectives(c).find((o) => o.id === "network-weekly")!,
      now,
    );
    const before = stats(c);
    c = { ...c, profession: "Teacher" };
    expect(professionLevel(c)).toBe(1);
    expect(stats(c)).toEqual(before);
  });
});
