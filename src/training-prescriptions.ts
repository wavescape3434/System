import type { TaskRank } from "./task-ranks";
export const REGIMEN_RANKS = ["F", "E", "D", "C"] as const;
export type RegimenRank = (typeof REGIMEN_RANKS)[number];
export type TrainingEnvironment = "home" | "weights" | "gym";
export type MovementLevels = Partial<
  Record<"squat" | "hinge" | "core", 1 | 2 | 3 | 4>
>;
export interface TrainingPlan {
  movementLevels?: MovementLevels;
  pushLevel?: 1 | 2 | 3 | 4;
  walkMinutes?: number;
  version: 1;
  startedOn: string;
  rank: RegimenRank;
  environment: TrainingEnvironment;
}
export interface ExercisePrescription {
  id: string;
  name: string;
  sets: number;
  min: number;
  max: number;
  perSide?: boolean;
  restSeconds: number;
  cues: string;
  progress: string;
  load: boolean;
}
export interface WorkoutPrescription {
  movementLevels?: MovementLevels;
  version: 1 | 2;
  pushLevel?: 1 | 2 | 3 | 4;
  rank: RegimenRank;
  session: "A" | "B";
  environment: TrainingEnvironment;
  minutes: string;
  rir: string;
  warmup: string;
  exercises: ExercisePrescription[];
}
export interface ExerciseLog {
  id: string;
  variation: string;
  reps: number[];
  loadKg?: number;
  rir: number;
}
export interface WorkoutLog {
  prescription: WorkoutPrescription;
  exercises: ExerciseLog[];
}
export const TRAINING_RANKS: Record<
  TaskRank,
  { name: string; dose: string; progress: string }
