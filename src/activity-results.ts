import type { Character, Completion, Objective } from "./domain";
import { completeTaken, takenObjectives, isComplete } from "./domain";
import { requestProgress } from "./training-tasks";
import type { PerformanceSeries } from "./performance-history";
import { validWorkoutLog, canonicalWorkout } from "./training-prescriptions";
import {
  validPracticeEvidence,
  abilityKey,
  abilityRecommendation,
} from "./adaptive-ability";
import type { PracticeEvidence } from "./adaptive-ability";

export interface ActivityResult {
  practice?: PracticeEvidence;
  topic?: string;
  attempted?: number;
  correct?: number;
  workout?: import("./training-prescriptions").WorkoutLog;
  exercise?: string;
  sets?: number;
  reps?: number;
  loadKg?: number;
  minutes?: number;
  distanceKm?: number;
  count?: number;
  output?: string;
}
export type ResultDraft = Record<
  Exclude<keyof ActivityResult, "workout" | "practice">,
  string
>;
export const EMPTY_RESULT: ResultDraft = {
  topic: "",
  attempted: "",
  correct: "",
  exercise: "",
  sets: "",
  reps: "",
  loadKg: "",
  minutes: "",
  distanceKm: "",
  count: "",
  output: "",
};
const limits = {
  attempted: 1000000,
  correct: 1000000,
  sets: 1000,
  reps: 100000,
  loadKg: 10000,
  minutes: 44640,
  distanceKm: 10000,
  count: 1000000,
};
export function validActivityResult(input: unknown): input is ActivityResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const r = input as ActivityResult;
  if (
    Object.keys(r).some(
      (k) =>
        k !== "workout" && k !== "practice" && !Object.hasOwn(EMPTY_RESULT, k),
    )
  )
    return false;
  if (r.workout !== undefined && !validWorkoutLog(r.workout)) return false;
  if (r.practice !== undefined && !validPracticeEvidence(r.practice))
    return false;
  if (
    ["exercise", "output", "topic"].some((k) => {
      const value = r[k as "exercise" | "output" | "topic"];
      return (
        value !== undefined &&
        (typeof value !== "string" ||
          !value.trim() ||
          value.length > (k === "exercise" ? 80 : k === "topic" ? 100 : 280))
      );
    })
  )
    return false;
  for (const [key, max] of Object.entries(limits)) {
    const value = r[key as keyof typeof limits];
    if (
      value !== undefined &&
      (typeof value !== "number" ||
        !Number.isFinite(value) ||
        (key === "correct" ? value < 0 : value <= 0) ||
        value > max ||
        (["sets", "reps", "count", "attempted", "correct"].includes(key) &&
          !Number.isInteger(value)))
    )
      return false;
  }
  if ((r.sets || r.reps || r.loadKg) && !r.exercise) return false;
  if (
    (r.attempted !== undefined || r.correct !== undefined) &&
    (r.attempted === undefined ||
      r.correct === undefined ||
      r.correct > r.attempted)
  )
    return false;
  return Object.keys(r).length > 0;
}
export function parseResult(
  draft: ResultDraft,
  imperial = false,
): { result?: ActivityResult; error?: string } {
  const result: ActivityResult = {};
  for (const key of ["exercise", "output", "topic"] as const)
    if (draft[key].trim()) result[key] = draft[key].trim();
  for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
    if (!draft[key].trim()) continue;
    result[key] =
      Number(draft[key]) *
      (imperial && key === "loadKg"
        ? 0.45359237
        : imperial && key === "distanceKm"
          ? 1.609344
          : 1);
  }
  if (!Object.keys(result).length) return {};
  return validActivityResult(result)
    ? { result }
    : {
        error:
          "Use positive values and whole counts. Name strength exercises; for checked questions enter both attempted and correct (0 up to attempted).",
      };
}
export function resultDraft(
  result?: ActivityResult,
  imperial = false,
): ResultDraft {
  const draft = { ...EMPTY_RESULT };
  for (const [key, value] of Object.entries(result || {})) {
    if (key === "workout" || key === "practice") continue;
    const factor =
      imperial && key === "loadKg"
        ? 2.2046226218
        : imperial && key === "distanceKm"
          ? 0.6213711922
          : 1;
    draft[key as keyof ResultDraft] =
      typeof value === "number"
        ? String(Math.round(value * factor * 100) / 100)
        : value;
  }
  return draft;
}
export function completeWithResult(
  c: Character,
  o: Objective,
  result?: ActivityResult,
  now = new Date(),
): Character {
  if (result && !validActivityResult(result)) return c;

  const actual =
    result?.workout || result?.practice
      ? takenObjectives(c, now).find((r) => r.id === o.id)
      : undefined;
  if (
    result?.practice &&
    (!actual ||
      actual.cadence !== "daily" ||
      result.practice.level !== actual.rank)
  )
    return c;
  if (
    result?.workout &&
    (!actual?.workout ||
      canonicalWorkout(actual.workout) !==
        canonicalWorkout(result.workout.prescription))
  )
    return c;
  const next = completeTaken(c, o, now);
  if (next === c || !result) return next;
  const recorded = {
    ...next,
    completions: next.completions.map((x, i) =>
      i === next.completions.length - 1 ? { ...x, result: { ...result } } : x,
    ),
  };
  if (!result.practice || !actual) return recorded;
  const receipt = recorded.completions.at(-1)!;
  const owner = {
    ...recorded,
    activeClass: receipt.classId,
    profession: receipt.profession || recorded.profession,
    vocation: receipt.vocationId || null,
  };
  const key = abilityKey(owner, actual);
  const level =
    abilityRecommendation(owner, actual, result.practice.subject, now)?.level ||
    result.practice.level;
  return {
    ...recorded,
    proficiencies: {
      ...recorded.proficiencies,
      [key]: {
        rank: level,
        topic: result.practice.subject.trim(),
        criterion: `Compare the same activity against ${result.practice.source.trim()}`,
        reviewedAt: now.toISOString(),
      },
    },
  };
}
export function resultSummary(r?: ActivityResult, imperial = false): string {
  if (!r) return "";
  return [
    r.practice &&
      `${r.practice.subject} · ${r.practice.source} · ${r.practice.criteriaMet}/${r.practice.criteriaTotal} criteria · ${r.practice.level} practice${r.practice.unfamiliar && r.practice.independent ? " · unfamiliar, independent" : ""}`,
    r.workout &&
      `${r.workout.prescription.exercises.length} movements · session ${r.workout.prescription.session} · ${r.workout.prescription.rank} rank`,
    r.workout &&
      r.workout.exercises
        .map(
          (e) =>
            `${e.variation}: ${e.reps.join("/")} reps${e.loadKg ? ` at ${Math.round(e.loadKg * (imperial ? 2.2046226218 : 1) * 100) / 100} ${imperial ? "lb" : "kg"}` : ""}, ${e.rir} reps left`,
        )
        .join("; "),
    r.exercise,
    r.topic,
    r.attempted !== undefined &&
      r.correct !== undefined &&
      `${r.correct}/${r.attempted} checked answers`,
    r.sets && `${r.sets} sets`,
    r.reps && `${r.reps} reps${r.sets ? "/set" : " total"}`,
    r.loadKg &&
      `${Math.round(r.loadKg * (imperial ? 2.2046226218 : 1) * 10) / 10} ${imperial ? "lb" : "kg"}`,
    r.minutes && `${r.minutes} min`,
    r.distanceKm &&
      `${Math.round(r.distanceKm * (imperial ? 0.6213711922 : 1) * 100) / 100} ${imperial ? "mi" : "km"}`,
    r.count && `${r.count} items`,
    r.output,
  ]
    .filter(Boolean)
    .join(" · ");
}
// Preview only: weekly/monthly rewards still require their own acceptance and submission.
export function creditedGoals(
  c: Character,
  o: Objective,
  now = new Date(),
): Objective[] {
  if (o.cadence !== "daily") return [];
  const completion: Completion = {
    id: o.id,
    title: o.title,
    period: "preview",
    at: now.toISOString(),
    cadence: "daily",
    xp: 0,
    classId:
      o.targetClass ||
      c.takenRequests?.find((r) => r.id === o.id)?.classId ||
      c.activeClass,
    scope: o.scope,
    rank: o.rank,
    ...(o.workout ? { workout: o.workout } : {}),
    family: o.family,
    careerCategory: o.careerCategory,
    stat: o.stat,
  };
  const preview = { ...c, completions: [...c.completions, completion] };
  return takenObjectives(c, now).filter(
    (goal) =>
      goal.cadence !== "daily" &&
      goal.minimumSessions &&
      !isComplete(c, goal, now) &&
      requestProgress(preview, goal, now).sessions >
        requestProgress(c, goal, now).sessions,
  );
}
export function activityResultHistory(
  c: Character,
  start: Date,
  now = new Date(),
): PerformanceSeries[] {
  const groups = new Map<string, PerformanceSeries>();
  const imperial = c.preferences?.units === "imperial";
  for (const x of c.completions) {
    const r = x.result;
    if (!r || new Date(x.at) < start || new Date(x.at) > now) continue;
    const name = r.exercise || r.topic || x.title;
    const add = (
      metric: string,
      unit: string,
      value?: number,
      exerciseName?: string,
      exerciseKey?: string,
    ) => {
      if (value === undefined) return;
      const id = `${exerciseKey || r.exercise?.toLowerCase() || (r.topic ? `topic:${r.topic.trim().toLowerCase()}` : "") || x.requestGroup || x.id}:${metric}`;
      const series = groups.get(id) || {
        id,
        title: `${exerciseName || name} · ${metric}`,
        unit,
        points: [],
      };
      series.points.push({
        key: `${x.id}:${x.period}`,
        at: x.at,
        label: new Date(x.at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        value: Math.round(value * 100) / 100,
      });
      groups.set(id, series);
    };
    add(
      "total repetitions",
      "reps",
      r.reps ? r.reps * (r.sets || 1) : undefined,
    );
    add(
      "load used",
      imperial ? "lb" : "kg",
      r.loadKg ? r.loadKg * (imperial ? 2.2046226218 : 1) : undefined,
    );
    add("duration", "min", r.minutes);
    add(
      "distance",
      imperial ? "mi" : "km",
      r.distanceKm ? r.distanceKm * (imperial ? 0.6213711922 : 1) : undefined,
    );
    add("completed items", "items", r.count);
    if (r.attempted !== undefined && r.correct !== undefined)
      add("checked accuracy", "%", (r.correct / r.attempted) * 100);
    for (const entry of r.workout?.exercises || []) {
      const prescribed = r.workout!.prescription.exercises.find(
        (e) => e.id === entry.id,
      )!;
      const key = `workout:${entry.id}:${entry.variation.trim().toLowerCase()}`;
      add(
        "total repetitions",
        "reps",
        entry.reps.reduce((n, r) => n + r, 0) * (prescribed.perSide ? 2 : 1),
        entry.variation,
        key,
      );
      add(
        "load used",
        imperial ? "lb" : "kg",
        entry.loadKg ? entry.loadKg * (imperial ? 2.2046226218 : 1) : undefined,
        entry.variation,
        key,
      );
    }
  }
  return [...groups.values()].map((g) => ({
    ...g,
    points: g.points.sort((a, b) => Date.parse(a.at) - Date.parse(b.at)),
  }));
}
