import { describe, it, expect } from "vitest";
import {
  createCharacter,
  EMPTY_BASELINE,
  objectives,
  takeRequest,
  takenObjectives,
  completeTaken,
  stats,
  CLASSES,
} from "./domain";
import {
  EMPTY_ASSESSMENT,
  assessmentResults,
  validAssessment,
  assessmentErrors,
} from "./metrics";
import { assessedPushLevel, regimenRequests } from "./training-regimen";
import {
  abilityWorkout,
  workoutPrescription,
  validWorkoutPrescription,
} from "./training-prescriptions";
import {
  recommendedRequest,
  proficiencyKey,
  proficiencyFeedback,
  validProficiencies,
} from "./proficiency";
import { CAREER_CATEGORIES, VOCATIONS, careerCategory } from "./careers";
import { PROFESSIONS } from "./professions";
import { groupRequests } from "./objective-catalog";
import {
  mentalForm,
  nextMentalForm,
  formScore,
  validMentalFormId,
} from "./exam-bank";
import { mentalPass } from "./exam-rules";
import { validateCharacter } from "./storage";
import {
  examTargets,
  beginExam,
  submitMentalExam,
  masteryStandard,
} from "./exams";
const at = new Date(2027, 1, 1, 12);
function actor(pushups: number | null = null) {
  return createCharacter(
    "Ability fixture",
    { ...EMPTY_BASELINE, assessment: { ...EMPTY_ASSESSMENT, pushups } },
    "warrior",
    "Registered Nurse",
  );
}
describe("ability-based work instead of RPG-stat inference", () => {
  it("gives a 35-floor-pushup adult challenging pushing in every home regimen, independently of other movements", () => {
    const c = actor(35);
    expect(assessedPushLevel(c)).toBe(4);
    const choices = objectives(c).filter(
      (o) => o.family === "u-push" && o.cadence === "daily",
    );
    const chosen = recommendedRequest(c, choices);
    expect(chosen.rank).toBe("C");
    expect(chosen.description).toContain("harder pushups");
    for (const o of regimenRequests(c)) {
      expect(o.workout!.exercises.find((e) => e.id === "push")!.name).toBe(
        "Harder floor pushup variation",
      );
      expect(o.workout!.exercises[0].name).toBe(
        o.rank === "F"
          ? "Chair sit-to-stand"
          : o.workout!.session === "B"
            ? "Supported split squat"
            : "Controlled bodyweight squat",
      );
    }
  });
  it("uses measured floor capacity, keeps novices supported and ignores inflated game stats", () => {
    for (const [n, level] of [
      [0, 1],
      [4, 2],
      [12, 3],
      [35, 4],
    ] as const) {
      const c = actor(n);
      c.baseStats.STR = 500;
      expect(assessedPushLevel(c)).toBe(level);
    }
    const c = actor();
    c.baseStats.STR = 500;
    expect(assessedPushLevel(c)).toBe(1);
  });
  it("validates all 96 v2 recipes while retaining old immutable contracts and rejecting edits", () => {
    for (const rank of ["F", "E", "D", "C"] as const)
      for (const env of ["home", "weights", "gym"] as const)
        for (const session of ["A", "B"] as const)
          for (const level of [1, 2, 3, 4] as const) {
            const p = abilityWorkout(rank, session, env, level);
            expect(
              validWorkoutPrescription(JSON.parse(JSON.stringify(p))),
            ).toBe(true);
            expect(
              validWorkoutPrescription(workoutPrescription(rank, session, env)),
            ).toBe(true);
            expect(validWorkoutPrescription({ ...p, pushLevel: 9 })).toBe(
              false,
            );
            const changed = structuredClone(p);
            changed.exercises[0].sets += 1;
            expect(validWorkoutPrescription(changed)).toBe(false);
          }
  });
  it("keeps a taken workout unchanged after reassessment or plan changes", () => {
    let c = actor(0);
    c = takeRequest(c, "regimen-a-f", at);
    const original = takenObjectives(c, at).find(
      (o) => o.id === "regimen-a-f",
    )!;
    c.assessmentHistory = [
      {
        at: at.toISOString(),
        assessment: { ...EMPTY_ASSESSMENT, pushups: 35 },
        stats: c.baseStats,
      },
    ];
    expect(regimenRequests(c)[0].workout!.pushLevel).toBe(4);
    expect(
      takenObjectives(c, at).find((o) => o.id === original.id)?.workout,
    ).toEqual(original.workout);
    expect(validateCharacter(c)).toBe(true);
  });
  it("offers graded work in all twenty career categories and all twenty-five vocations", () => {
    for (const category of CAREER_CATEGORIES) {
      const role = PROFESSIONS.find(
        (role) => careerCategory(role).id === category.id,
      )!;
      expect(role, category.id).toBeTruthy();
      const c = { ...actor(), profession: role };
      const o = objectives(c).find((o) => o.id === "profession-daily")!;
      c.proficiencies = {
        [proficiencyKey(c, o)]: {
          rank: "C",
          topic: `Applied ${category.name}`,
          criterion:
            "Pass an unfamiliar case against the named rubric, with both constraints met",
          reviewedAt: at.toISOString(),
        },
      };
      const variants = groupRequests(objectives(c)).find((g) =>
        g.variants.some((o) => o.id === "profession-daily"),
      )!.variants;
      expect(variants.map((o) => o.rank)).toEqual(["F", "E", "D", "C"]);
      expect(recommendedRequest(c, variants).rank).toBe("C");
      expect(variants.at(-1)!.description).toContain("two real constraints");
      expect(validateCharacter(c)).toBe(true);
    }
    for (const vocation of VOCATIONS) {
      const c = { ...actor(), vocation: vocation.id };
      const variants = objectives(c).filter((o) =>
        o.id.startsWith(`vocation-${vocation.id}-daily`),
      );
      expect(variants.map((o) => o.rank)).toEqual(["F", "E", "D", "C"]);
      expect(new Set(variants.map((o) => proficiencyKey(c, o))).size).toBe(1);
    }
  });
  it("uses explicit class ownership for every class commission, including Network Weaver", () => {
    for (const cls of CLASSES) {
      const c = {
        ...actor(),
        activeClass: cls.id,
        profession: "Baker",
        vocation: null,
      };
      for (const cadence of ["daily", "weekly", "monthly"]) {
        const o = objectives(c).find((o) => o.id === `${cls.id}-${cadence}`);
        expect(o?.scope, `${cls.id} ${cadence}`).toBe("class");
      }
    }
  });
  it("prevents claiming multiple difficulty variants and keeps earned stats unchanged", () => {
    let c = actor();
    c.activeClass = "scholar";
    c.unlockedClasses = ["warrior", "scholar"];
    const before = stats(c);
    c = takeRequest(c, "scholar-daily-proficiency-f", at);
    c = completeTaken(
      c,
      takenObjectives(c, at).find(
        (o) => o.id === "scholar-daily-proficiency-f",
      )!,
      at,
    );
    const count = c.completions.length;
    c = takeRequest(c, "scholar-daily-proficiency-c", at);
    const harder = objectives(c).find(
      (o) => o.id === "scholar-daily-proficiency-c",
    )!;
    c = completeTaken(c, harder, at);
    expect(c.completions).toHaveLength(count);
    expect(stats(c)).toEqual(before);
  });
  it("keeps subject and role boundaries in proficiency reviews", () => {
    const c = actor();
    const o = objectives(c).find((o) => o.id === "profession-daily")!;
    c.proficiencies = {
      [proficiencyKey(c, o)]: {
        rank: "D",
        topic: "Medication calculations",
        criterion:
          "Check unfamiliar fictional cases against the same approved source",
        reviewedAt: at.toISOString(),
      },
    };
    c.completions = [1, 2].map((day) => ({
      id: "profession-daily",
      at: new Date(2027, 1, day, 12).toISOString(),
      period: `2027-02-0${day}`,
      title: "Practice",
      xp: 60,
      stat: "INT",
      classId: "warrior",
      scope: "profession",
      profession: c.profession,
      careerCategory: o.careerCategory,
      rank: "D",
      result: { topic: "Medication calculations", attempted: 20, correct: 18 },
    }));
    expect(proficiencyFeedback(c, o)).toContain("85%+");
    c.completions[1].result!.topic = "Latin vocabulary";
    expect(proficiencyFeedback(c, o)).not.toContain("85%+");
    expect(validProficiencies(c.proficiencies)).toBe(true);
    expect(
      validProficiencies({
        bad: { ...Object.values(c.proficiencies)[0], rank: "SSS" },
      }),
    ).toBe(false);
  });
});
describe("new assessment protocols", () => {
  it("scores a 16-minute mile at the provisional anchor and keeps walk/run and six-minute data distinct", () => {
    const a = {
      ...EMPTY_ASSESSMENT,
      mileSeconds: 960,
      mileMode: "walk" as const,
      walkMetres: 800,
    };
    expect(validAssessment(a)).toBe(true);
    const con = assessmentResults(a).find((r) => r.stat === "CON")!;
    expect(con.value).toBe(10);
    expect(con.evidence).toBe("provisional");
    expect(con.raw).toContain("16:00");
    expect(
      assessmentResults({ ...a, mileMode: "run", mileSeconds: 600 }).find(
        (r) => r.stat === "CON",
      )!.value,
    ).toBe(10);
    expect(validAssessment({ ...a, mileSeconds: 30 })).toBe(false);
    expect(assessmentErrors({ ...a, mileSeconds: NaN })).not.toEqual([]);
    expect(
      assessmentResults(EMPTY_ASSESSMENT).every((r) => r.value === 10),
    ).toBe(true);
  });
  it("uses nonreligious logic and uncertainty problems, with real production rubrics for communication", () => {
    for (const stat of ["INT", "WIS", "CHA"] as const) {
      const used: string[] = [];
      for (let i = 0; i < 24; i++) {
        const f = nextMentalForm(stat, used);
        used.push(f.id);
        expect(validMentalFormId(f.id)).toBe(true);
        expect(f.id).toContain("-v3-");
        expect(
          f.questions.every(
            (q) => !/community garden|17\/20|bible|scripture/i.test(q.prompt),
          ),
        ).toBe(true);
        if (stat === "CHA")
          expect(
            f.questions.every((q) => q.performance?.criteria.length === 4),
          ).toBe(true);
      }
    }
    const f = mentalForm("CHA");
    expect(formScore(f, [0, 0, 0, 0, 0])).toBe(0);
    expect(formScore(f, [3, 3, 3, 3, 3])).toBe(5);
    expect(formScore(f, [2, 2, 2, 2, 2])).toBe(3.3);
    // Independent enumeration checks the constrained-order item.
    const permutations = (xs: string[]): string[][] =>
      xs.length
        ? xs.flatMap((x, i) =>
            permutations(xs.filter((_, j) => i !== j)).map((r) => [x, ...r]),
          )
        : [[]];
    expect(
      permutations(["A", "B", "C", "D"]).filter(
        (p) =>
          p.indexOf("B") < p.indexOf("C") &&
          p.indexOf("A") === p.indexOf("D") + 1 &&
          p.indexOf("C") !== 3,
      ),
    ).toHaveLength(1);
  });
  it("preserves legacy scoring but does not count faster familiarity as new v3 mastery", () => {
    const old = mentalForm("INT", "int-v2-0-c1");
    expect(old.questions[0].options[old.questions[0].answer]).toBe("10");
    const f = mentalForm("INT"),
      result = {
        formId: f.id,
        answers: f.questions.map((q) => q.answer),
        completedAt: at.toISOString(),
        durationMs: 100000,
      };
    expect(
      mentalPass({ ...result, durationMs: 50000 }, result, (r) =>
        formScore(f, r.answers),
      ),
    ).toBe(false);
  });
  it("records a new version baseline rather than comparing it to an old quiz", () => {
    let c = actor();
    c.activeClass = "scholar";
    c.unlockedClasses = ["warrior", "scholar"];
    c.completions = Array.from({ length: 8 }, (_, i) => ({
      id: "scholar-daily",
      period: `2027-01-${i + 1}`,
      at: new Date(2027, 0, i + 1, 12).toISOString(),
      xp: 150,
      title: "Fixture work",
      classId: "scholar",
      scope: "class",
      stat: "INT",
      cadence: "daily",
      rank: "C",
    }));
    const old = mentalForm("INT", "int-v2-0-c1");
    c.baseline.assessment!.mental = {
      INT: {
        formId: old.id,
        answers: old.questions.map((q) => q.answer),
        completedAt: new Date(2027, 0, 1).toISOString(),
      },
    };
    const t = examTargets(c).find((t) => t.owner === "scholar")!;
    const f = nextMentalForm("INT", []);
    c = beginExam(c, t, f, at);
    c = submitMentalExam(
      c,
      t,
      {
        formId: f.id,
        answers: f.questions.map((q) => q.answer),
        completedAt: at.toISOString(),
        durationMs: 60000,
      },
      at,
    );
    expect(c.exams!.at(-1)!.status).toBe("baseline");
    expect(validateCharacter(c)).toBe(true);
  });
});

