import { describe, it, expect } from "vitest";
import {
  demoCharacter,
  legacyDemoCharacter,
  objectives,
  complete,
  takeRequest,
  completeTaken,
  takenObjectives,
  switchClass,
  classXP,
  classLevel,
  stats,
  totalXP,
  awardSkills,
  upgradeTraining,
  available,
  CLASSES,
  qualificationRequirements,
  transferableXP,
  professionXP,
  professionLevel,
  objectivePeriod,
  classProgress,
  startingRankFor,
  careerXP,
} from "./domain";
import {
  EMPTY_ASSESSMENT,
  assessmentResults,
  assessedStats,
  referenceIndex,
  MIND_CHECKS,
  checkScore,
  predictedWalk,
  gripReference,
  validAssessment,
  assessmentErrors,
} from "./metrics";
import { TASK_XP, milestonePoints } from "./task-ranks";
import { validateCharacter } from "./storage";
const now = new Date(2026, 9, 23, 12);
const find = (c: ReturnType<typeof demoCharacter>, id: string) =>
  objectives(c).find((o) => o.id === id)!;
function claim(c: ReturnType<typeof demoCharacter>, id: string, at = now) {
  c = takeRequest(c, id, at);
  const o = find(c, id);
  if (o.checklist)
    c = {
      ...c,
      milestones: {
        ...c.milestones,
        [`${id}:${objectivePeriod(o, at)}`]: o.checklist.map((_, i) => i),
      },
    };
  return awardSkills(completeTaken(c, o, at));
}
describe("reference-centred assessment", () => {
  it("uses neutral unassessed values of 10 without treating unknown measurements as zero ability", () => {
    const values = assessedStats({ ...EMPTY_ASSESSMENT });
    expect(Object.values(values)).toEqual([10, 10, 10, 10, 10, 10]);
    expect(
      assessmentResults({ ...EMPTY_ASSESSMENT }).every((r) => !r.measured),
    ).toBe(true);
    expect(assessedStats({ ...EMPTY_ASSESSMENT, pushups: 0 }).STR).toBe(1);
  });
  it("has no numeric ceiling and keeps weight and bodyweight protocols distinct", () => {
    expect(referenceIndex(20, 20)).toBe(10);
    expect(referenceIndex(1000, 20)).toBeGreaterThan(100);
    const weighted = assessmentResults({
      ...EMPTY_ASSESSMENT,
      strengthTest: "weighted",
      liftKg: 60,
      liftReps: 8,
      massKg: 80,
    });
    expect(weighted[0].evidence).toBe("provisional");
    expect(weighted[0].measured).toBe(true);
    expect(
      assessmentResults({
        ...EMPTY_ASSESSMENT,
        strengthTest: "weighted",
        liftKg: 60,
        liftReps: 30,
        massKg: 80,
      })[0].measured,
    ).toBe(false);
  });
  it("uses the published walk equation only within its age range and with all required reference inputs", () => {
    const a = {
      ...EMPTY_ASSESSMENT,
      age: 60,
      sex: "male" as const,
      heightCm: 170,
      massKg: 75,
    };
    expect(predictedWalk(a)).toBeCloseTo(544.7, 1);
    expect(predictedWalk({ ...a, age: 18 })).toBeNull();
    expect(predictedWalk({ ...a, sex: "unspecified" })).toBeNull();
    const score = assessedStats({ ...a, walkMetres: predictedWalk(a) });
    expect(score.CON).toBe(10);
  });
  it("scores original learning, judgment, and communication questions from answers", () => {
    for (const stat of ["INT", "WIS", "CHA"] as const) {
      const answers = MIND_CHECKS[stat].questions.map((q) => q.answer);
      expect(checkScore(stat, answers, MIND_CHECKS[stat].id)).toBe(5);
      const result = assessmentResults({
        ...EMPTY_ASSESSMENT,
        mental: {
          [stat]: {
            answers,
            formId: MIND_CHECKS[stat].id,
            completedAt: now.toISOString(),
          },
        },
      }).find((r) => r.stat === stat)!;
      expect(result.value).toBeGreaterThan(10);
      expect(result.evidence).toBe("provisional");
    }
  });
});
describe("published reference coverage and validation", () => {
  it("uses table means for each sex, interpolates supported adult ages, and never extrapolates grip norms", () => {
    const a = {
      ...EMPTY_ASSESSMENT,
      strengthTest: "grip" as const,
      age: 30,
      sex: "male" as const,
      gripKg: 51.6,
    };
    expect(gripReference(a)).toBe(51.6);
    expect(assessedStats(a).STR).toBe(10);
    expect(gripReference({ ...a, sex: "female" })).toBe(31.4);
    expect(gripReference({ ...a, age: 32 })).toBe(51.6);
    expect(gripReference({ ...a, age: 18 })).toBeNull();
    expect(gripReference({ ...a, age: 95 })).toBeNull();
    expect(
      assessmentResults({ ...a, sex: "female", gripKg: 31.4 })[0].evidence,
    ).toBe("published");
  });
  it("uses a young-adult chair sample only with the matching unassisted protocol", () => {
    const a = {
      ...EMPTY_ASSESSMENT,
      strengthTest: "chair" as const,
      age: 25,
      chairStands: 33,
    };
    expect(assessedStats(a).STR).toBe(10);
    expect(assessmentResults(a)[0].evidence).toBe("published");
    expect(assessmentResults({ ...a, age: 60 })[0].evidence).toBe(
      "provisional",
    );
    expect(assessmentResults({ ...a, chairAssisted: true })[0].evidence).toBe(
      "provisional",
    );
  });
  it("provides a younger-adult walk prediction without extrapolating height and mass", () => {
    const a = {
      ...EMPTY_ASSESSMENT,
      age: 30,
      sex: "male" as const,
      heightCm: 175,
      massKg: 75,
    };
    expect(predictedWalk(a)).toBeCloseTo(622.89906, 3);
    expect(predictedWalk({ ...a, heightCm: 120 })).toBeNull();
    expect(predictedWalk({ ...a, massKg: 200 })).toBeNull();
  });
  it("rejects malformed saved checks and flags unusable form inputs", () => {
    expect(validAssessment({ ...EMPTY_ASSESSMENT, gripKg: NaN })).toBe(false);
    expect(validAssessment({ ...EMPTY_ASSESSMENT, chairAssisted: "yes" })).toBe(
      false,
    );
    expect(
      assessmentErrors({ ...EMPTY_ASSESSMENT, heightCm: 0 }).length,
    ).toBeGreaterThan(0);
    expect(
      assessmentErrors({ ...EMPTY_ASSESSMENT, pushups: 2.5 }).length,
    ).toBeGreaterThan(0);
  });
  it("leaves ordinary references at F and supports exceptional placements without requiring impossible quiz scores", () => {
    expect(
      startingRankFor({ STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }),
    ).toBe("F");
    expect(
      startingRankFor({ STR: 24, DEX: 13, CON: 13, INT: 13, WIS: 13, CHA: 13 }),
    ).toBe("E");
    expect(
      startingRankFor({ STR: 36, DEX: 14, CON: 14, INT: 15, WIS: 15, CHA: 15 }),
    ).toBe("D");
  });
});
describe("difficulty, routing, and class mastery", () => {
  it("prices workloads by rank and gates exceptional pull-up volume by measured capacity and equipment", () => {
    let c = demoCharacter();
    const push = find(c, "u-floor-push-20"),
      pull = find(c, "u-pullup-20");
    expect(push.rank).toBe("C");
    expect(push.xp).toBe(150);
    expect(pull.rank).toBe("S");
    expect(pull.xp).toBe(32400);
    expect(pull.cadence).toBe("monthly");
    expect(takeRequest(c, pull.id, now)).toBe(c);
    c = {
      ...c,
      preferences: {
        units: "metric",
        textSize: "standard",
        reduceMotion: false,
        showLockedRequests: true,
        defaultPage: "guild",
        equipment: ["bodyweight", "pullup-bar"],
      },
      baseline: {
        ...c.baseline,
        assessment: { ...c.baseline.assessment!, pullups: 30 },
      },
    };
    expect(takeRequest(c, pull.id, now)).not.toBe(c);
    expect(TASK_XP.SSS).toBeGreaterThan(TASK_XP.S);
  });
  it("awards player XP once, grants relevant class credit, and holds class levels until specific work is completed", () => {
    let c = demoCharacter();
    c = claim(c, "u-floor-push-20");
    expect(totalXP(c)).toBe(150);
    expect(classXP(c, "warrior")).toBe(75);
    expect(classLevel(c, "warrior")).toBe(1);
    c = claim(c, "warrior-daily");
    expect(totalXP(c)).toBe(210);
    expect(classLevel(c, "warrior")).toBe(2);
  });
  it("lets harder work progress faster without awarding stat points just for taking a request", () => {
    const c = demoCharacter(),
      before = stats(c),
      taken = takeRequest(c, "u-floor-push-20", now);
    expect(stats(taken)).toEqual(before);
    const light = claim(c, "u-wall-push"),
      hard = claim(c, "u-floor-push-20");
    expect(totalXP(hard)).toBeGreaterThan(totalXP(light) * 10);
    expect(stats(hard)).toEqual(before);
  });
  it("prevents repeated variants from paying twice for the same movement group and respects recovery", () => {
    let c = claim(demoCharacter(), "u-floor-push-20");
    expect(takeRequest(c, "u-incline-push", now)).toBe(c);
    expect(
      takeRequest(c, "u-floor-push-20", new Date(now.getTime() + 25 * 3600000)),
    ).toBe(c);
    expect(
      takeRequest(c, "u-floor-push-20", new Date(now.getTime() + 49 * 3600000)),
    ).not.toBe(c);
  });
  it("requires an entry trial, applies fractional transfer, and starts the newly activated class at level 1", () => {
    let c = demoCharacter();
    c = claim(c, "u-spaced-recall");
    const scholar = CLASSES.find((p) => p.id === "scholar")!;
    expect(
      qualificationRequirements(scholar, stats(c), totalXP(c), c).every(
        (r) => r.met,
      ),
    ).toBe(true);
    expect(available(scholar, stats(c), totalXP(c), c)).toBe(false);
    expect(switchClass(c, "scholar")).toBe(c);
    expect(transferableXP(c, "scholar")).toBe(15);
    c = claim(c, "trial-scholar-entry");
    expect(available(scholar, stats(c), totalXP(c), c)).toBe(true);
    c = switchClass(c, "scholar");
    expect(classLevel(c, "scholar")).toBe(1);
    expect(c.classEntries?.scholar.credit).toBe(15);
    expect(validateCharacter(c)).toBe(true);
  });
  it("credits relevant universal work to a profession without bypassing profession practice", () => {
    let c = claim(demoCharacter(), "u-spaced-recall");
    expect(professionXP(c, "Analyst")).toBe(15);
    expect(professionLevel(c, "Analyst")).toBe(1);
    expect(totalXP(c)).toBe(60);
  });
  it("routes universal learning to an independent vocation without duplicating same-discipline credit", () => {
    let c: ReturnType<typeof demoCharacter> = {
      ...demoCharacter(),
      profession: "Teacher",
      vocation: "networking",
    };
    c = claim(c, "u-spaced-recall");
    expect(careerXP(c, "technology")).toBe(15);
    expect(c.completions[0].vocationCredit?.id).toBe("networking");
    expect(
      careerXP(claim(demoCharacter(), "u-spaced-recall"), "technology"),
    ).toBe(15);
    expect(validateCharacter(c)).toBe(true);
  });
  it("shows retained XP awaiting class work against the actual class level", () => {
    let c2 = claim(demoCharacter(), "u-floor-push-20", now);
    c2 = claim(c2, "u-floor-push-20", new Date(now.getTime() + 49 * 3600000));
    expect(classLevel(c2, "warrior")).toBe(1);
    expect(classProgress(c2, "warrior").waiting).toBe(true);
    expect(classProgress(c2, "warrior").current).toBe(
      classProgress(c2, "warrior").needed,
    );
  });
  it("preserves existing levels, attributes, purchases, and raw XP on migration", () => {
    let old = legacyDemoCharacter();
    for (let d = 1; d <= 12; d++)
      old = complete(old, objectives(old)[0], new Date(2026, 8, d));
    old = awardSkills(old);
    const before = stats(old),
      xp = totalXP(old),
      lv = classLevel(old, "warrior");
    const next = upgradeTraining(old);
    expect(stats(next)).toEqual(before);
    expect(totalXP(next)).toBe(xp);
    expect(classLevel(next, "warrior")).toBe(lv);
    expect(next.earnedSkills).toEqual(old.earnedSkills);
    expect(validateCharacter(next)).toBe(true);
    expect(upgradeTraining(next)).toBe(next);
  });
  it("expires calendar adventure acceptance at the boundary and retains its achievement requirement", () => {
    let c = takeRequest(demoCharacter(), "u-strength-sss", now);
    const o = find(c, "u-strength-sss");
    expect(o.once).toBe(true);
    expect(
      takenObjectives(c, new Date(2027, 0, 1)).some((t) => t.id === o.id),
    ).toBe(false);
    c.milestones[`${o.id}:once`] = [0, 1, 2, 3];
    expect(completeTaken(c, o, new Date(2027, 0, 1))).toBe(c);
    expect(validateCharacter(c)).toBe(true);
    expect(milestonePoints(50)).toBe(65);
  });
  it("excludes irrelevant technical tasks and preserves old taken commitments at their original price", () => {
    const c = { ...demoCharacter(), profession: "Teacher", vocation: null };
    expect(
      objectives(c).some(
        (o) => o.id.startsWith("network-") || o.id.startsWith("analysis-"),
      ),
    ).toBe(false);
    let old = legacyDemoCharacter();
    old = takeRequest(old, "warrior-daily", now);
    let next = upgradeTraining(old);
    const o = takenObjectives(next, now)[0];
    expect(o.xp).toBe(30);
    next = completeTaken(next, o, now);
    expect(totalXP(next)).toBe(30);
    expect(validateCharacter(next)).toBe(true);
  });
});