> = {
  F: {
    name: "Introduction",
    dose: "Two 10–15 minute strength sessions; five short walks each week.",
    progress:
      "Learn controlled movement and establish repeatable sessions. Start with one work set per exercise.",
  },
  E: {
    name: "Foundation",
    dose: "Two 20–30 minute strength sessions; five 15-minute walks.",
    progress:
      "Build to two controlled sets and increase repetitions before difficulty.",
  },
  D: {
    name: "Regular training",
    dose: "Two 25–40 minute strength sessions; build toward 150 moderate walking minutes per week.",
    progress:
      "Repeat a full-body program and improve reps or load at a comparable effort.",
  },
  C: {
    name: "Challenging training",
    dose: "Two 35–50 minute strength sessions with three work sets; maintain aerobic activity.",
    progress:
      "Use a harder variation or measurable resistance with consistent technique and recovery.",
  },
  B: {
    name: "Advanced block",
    dose: "A prepared weekly goal within an individual training block.",
    progress:
      "Meet a declared exercise-specific target and retain comparable training records. More repetitions alone do not establish expertise.",
  },
  A: {
    name: "Expert goal",
    dose: "A demanding weekly assessment supported by a longer training history.",
    progress:
      "Use a named discipline, technique standard and an independently reviewable result.",
  },
  S: {
    name: "Exceptional achievement",
    dose: "A monthly achievement after sustained preparation.",
    progress:
      "Meet a predeclared, externally defined performance standard; preparation time alone does not qualify.",
  },
  SS: {
    name: "Masterwork",
    dose: "An advanced assessed achievement with at least twelve weeks of recorded preparation.",
    progress:
      "Choose the standard in advance for the particular discipline and assessment protocol.",
  },
  SSS: {
    name: "Legendary achievement",
    dose: "A rare expert achievement with at least twenty-four weeks of recorded preparation.",
    progress:
      "Retain independent assessment and the exact external standard. These are game tiers, not published population percentiles.",
  },
};
export const TRAINING_SOURCES = [
  {
    title: "CDC: Adult physical activity",
    url: "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html",
    rule: "At least two muscle-strengthening days and 150 moderate aerobic minutes weekly are long-term adult targets; shorter activity is a useful start.",
  },
  {
    title:
      "WHO: Guidelines on physical activity and sedentary behaviour (2020)",
    url: "https://www.who.int/publications/i/item/9789240015128",
    rule: "Build from current ability; 150–300 moderate aerobic minutes and strengthening all major muscle groups at least twice weekly.",
  },
  {
    title: "ACSM: Progression models in resistance training (2009)",
    url: "https://pubmed.ncbi.nlm.nih.gov/19204579/",
    rule: "Progress repetitions/load with consistent technique; a 2–10% load increase is described after exceeding the repetition target. This app uses a conservative 2–5% suggestion, not automatic loading.",
  },
  {
    title: "NHS: Strength exercises",
    url: "https://www.nhs.uk/live-well/exercise/strength-exercises/",
    rule: "Home-friendly movements include sit-to-stand, supported squats, calf raises and wall press-ups.",
  },
  {
    title: "Dunlosky et al.: Effective learning techniques (2013)",
    url: "https://doi.org/10.1177/1529100612453266",
    rule: "Knowledge tasks should combine retrieval, spaced practice and checked application within a defined subject.",
  },
];
// Saved v1 recipes are immutable contracts. Introduce a new version before changing them.
const prescriptionCache = new Map<string, WorkoutPrescription>();
export function workoutPrescription(
  rank: RegimenRank,
  session: "A" | "B",
  environment: TrainingEnvironment,
): WorkoutPrescription {
  const key = `${rank}:${session}:${environment}`;
  const cached = prescriptionCache.get(key);
  if (cached) return cached;
  const i = REGIMEN_RANKS.indexOf(rank),
    sets = [1, 2, 2, 3][i],
    min = [5, 6, 8, 6][i],
    max = [8, 10, 12, 10][i];
  const weighted = environment !== "home",
    gym = environment === "gym";
  const ex = (
    id: string,
    name: string,
    cues: string,
    progress: string,
    load = false,
    perSide = false,
  ): ExercisePrescription => ({
    id,
    name,
    sets,
    min,
    max,
    restSeconds: i < 2 ? 90 : 120,
    cues,
    progress,
    load,
    ...(perSide ? { perSide } : {}),
  });
  const squat = ex(
    "squat",
    gym
      ? "Leg press"
      : weighted
        ? "Goblet squat to a chair"
        : i === 0
          ? "Chair sit-to-stand"
          : "Controlled bodyweight squat",
    "Use a stable chair against a wall when needed, with hand assistance if necessary. Keep feet planted, lower under control and use a repeatable comfortable depth. Record the assistance.",
    "Add repetitions first; then reduce hand assistance, lower the target slightly or use a small load increase.",
    weighted,
  );
  const push = ex(
    "push",
    gym
      ? "Machine chest press"
      : weighted
        ? "Dumbbell floor press"
        : i === 0
          ? "Wall pushup"
          : i < 3
            ? "Incline pushup"
            : "Floor or low-incline pushup",
    weighted
      ? "Use a comfortable grip. Lower under control; keep shoulders and trunk stable. Stop before technique changes."
      : "Use a fixed wall or sturdy raised surface. Keep the body aligned and chest moving toward the same target each repetition. A lower incline is harder.",
    weighted
      ? "Increase the smallest available load after two comparable top-range sessions."
      : "Lower the incline only after two top-range sessions at the intended effort. Keep the new height in the log.",
    weighted,
  );
  const row = ex(
    "row",
    gym
      ? "Seated cable row"
      : weighted
        ? "Supported one-arm dumbbell row"
        : "Seated self-resisted row",
    weighted
      ? "Keep the trunk stable. Pull the elbow back without shrugging or twisting; lower under control."
      : "Sit upright. One hand resists the opposite wrist as that elbow moves backward; take about three seconds out and three seconds back. Repeat each side with steady resistance.",
    weighted
      ? "Keep the same range and support. Add reps, then a small measurable load increase."
      : "Keep self-resistance consistent. For measurable pulling-strength progression, choose the weights version with a dumbbell or a weighed sturdy backpack; self-resistance is not an equivalent load test.",
    weighted,
    !gym,
  );
  const hinge = ex(
    "hinge",
    weighted ? "Dumbbell Romanian deadlift" : "Glute bridge",
    weighted
      ? "Begin with a light familiar load. Soften the knees, send hips back and keep the load close; stop at a range you can control without rounding."
      : "Lie on the floor with knees bent and feet planted. Tighten the trunk and raise hips without arching the lower back; pause briefly and lower slowly.",
    weighted
      ? "Increase reps before load and retain the same controlled range."
      : "Add reps; then pause for two seconds at the top or use a controlled staggered-stance variation.",
    weighted,
  );
  const core = ex(
    "core",
    session === "A" ? "Dead bug" : "Bird dog",
    session === "A"
      ? "Lie on your back. Lower the opposite arm and leg slowly while keeping the trunk still; shorten the reach to retain control."
      : "On hands and knees, extend the opposite arm and leg without rotating the trunk. Return under control before changing sides.",
    "Increase repetitions, then lengthen the reach while keeping the trunk still. Speed is not the progression target.",
    false,
    true,
  );
  if (session === "B" && i > 0) {
    squat.id = "split-squat";
    squat.name = weighted
      ? "Supported split squat with a dumbbell"
      : "Supported split squat";
    squat.perSide = true;
    squat.cues =
      "Hold stable support. Use a split stance, lower straight down through a comfortable range and keep the front foot planted. Count each side separately.";
  }
  const result: WorkoutPrescription = {
    version: 1,
    rank,
    session,
    environment,
    minutes: ["10–15", "20–30", "25–40", "35–50"][i],
    rir: ["3–4", "2–4", "2–3", "2–3"][i],
    warmup:
      "Walk or march easily for 3–5 minutes, then do three easy practice repetitions of each movement. Warm-up repetitions are separate from work sets.",
    exercises: [squat, push, row, hinge, core],
  };
  for (const e of result.exercises) Object.freeze(e);
  Object.freeze(result.exercises);
  Object.freeze(result);
  prescriptionCache.set(key, result);
  return result;
}
export const regimenId = (rank: RegimenRank, session: "A" | "B") =>
  `regimen-${session.toLowerCase()}-${rank.toLowerCase()}`;
