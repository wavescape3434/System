import type { Character, Objective, Completion } from "./domain";
import { TASK_XP, TASK_GOLD } from "./task-ranks";
import { hasEquipment } from "./preferences";
import { REGIMEN_RANKS, workoutPrescription } from "./training-prescriptions";
import type {
  RegimenRank,
  WorkoutPrescription,
  ExerciseLog,
  TrainingPlan,
} from "./training-prescriptions";
export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const dateNumber = (s: string) =>
  Date.parse(s + "T12:00:00Z") / 86400000;
export function startingRegimenRank(c: Character): RegimenRank {
  const a = c.baseline.assessment;
  if (
    a?.strengthTest === "pushups" &&
    a.pushupStyle === "floor" &&
    (a.pushups || 0) >= 12
  )
    return "E";
  if (
    a?.strengthTest === "weighted" &&
    a.liftReps &&
    a.liftReps >= 4 &&
    a.liftReps <= 10 &&
    a.massKg &&
    a.liftKg &&
    a.liftKg / a.massKg >= 0.4
  )
    return "E";
  return "F";
}
export const defaultTrainingPlan = (c: Character): TrainingPlan => ({
  version: 1,
  startedOn: localDate(),
  walkMinutes: 5,
  rank: startingRegimenRank(c),
  environment: c.preferences?.equipment.includes("gym")
    ? "gym"
    : hasEquipment(c.preferences?.equipment, "weights")
      ? "weights"
      : "home",
});
export const nextStrengthSession = (c: Character): "A" | "B" =>
  [...c.completions].reverse().find((r) => r.workout)?.workout?.session === "A"
    ? "B"
    : "A";
export const regimenReward = (rank: RegimenRank) => ({
  xp: TASK_XP[rank],
  gold: TASK_GOLD[rank],
});
export const workoutSummary = (p: WorkoutPrescription) =>
  `${p.minutes} minutes. ${p.warmup} Complete ${p.exercises.map((e) => `${e.name}: ${e.sets} × ${e.min}–${e.max}${e.perSide ? " per side" : ""}`).join("; ")}. Rest 90–120 seconds between work sets. Finish each set with about ${p.rir} clean repetitions in reserve. Record the same variation, load and range for comparisons.`;
const requestCache = new Map<string, Objective[]>();
export function regimenRequests(c: Character): Objective[] {
  const environment = (c.trainingPlan || defaultTrainingPlan(c)).environment;
  const cached = requestCache.get(environment);
  if (cached) return cached;
  const result: Objective[] = REGIMEN_RANKS.flatMap((rank) =>
    (["A", "B"] as const).map((session) => {
      const workout = workoutPrescription(rank, session, environment);
      return {
        id: `regimen-${session.toLowerCase()}-${rank.toLowerCase()}`,
        title: `Full-body session ${session} · ${rank}`,
        description: workoutSummary(workout),
        rank,
        stat: "STR",
        scope: "universal",
        category: "Universal",
        cadence: "daily",
        minutes: `${workout.minutes} min`,
        taskVersion: 2,
        participants: "solo",
        family: "u-resistance",
        cooldownHours: 48,
        equipment: environment === "home" ? "bodyweight" : "weights",
        requestGroup: `regimen-${session}`,
        groupTitle: `Full-body session ${session}`,
        tags: ["Regimen", "Strength", "Full body"],
        ...regimenReward(rank),
        workout,
      };
    }),
  );
  requestCache.set(environment, result);
  return result;
}
export function regimenGoals(): Objective[] {
  return REGIMEN_RANKS.flatMap((rank) =>
    (["weekly", "monthly"] as const).map((cadence) => ({
      id: `regimen-${cadence}-${rank.toLowerCase()}`,
      title: `Strength ${cadence === "weekly" ? "week" : "month"} · ${rank}`,
      description: `Complete ${cadence === "weekly" ? "two" : "eight"} full-body sessions at ${rank} rank or above on separate days, following the two-day weekly regimen with recovery. Review the same exercise setups and record one specific next progression.`,
      rank,
      stat: "STR",
      scope: "universal",
      category: "Universal",
      cadence,
      minutes:
        cadence === "weekly" ? "2 strength days" : "8 strength days · 28+ days",
      taskVersion: 2,
      participants: "solo",
      family: `regimen-goal-${cadence}`,
      practice: {
        family: "u-resistance",
        minimumRank: rank,
        workoutOnly: true,
      },
      minimumSessions: cadence === "weekly" ? 2 : 8,
      minimumDays: cadence === "weekly" ? 3 : 28,
      checklist: [
        "Review logged repetitions, setup and load",
        "Choose one repeatable target for the next sessions",
      ],
      requestGroup: `regimen-goal-${cadence}`,
      groupTitle: `Regimen ${cadence === "weekly" ? "week" : "month"}`,
      xp: TASK_XP[rank] * (cadence === "weekly" ? 4 : 18),
      gold: TASK_GOLD[rank] * (cadence === "weekly" ? 4 : 18),
    })),
  );
}
export const hardStrength = (
  x:
    | Pick<
        Objective,
        "id" | "family" | "stat" | "scope" | "cadence" | "workout"
      >
    | Completion,
) =>
  x.cadence === "daily" &&
  (!!x.workout ||
    ["u-push", "u-pull", "u-legs", "u-resistance"].includes(x.family || "") ||
    (x.stat === "STR" && x.scope === "class" && !x.id.includes("technique")));
