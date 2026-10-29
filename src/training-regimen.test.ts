import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createCharacter,
  EMPTY_BASELINE,
  objectives,
  takeRequest,
  takenObjectives,
  completeTaken,
  taskRequirements,
  objectivePeriod,
  totalXP,
  stats,
} from "./domain";
import type { Character, Objective } from "./domain";
import { EMPTY_ASSESSMENT } from "./metrics";
import {
  validTrainingPlan,
  validWorkoutPrescription,
  validWorkoutLog,
  workoutPrescription,
  canonicalWorkout,
  REGIMEN_RANKS,
} from "./training-prescriptions";
import type { WorkoutLog, WorkoutPrescription } from "./training-prescriptions";
import {
  defaultTrainingPlan,
  startingRegimenRank,
  exerciseProgress,
  planProgress,
  localDate,
} from "./training-regimen";
import {
  completeWithResult,
  validActivityResult,
  activityResultHistory,
  parseResult,
  EMPTY_RESULT,
  creditedGoals,
} from "./activity-results";
import { validateCharacter } from "./storage";
import { campaign } from "./rpg";
import { requestProgress } from "./training-tasks";
import {
  readWorkoutDraft,
  saveWorkoutDraft,
  clearWorkoutDraft,
  pruneWorkoutDrafts,
} from "./workout-drafts";
const at = (day = 0) => new Date(2027, 1, 1 + day, 12);
const clock = (day: number) => {
  vi.setSystemTime(at(day));
};
function character(environment: "home" | "weights" | "gym" = "home") {
  const c = createCharacter(
    "Training fixture",
    { ...EMPTY_BASELINE, assessment: { ...EMPTY_ASSESSMENT } },
    "warrior",
    "Analyst",
  );
  c.trainingPlan = {
    version: 1,
    rank: "F",
    environment,
    startedOn: "2027-02-01",
  };
  if (environment !== "home")
    c.preferences!.equipment.push(environment === "gym" ? "gym" : "weights");
  return c;
}
const find = (c: Character, id: string) =>
  objectives(c).find((o) => o.id === id)!;