export const validTrainingPlan = (v: unknown): v is TrainingPlan => {
  const p = v as TrainingPlan;
  if (
    !p ||
    p.version !== 1 ||
    (p.movementLevels !== undefined &&
      !validMovementLevels(p.movementLevels)) ||
    (p.pushLevel !== undefined && ![1, 2, 3, 4].includes(p.pushLevel)) ||
    (p.walkMinutes !== undefined &&
      (!Number.isInteger(p.walkMinutes) ||
        p.walkMinutes < 5 ||
        p.walkMinutes > 30 ||
        p.walkMinutes % 5 !== 0)) ||
    !REGIMEN_RANKS.includes(p.rank) ||
    !["home", "weights", "gym"].includes(p.environment) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(p.startedOn)
  )
    return false;
  const time = Date.parse(p.startedOn + "T12:00:00Z");
  return (
    Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 10) === p.startedOn
  );
};
export const canonicalWorkout = (v: unknown): string =>
  JSON.stringify(v, (_key, value) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
        )
      : value,
  );
export function validWorkoutPrescription(v: unknown): v is WorkoutPrescription {
  const p = v as WorkoutPrescription;
  if (
    !p ||
    ![1, 2].includes(p.version) ||
    !REGIMEN_RANKS.includes(p.rank) ||
    !["A", "B"].includes(p.session) ||
    !["home", "weights", "gym"].includes(p.environment)
  )
    return false;
  if (
    p.version === 2 &&
    (![1, 2, 3, 4].includes(p.pushLevel!) ||
      (p.movementLevels !== undefined &&
        !validMovementLevels(p.movementLevels)))
  )
    return false;
  return (
    canonicalWorkout(p) ===
    canonicalWorkout(
      p.version === 2
        ? abilityWorkout(
            p.rank,
            p.session,
            p.environment,
            p.pushLevel!,
            p.movementLevels,
          )
        : workoutPrescription(p.rank, p.session, p.environment),
    )
  );
}
export function abilityWorkout(
  rank: RegimenRank,
  session: "A" | "B",
  environment: TrainingEnvironment,
  pushLevel: 1 | 2 | 3 | 4,
  movementLevels?: MovementLevels,
): WorkoutPrescription {
  const base = workoutPrescription(rank, session, environment);
  return {
    ...base,
    version: 2,
    pushLevel,
    ...(movementLevels ? { movementLevels: { ...movementLevels } } : {}),
    exercises: base.exercises.map((original) => {
      const e = calibrateMovement(
        original,
        environment,
        session,
        movementLevels,
      );
      return e.id !== "push" || environment !== "home"
        ? { ...e }
        : {
            ...e,
            name: [
              "Wall pushup",
              "Incline pushup",
              "Floor pushup",
              "Harder floor pushup variation",
            ][pushLevel - 1],
            min: 6,
            max: 12,
            cues:
              pushLevel === 4
                ? "Start with feet on a low stable step or a three-second lowering phase at floor level. Choose a setup where 6–12 clean reps leave 2–3 more possible. If you could do many more, use a slightly harder setup; if six clean reps are not possible, lower the feet or use ordinary floor pushups. Record elevation or tempo."
                : "Use the named variation on a fixed surface and a consistent full comfortable range. Choose surface height or tempo so 6–12 reps leave 2–3 clean reps possible. Record the setup. Warm-up sets do not count as work sets.",
            progress:
              "After two comparable top-range sessions with at least two clean reps left, lower the incline, add a slow lowering phase, or raise the feet a small amount. Change one variable and rebuild from six reps.",
          };
    }),
  };
}
export function validWorkoutLog(v: unknown): v is WorkoutLog {
  const w = v as WorkoutLog;
  return (
    !!w &&
    Object.keys(w).every((k) => ["prescription", "exercises"].includes(k)) &&
    validWorkoutPrescription(w.prescription) &&
    Array.isArray(w.exercises) &&
    w.exercises.length === w.prescription.exercises.length &&
    w.exercises.every((r, i) => {
      const p = w.prescription.exercises[i];
      return (
        r &&
        Object.keys(r).every((k) =>
          ["id", "variation", "reps", "loadKg", "rir"].includes(k),
        ) &&
        r.id === p.id &&
        typeof r.variation === "string" &&
        r.variation.trim().length > 0 &&
        r.variation.length <= 100 &&
        Array.isArray(r.reps) &&
        r.reps.length === p.sets &&
        r.reps.every((n) => Number.isInteger(n) && n >= p.min && n <= 1000) &&
        typeof r.rir === "number" &&
        Number.isInteger(r.rir) &&
        r.rir >= 0 &&
        r.rir <= 10 &&
        (p.load
          ? typeof r.loadKg === "number" &&
            Number.isFinite(r.loadKg) &&
            r.loadKg > 0 &&
            r.loadKg <= 10000
          : r.loadKg === undefined)
      );
    })
  );
}