export function comparableExercise(
  a: Completion,
  b: Completion,
  id: string,
): boolean {
  const x = a.result?.workout?.exercises.find((r) => r.id === id),
    y = b.result?.workout?.exercises.find((r) => r.id === id);
  return (
    !!x &&
    !!y &&
    !!a.workout &&
    !!b.workout &&
    a.workout.environment === b.workout.environment &&
    x.variation.trim().toLowerCase() === y.variation.trim().toLowerCase() &&
    Math.abs((x.loadKg || 0) - (y.loadKg || 0)) <= 0.05
  );
}
export function exerciseProgress(
  c: Character,
  p: WorkoutPrescription,
  id: string,
) {
  const e = p.exercises.find((x) => x.id === id)!;
  const logs = c.completions
    .filter(
      (x) =>
        x.result?.workout &&
        x.workout?.environment === p.environment &&
        x.workout?.rank === p.rank &&
        x.workout.exercises.find((q) => q.id === id)?.name === e.name &&
        x.result.workout.exercises.some((r) => r.id === id),
    )
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const [latest, previous] = logs;
  const result = latest?.result?.workout?.exercises.find((r) => r.id === id);
  const top = (r: ExerciseLog | undefined) =>
    !!r &&
    (!e.load || r.loadKg !== undefined) &&
    r.reps.length === e.sets &&
    r.reps.every((n) => n >= e.max) &&
    r.rir >= 2;
  const ready =
    !!latest &&
    !!previous &&
    comparableExercise(latest, previous, id) &&
    dateNumber(localDate(new Date(latest.at))) -
      dateNumber(localDate(new Date(previous.at))) >=
      2 &&
    top(result) &&
    top(previous.result?.workout?.exercises.find((r) => r.id === id));
  return {
    latest: result,
    at: latest?.at,
    ready,
    suggestion: ready
      ? e.progress
      : "Keep the same setup and build toward the top of the range with controlled form.",
  };
}
export function planProgress(c: Character, p: TrainingPlan) {
  const records = c.completions
    .filter(
      (x) =>
        x.workout?.rank === p.rank &&
        x.workout.environment === p.environment &&
        localDate(new Date(x.at)) >= p.startedOn &&
        x.result?.workout,
    )
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const days = new Set(records.map((x) => localDate(new Date(x.at)))).size;
  const span = records.length
    ? dateNumber(localDate(new Date(records.at(-1)!.at))) -
      dateNumber(localDate(new Date(records[0].at)))
    : 0;
  const ready =
    days >= 4 &&
    span >= 10 &&
    ["A", "B"].every((session) =>
      records.some((x) => x.workout!.session === session),
    ) &&
    records
      .slice(-2)
      .every((x) =>
        x.result!.workout!.exercises.every(
          (e, i) =>
            e.reps.every((n) => n >= x.workout!.exercises[i].max) && e.rir >= 2,
        ),
      );
  return {
    days,
    ready,
    next: REGIMEN_RANKS[REGIMEN_RANKS.indexOf(p.rank) + 1],
  };
}
