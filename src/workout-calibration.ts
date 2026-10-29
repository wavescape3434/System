import { hasEquipment } from "./preferences";
import type { Character } from "./domain";
import type {
  WorkoutCalibration,
  TrainingEnvironment,
  RegimenRank,
} from "./training-prescriptions";
import { calibratedWorkoutRecipe } from "./training-prescriptions";
import { comparableTraining } from "./adaptive-ability";
const norm = (s: string) => s.trim().toLowerCase();
export function workoutCalibration(
  c: Character,
  environment: TrainingEnvironment,
  assessedPush: 1 | 2 | 3 | 4,
  session: "A" | "B",
): WorkoutCalibration {
  const manual = c.trainingPlan?.automaticAbility === false;
  const calibration: WorkoutCalibration = {
    push: manual
      ? c.trainingPlan?.pushLevel || assessedPush
      : (Math.max(c.trainingPlan?.pushLevel || 1, assessedPush) as
          1 | 2 | 3 | 4),
    levels: { ...c.trainingPlan?.movementLevels },
    loads: {},
  };
  const assessment =
    c.assessmentHistory?.at(-1)?.assessment || c.baseline.assessment;
  if (manual) return calibration;
  if (
    assessment?.strengthTest === "chair" &&
    !assessment.chairAssisted &&
    (assessment.chairStands || 0) >= 25
  )
    calibration.levels!.squat = Math.max(calibration.levels!.squat || 1, 2) as
      1 | 2 | 3 | 4;
  if (
    environment === "home" &&
    hasEquipment(c.preferences?.equipment, "pullup-bar") &&
    (assessment?.pullups || 0) >= 1
  )
    calibration.pullLevel =
      (assessment?.pullups || 0) >= 10
        ? 4
        : (assessment?.pullups || 0) >= 4
          ? 3
          : 2;
  for (const id of [
    "push",
    "squat",
    "split-squat",
    "row",
    "hinge",
    "core",
  ] as const) {
    const [last, previous] = comparableTraining(
      c,
      id,
      environment,
      id === "core" ? session : undefined,
    );
    if (!last?.workout) continue;
    const p = last.workout.exercises.find((e) => e.id === id)!,
      r = last.result!.workout!.exercises.find((e) => e.id === id)!;
    const old = previous?.result?.workout?.exercises.find((e) => e.id === id);
    const comparable =
      !!previous &&
      !!old &&
      norm(r.variation) === norm(old.variation) &&
      Math.abs((r.loadKg || 0) - (old.loadKg || 0)) < 0.05 &&
      Date.parse(last.at) - Date.parse(previous.at) >= 48 * 3600000 &&
      p.name === previous.workout!.exercises.find((e) => e.id === id)?.name;
    const good = (x: typeof r | undefined, target: typeof p) =>
      !!x &&
      x.reps.length === target.sets &&
      x.reps.every((n) => n >= target.max) &&
      x.rir >= 2;
    const ready =
      comparable &&
      good(r, p) &&
      good(
        old,
        previous!.workout!.exercises.find((e) => e.id === id)!,
      );
    if (p.load && r.loadKg)
      calibration.loads![id] = Math.min(
        10000,
        Math.round(r.loadKg * (r.rir === 0 ? 0.95 : ready ? 1.025 : 1) * 10) /
          10,
      );
    if (environment !== "home") continue;
    const key = id === "split-squat" ? "squat" : id;
    if (key === "row") continue; // No measurable overload is inferred from self-resistance.
    const name = p.name.toLowerCase();
    const known =
      key === "push"
        ? last.workout.pushLevel ||
          (name.includes("wall") ? 1 : name.includes("incline") ? 2 : 3)
        : key === "squat"
          ? name.includes("slow")
            ? 4
            : name.includes("split")
              ? 3
              : name.includes("chair")
                ? 1
                : 2
          : key === "hinge"
            ? name.includes("single-leg")
              ? 4
              : name.includes("staggered")
                ? 3
                : name.includes("paused")
                  ? 2
                  : 1
            : name.includes("slow")
              ? 4
              : name.includes("long") || name.includes("paused")
                ? 3
                : name.includes("short")
                  ? 1
                  : 2;
    const next = Math.min(4, known + (ready ? 1 : 0)) as 1 | 2 | 3 | 4;
    if (key === "push")
      calibration.push = Math.max(calibration.push, next) as 1 | 2 | 3 | 4;
    else
      calibration.levels![key as "squat" | "hinge" | "core"] = Math.max(
        calibration.levels![key as "squat" | "hinge" | "core"] || 1,
        next,
      ) as 1 | 2 | 3 | 4;
  }
  return calibration;
}
export function adaptiveWorkout(
  c: Character,
  rank: RegimenRank,
  session: "A" | "B",
  environment: TrainingEnvironment,
  assessedPush: 1 | 2 | 3 | 4,
) {
  return calibratedWorkoutRecipe(
    rank,
    session,
    environment,
    workoutCalibration(c, environment, assessedPush, session),
  );
}