export function validMovementLevels(input: unknown): input is MovementLevels {
  return (
    !!input &&
    typeof input === "object" &&
    !Array.isArray(input) &&
    Object.entries(input).every(
      ([key, n]) =>
        ["squat", "hinge", "core"].includes(key) && [1, 2, 3, 4].includes(n),
    )
  );
}
function calibrateMovement(
  e: ExercisePrescription,
  environment: TrainingEnvironment,
  session: "A" | "B",
  levels?: MovementLevels,
): ExercisePrescription {
  const key = e.id === "split-squat" ? "squat" : e.id;
  const level = levels?.[key as keyof MovementLevels];
  if (!level || environment !== "home") return e;
  const names: Record<string, string[]> = {
    squat: [
      "Chair sit-to-stand",
      "Controlled bodyweight squat",
      "Supported split squat",
      "Slow-tempo split squat",
    ],
    hinge: [
      "Glute bridge",
      "Paused glute bridge",
      "Staggered-stance glute bridge",
      "Controlled single-leg glute bridge",
    ],
    core: [
      session === "A" ? "Short-reach dead bug" : "Short-reach bird dog",
      session === "A" ? "Dead bug" : "Bird dog",
      session === "A" ? "Long-reach dead bug" : "Paused bird dog",
      session === "A" ? "Slow long-reach dead bug" : "Slow paused bird dog",
    ],
  };
  const cues: Record<string, string> = {
    squat:
      "Keep a stable support beside you; lower through the same comfortable depth. For split squats use a split stance and count each side. At level four lower for three seconds.",
    hinge:
      "Lie on your back with feet planted; raise the hips without arching. Pause for two seconds at level two, shift more work to one side at level three, and lift the other foot only if level four stays controlled.",
    core: "Keep the trunk still. Reach only as far as you can control. At levels three and four extend the opposite arm and leg farther; use a two-second pause, then a three-second return at level four.",
  };
  return {
    ...e,
    name: names[key][level - 1],
    min: 6,
    max: 12,
    perSide:
      key === "core" || ((key === "squat" || key === "hinge") && level >= 3),
    cues:
      cues[key] +
      " Choose a setup leaving 2–3 clean reps. Reduce difficulty if the minimum cannot be performed with control.",
  };
}