function log(p: WorkoutPrescription, top = true): WorkoutLog {
  return {
    prescription: p,
    exercises: p.exercises.map((e) => ({
      id: e.id,
      variation: e.name,
      reps: Array.from({ length: e.sets }, () => (top ? e.max : e.min)),
      rir: 3,
      ...(e.load ? { loadKg: 10 } : {}),
    })),
  };
}
function session(c: Character, day: number, id = "warrior-daily", top = true) {
  clock(day);
  c = takeRequest(c, id, at(day));
  const o = takenObjectives(c, at(day)).find((o) => o.id === id)!;
  return completeWithResult(c, o, { workout: log(o.workout!, top) }, at(day));
}
function finish(c: Character, o: Objective, day: number) {
  clock(day);
  c = {
    ...c,
    milestones: {
      ...c.milestones,
      [`${o.id}:${objectivePeriod(o, at(day))}`]: (o.checklist || []).map(
        (_, i) => i,
      ),
    },
  };
  return completeTaken(c, o, at(day));
}
beforeEach(() => {
  vi.useFakeTimers();
  clock(0);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("specific graded training", () => {
  it("keeps five movement patterns and concrete sets, rep ranges, rest and technique in all 24 recipes", () => {
    for (const rank of REGIMEN_RANKS)
      for (const env of ["home", "weights", "gym"] as const)
        for (const type of ["A", "B"] as const) {
          const p = workoutPrescription(rank, type, env);
          expect(validWorkoutPrescription(JSON.parse(JSON.stringify(p)))).toBe(
            true,
          );
          expect(p.exercises).toHaveLength(5);
          expect(
            p.exercises.every(
              (e) =>
                e.min > 0 &&
                e.max >= e.min &&
                e.restSeconds >= 60 &&
                e.cues.length > 40,
            ),
          ).toBe(true);
          expect(
            p.exercises.every(
              (e) => e.sets === { F: 1, E: 2, D: 2, C: 3 }[rank],
            ),
          ).toBe(true);
        }
  });
  it("starts unknown/inactive profiles at F and uses only measured performance for a conservative E suggestion", () => {
    const c = character();
    expect(defaultTrainingPlan(c).rank).toBe("F");
    c.baseStats.STR = 500;
    expect(startingRegimenRank(c)).toBe("F");
    c.assessmentHistory = [];
    c.baseline.assessment = {
      ...EMPTY_ASSESSMENT,
      pushups: 20,
      pushupStyle: "floor",
    };
    expect(startingRegimenRank(c)).toBe("E");
    c.baseline.assessment.pushupStyle = "wall";
    expect(startingRegimenRank(c)).toBe("F");
  });
  it("rejects impossible dates, unsupported plan ranks and altered/unrecognized prescriptions", () => {
    const c = character();
    expect(validTrainingPlan(c.trainingPlan)).toBe(true);
    for (const day of ["2027-02-30", "2027-13-01", ""])
      expect(validTrainingPlan({ ...c.trainingPlan, startedOn: day })).toBe(
        false,
      );
    expect(validTrainingPlan({ ...c.trainingPlan, rank: "SSS" })).toBe(false);
    const p = structuredClone(workoutPrescription("F", "A", "home"));
    p.exercises[0].sets = 10;
    expect(validWorkoutPrescription(p)).toBe(false);
  });
  it("accepts reordered JSON object keys without changing the prescription", () => {
    const p = workoutPrescription("E", "B", "weights");
    const reordered = JSON.parse(JSON.stringify(p), (_k, v) =>
      v && !Array.isArray(v) && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).reverse())
        : v,
    );
    expect(validWorkoutPrescription(reordered)).toBe(true);
    expect(canonicalWorkout(reordered)).toBe(canonicalWorkout(p));
  });
  it("keeps the existing rank reward table and treats a session as one request", () => {
    const c = character();
    for (const [rank, xp] of [
      ["F", 10],
      ["E", 25],
      ["D", 60],
      ["C", 150],
    ] as const) {
      const o = find(c, `regimen-a-${rank.toLowerCase()}`);
      expect(o.xp).toBe(xp);
      expect(o.cadence).toBe("daily");
      expect(o.workout?.exercises).toHaveLength(5);
    }
  });
  it("aligns strength class work and commitments with two days weekly and eight monthly", () => {
    const c = character();
    expect(find(c, "warrior-daily")).toMatchObject({
      rank: "F",
      xp: 10,
      workout: { rank: "F" },
    });
    expect(find(c, "warrior-weekly")).toMatchObject({
      rank: "F",
      minimumSessions: 2,
    });
    expect(find(c, "warrior-monthly")).toMatchObject({
      rank: "F",
      minimumSessions: 8,
    });
    c.activeClass = "scholar";
    expect(find(c, "scholar-daily").workout).toBeUndefined();
  });
  it("retains an older non-regimen accepted class request when a new plan starts", () => {
    let c = character();
    delete c.trainingPlan;
    c = takeRequest(c, "warrior-daily");
    const before = takenObjectives(c)[0];
    c.trainingPlan = defaultTrainingPlan(c);
    const retained = takenObjectives(c)[0];
    expect(retained.xp).toBe(before.xp);
    expect(retained.rank).toBe(before.rank);
    expect(retained.workout).toBeUndefined();
  });
  it("freezes accepted rank, environment, exercises and price through plan/equipment changes", () => {
    let c = takeRequest(character(), "warrior-daily");
    const original = takenObjectives(c)[0];
    c.trainingPlan = { ...c.trainingPlan!, rank: "C", environment: "gym" };
    c.preferences!.equipment.push("gym");
    const retained = takenObjectives(c)[0];
    expect(retained.workout).toEqual(original.workout);
    expect(retained.xp).toBe(10);
    expect(validateCharacter(JSON.parse(JSON.stringify(c)))).toBe(true);
  });
});
describe("measured completion and recovery", () => {
  it("retains a hybrid class’s secondary work before a measured session can pay", () => {
    let c = character();
    c.activeClass = "paladin";
    c.unlockedClasses!.push("paladin");
    c = takeRequest(c, "paladin-daily");
    const o = takenObjectives(c)[0];
    expect(o.checklist?.[0]).toContain("Bible passage");
    const result = { workout: log(o.workout!) };
    expect(completeWithResult(c, o, result)).toBe(c);
    c = {
      ...c,
      milestones: { ...c.milestones, [`${o.id}:${objectivePeriod(o)}`]: [0] },
    };
    expect(completeWithResult(c, o, result).completions).toHaveLength(1);
  });
  it("records all work sets once, preserves base stats and pays the actual request", () => {
    const c = character(),
      before = stats(c);
    let taken = takeRequest(c, "warrior-daily");
    const o = takenObjectives(taken)[0];
    const done = completeWithResult(taken, o, { workout: log(o.workout!) });
    expect(done.completions).toHaveLength(1);
    expect(totalXP(done)).toBe(10);
    expect(stats(done)).toEqual(before);
    expect(campaign(done).gold - campaign(c).gold).toBe(2);
    expect(completeWithResult(done, o, { workout: log(o.workout!) })).toBe(
      done,
    );
    expect(validateCharacter(JSON.parse(JSON.stringify(done)))).toBe(true);
  });
  it("rejects incomplete sets, missing weighted loads and mismatched accepted prescriptions", () => {
    let c = takeRequest(character("gym"), "warrior-daily");
    const o = takenObjectives(c)[0],
      bad = log(o.workout!);
    bad.exercises[0].reps[0] = 0;
    expect(completeWithResult(c, o, { workout: bad })).toBe(c);
    const missing = log(o.workout!);
    delete missing.exercises[0].loadKg;
    expect(validWorkoutLog(missing)).toBe(false);
    expect(
      completeWithResult(
        c,
        { ...o, workout: workoutPrescription("C", "A", "gym") },
        { workout: log(workoutPrescription("C", "A", "gym")) },
      ),
    ).toBe(c);
  });
  it("requires consistent log/prescription fields in backups and rejects unsupported data", () => {
    const c = session(character(), 0);
    expect(validateCharacter(c)).toBe(true);
    const malformed = structuredClone(c);
    malformed.completions[0].result!.workout!.prescription.rank = "C";
    expect(validateCharacter(malformed)).toBe(false);
    const extra = structuredClone(c);
    Object.assign(extra.completions[0].result!.workout!.exercises[0], {
      unbounded: "bad",
    });
    expect(validateCharacter(extra)).toBe(false);
  });
  it("blocks another whole-body/class/component claim during recovery, while walking remains available", () => {
    const c = session(character(), 0);
    for (const id of ["regimen-b-f", "u-floor-push-8", "warrior-daily"])
      expect(
        taskRequirements(c, find(c, id), at(1), "accept").some((s) =>
          s.includes("strength request"),
        ),
      ).toBe(true);
    expect(taskRequirements(c, find(c, "u-walk-5"), at(1), "accept")).toEqual(
      [],
    );
    clock(2);
    expect(takeRequest(c, "regimen-b-f", at(2))).not.toBe(c);
  });
  it("does not repackage an already completed hard component as a new full workout", () => {
    let c = character();
    c = takeRequest(c, "u-floor-push-8");
    c = completeTaken(c, find(c, "u-floor-push-8"));
    expect(takeRequest(c, "regimen-a-f")).toBe(c);
  });
  it("shows every row's volume in Journey without mixing exercise setup variants", () => {
    let c = session(character("weights"), 0);
    c = session(c, 3);
    const series = activityResultHistory(c, at(0), at(3));
    expect(series.some((s) => s.title.includes("load used"))).toBe(true);
    expect(
      series.some(
        (s) => s.title.includes("Goblet squat") && s.points[0].value === 8,
      ),
    ).toBe(true);
    expect(
      series.some(
        (s) => s.title.includes("Dead bug") && s.points[0].value === 16,
      ),
    ).toBe(true);
  });
});
describe("progression uses comparable work", () => {
  it("requires two comparable top-range sessions and does not advance the plan automatically", () => {
    let c = session(character(), 0);
    expect(
      exerciseProgress(c, workoutPrescription("F", "A", "home"), "push").ready,
    ).toBe(false);
    c = session(c, 3);
    expect(
      exerciseProgress(c, workoutPrescription("F", "A", "home"), "push").ready,
    ).toBe(true);
    expect(c.trainingPlan!.rank).toBe("F");
  });
  it("does not infer progress from a different setup, failed target or a harder recorded effort", () => {
    let c = session(character(), 0);
    c = session(c, 3);
    const p = workoutPrescription("F", "A", "home");
    c.completions.at(-1)!.result!.workout!.exercises[1].variation =
      "Different incline";
    expect(exerciseProgress(c, p, "push").ready).toBe(false);
    c.completions.at(-1)!.result!.workout!.exercises[1].variation =
      p.exercises[1].name;
    c.completions.at(-1)!.result!.workout!.exercises[1].rir = 0;
    expect(exerciseProgress(c, p, "push").ready).toBe(false);
  });
  it("tolerates display conversion rounding but keeps materially different loads separate", () => {
    let c = session(character("weights"), 0);
    c = session(c, 3);
    const p = workoutPrescription("F", "A", "weights");
    c.completions.at(-1)!.result!.workout!.exercises[1].loadKg = 10.002;
    expect(exerciseProgress(c, p, "push").ready).toBe(true);
    c.completions.at(-1)!.result!.workout!.exercises[1].loadKg = 11;
    expect(exerciseProgress(c, p, "push").ready).toBe(false);
  });
  it("offers a rank review after four qualifying days across the two-week pattern", () => {
    let c = character();
    for (const d of [0, 3, 7, 10]) c = session(c, d);
    expect(planProgress(c, c.trainingPlan!)).toMatchObject({
      days: 4,
      ready: true,
      next: "E",
    });
    expect(c.trainingPlan!.rank).toBe("F");
  });
});
describe("calendar credit is explicit and rank-aware", () => {
  it("excludes technique-only class days from full-body goals while retaining recorded class workouts", () => {
    let c = takeRequest(character(), "warrior-weekly");
    for (const day of [0, 1]) {
      clock(day);
      c = takeRequest(c, "warrior-technique-daily", at(day));
      c = finish(c, find(c, "warrior-technique-daily"), day);
    }
    expect(c.completions).toHaveLength(2);
    expect(requestProgress(c, find(c, "warrior-weekly"), at(1)).sessions).toBe(
      0,
    );
    c = session(c, 2);
    c = session(c, 5);
    expect(requestProgress(c, find(c, "warrior-weekly"), at(5)).sessions).toBe(
      2,
    );
  });

  it("labels a late-accepted calendar goal from the actual period start", () => {
    let c = session(character(), 0);
    c = session(c, 3);
    c = takeRequest(c, "regimen-weekly-f", at(3));
    const progress = requestProgress(c, find(c, "regimen-weekly-f"), at(3));
    expect(new Date(progress.startedAt!).getDate()).toBe(1);
    expect(progress.sessions).toBe(2);
  });
  it("counts class sessions for a manually taken regimen week but not for a higher-rank week or walking", () => {
    let c = character();
    for (const id of [
      "regimen-weekly-f",
      "regimen-weekly-d",
      "habit-walk-weekly-f",
    ])
      c = takeRequest(c, id);
    const o = find(c, "warrior-daily");
    expect(creditedGoals(c, o).some((o) => o.id === "regimen-weekly-f")).toBe(
      true,
    );
    c = session(c, 0);
    c = session(c, 3);
    expect(
      requestProgress(c, find(c, "regimen-weekly-f"), at(3)).sessions,
    ).toBe(2);
    expect(
      requestProgress(c, find(c, "regimen-weekly-d"), at(3)).sessions,
    ).toBe(0);
    expect(
      requestProgress(c, find(c, "habit-walk-weekly-f"), at(3)).sessions,
    ).toBe(0);
    const done = finish(c, find(c, "regimen-weekly-f"), 3);
    expect(done.completions.at(-1)!.xp).toBe(40);
  });
  it("requires eight dates for the month and expires acceptance at the next month", () => {
    let c = takeRequest(character(), "regimen-monthly-f");
    for (const d of [0, 3, 7, 10, 14, 17, 21, 24]) c = session(c, d);
    clock(27);
    expect(
      requestProgress(c, find(c, "regimen-monthly-f"), at(27)).sessions,
    ).toBe(8);
    c = finish(c, find(c, "regimen-monthly-f"), 27);
    expect(c.completions.at(-1)!.xp).toBe(180);
    clock(28);
    expect(
      takenObjectives(c, at(28)).some((o) => o.id === "regimen-monthly-f"),
    ).toBe(false);
  });
});
describe("subject-specific study results and unfinished workout drafts", () => {
  it("retains zero-correct results, requires a valid answer pair and separates topics in accuracy graphs", () => {
    const result = parseResult({
      ...EMPTY_RESULT,
      topic: "Subnetting",
      attempted: "5",
      correct: "0",
    }).result!;
    expect(validActivityResult(result)).toBe(true);
    expect(result.correct).toBe(0);
    expect(validActivityResult({ correct: 3, attempted: 2 })).toBe(false);
    expect(validActivityResult({ correct: 0 })).toBe(false);
    const c = character();
    c.completions = [
      {
        id: "study",
        period: localDate(),
        title: "Study",
        at: at(0).toISOString(),
        classId: "warrior",
        xp: 10,
        stat: "INT",
        result,
      },
      {
        id: "study-2",
        period: localDate(),
        title: "Study",
        at: at(0).toISOString(),
        classId: "warrior",
        xp: 10,
        stat: "INT",
        result: { topic: "OSPF", attempted: 5, correct: 4 },
      },
    ];
    const plots = activityResultHistory(c, at(0));
    expect(plots.filter((s) => s.unit === "%")).toHaveLength(2);
    expect(
      plots.find((s) => s.title.includes("Subnetting"))!.points[0].value,
    ).toBe(0);
  });
  it("keeps bounded drafts separate from earned progress and ignores malformed/different prescriptions", () => {
    const storage: Record<string, unknown> = {};
    Object.defineProperties(storage, {
      getItem: { value: (k: string) => storage[k] || null },
      setItem: {
        value: (k: string, v: string) => {
          storage[k] = v;
        },
      },
      removeItem: {
        value: (k: string) => {
          delete storage[k];
        },
      },
    });
    vi.stubGlobal("localStorage", storage);
    const p = workoutPrescription("F", "A", "home"),
      rows = p.exercises.map((e) => ({
        variation: e.name,
        reps: ["5"],
        load: "",
        rir: "3",
      }));
    expect(saveWorkoutDraft("draft.test.1", p, rows)).toBe(true);
    expect(readWorkoutDraft("draft.test.1", p)).toEqual(rows);
    expect(
      readWorkoutDraft("draft.test.1", workoutPrescription("E", "A", "home")),
    ).toBeUndefined();
    for (const n of [2, 3]) saveWorkoutDraft(`draft.test.${n}`, p, rows);
    pruneWorkoutDrafts("draft.test.", "draft.test.3");
    expect(
      Object.keys(storage).filter((k) => k.startsWith("draft.test.")),
    ).toHaveLength(2);
    clearWorkoutDraft("draft.test.3");
    expect(readWorkoutDraft("draft.test.3", p)).toBeUndefined();
  });
});