describe("calibration boundaries and history", () => {
  it("uses the newest same-activity measure instead of an older better exam", () => {
    const c = actor(35);
    c.exams = [
      {
        id: "old-check",
        scope: "class",
        owner: "warrior",
        milestone: 5,
        stat: "STR",
        at: "2026-10-01T12:00:00Z",
        status: "passed",
        protocol: "push-floor",
        value: 50,
      },
    ];
    c.assessmentHistory = [
      {
        at: "2027-01-01T12:00:00Z",
        assessment: { ...EMPTY_ASSESSMENT, pushups: 12 },
        stats: c.baseStats,
      },
    ];
    expect(assessedPushLevel(c)).toBe(3);
    c.assessmentHistory.push({
      at: "2027-02-01T12:00:00Z",
      assessment: { ...EMPTY_ASSESSMENT, pushupStyle: "wall", pushups: 8 },
      stats: c.baseStats,
    });
    expect(assessedPushLevel(c)).toBe(1);
  });
  it("validates independent movement setups without changing an old recipe", () => {
    const p = abilityWorkout("F", "A", "home", 4, {
      squat: 3,
      hinge: 4,
      core: 2,
    });
    expect(validWorkoutPrescription(p)).toBe(true);
    expect(p.exercises[0].name).toBe("Supported split squat");
    expect(p.exercises[3].name).toBe("Controlled single-leg glute bridge");
    expect(workoutPrescription("F", "A", "home").exercises[0].name).toBe(
      "Chair sit-to-stand",
    );
    expect(
      validWorkoutPrescription({ ...p, movementLevels: { squat: 9 } }),
    ).toBe(false);
  });
  it("does not carry old-form mastery evidence into a new form family", () => {
    let c = actor();
    c.activeClass = "scholar";
    c.unlockedClasses = ["scholar"];
    c.completions = Array.from({ length: 20 }, (_, i) => ({
      id: "scholar-daily",
      period: `2027-01-${i + 1}`,
      at: new Date(2027, 0, i + 1, 12).toISOString(),
      xp: 500,
      title: "Fixture",
      classId: "scholar",
      scope: "class",
      stat: "INT",
      cadence: "daily",
      rank: "C",
    }));
    c.exams = [5, 10].map((milestone, i) => {
      const f = mentalForm("INT", `int-v2-${i}-c1`);
      return {
        id: `legacy-${i}`,
        scope: "class",
        owner: "scholar",
        milestone,
        stat: "INT",
        at: "2027-01-01T12:00:00Z",
        status: "passed",
        mental: {
          answers: f.questions.map((q) => q.answer),
          formId: f.id,
          completedAt: "2027-01-01T12:00:00Z",
        },
      };
    });
    const target = examTargets(c).find((t) => t.owner === "scholar")!,
      f = mentalForm("INT");
    c = beginExam(c, target, f, at);
    expect(target.ready).toBe(true);
    expect(masteryStandard(c, target).eligible).toBe(false);
    c = submitMentalExam(
      c,
      target,
      {
        answers: f.questions.map((q) => q.answer),
        formId: f.id,
        completedAt: at.toISOString(),
      },
      at,
      "mastery",
    );
    expect(c.exams!.at(-1)!.status).toBe("baseline");
    expect(c.exams!.filter((e) => e.status === "passed")).toHaveLength(2);
  });
});
