import type { Attribute, Character, Objective } from "./domain";
import { regimenReward } from "./training-regimen";
import type { TaskRank } from "./task-ranks";
import { TASK_RANKS } from "./task-ranks";
import { requestReward } from "./request-balance";

const HABITS: [Attribute, string, string, string, string][] = [
  [
    "CON",
    "walk",
    "Walking",
    "u-walk",
    "Take a comfortable walk for at least five minutes",
  ],
  [
    "DEX",
    "mobility",
    "Mobility",
    "u-mobility",
    "Practice gentle controlled mobility for at least five minutes",
  ],
  [
    "STR",
    "strength",
    "Strength",
    "u-push",
    "Complete suitable controlled wall, incline, or floor pushup practice with recovery between sessions",
  ],
  [
    "INT",
    "reading",
    "Reading",
    "u-reading",
    "Read for at least five focused minutes and record the main point",
  ],
  [
    "WIS",
    "scripture",
    "Scripture",
    "u-scripture",
    "Read a short Bible passage in context and record its main teaching",
  ],
  [
    "CHA",
    "communication",
    "Communication",
    "u-connection",
    "Draft a thoughtful message or practice recorded listening, then check its clarity",
  ],
];
export function habitRequests(): Objective[] {
  const result: Objective[] = [];
  for (const [stat, key, name, family, activity] of HABITS) {
    for (const [rank, days, span] of [
      ["F", 3, 2],
      ["E", 5, 4],
    ] as const) {
      // Strength stays at three spaced practice days, including the E preparation review.
      const target = stat === "STR" ? 3 : days;
      result.push({
        id: `habit-${key}-weekly-${rank.toLowerCase()}`,
        title: `${name} week · ${target} days`,
        description: `${activity} on ${target} different days. ${stat === "STR" ? "Keep recovery days between sessions; review technique for the E route." : "Keep the practice manageable and record each session."}`,
        stat,
        rank,
        cadence: "weekly",
        scope: "universal",
        category: "Universal",
        minutes: `${target} practice days`,
        family: `habit-${key}-weekly`,
        practice: { family },
        minimumDays: span,
        minimumSessions: target,
        taskVersion: 2,
        participants: "solo",
        ...requestReward(rank, "weekly"),
      });
    }
    for (const [rank, days] of [
      ["F", 8],
      ["E", 10],
      ["D", 12],
    ] as const)
      result.push({
        id: `habit-${key}-monthly-${rank.toLowerCase()}`,
        title: `${name} adventure · ${days} days`,
        description: `${activity} on ${days} different days across at least four weeks. Keep dated practice records and review the result.`,
        stat,
        rank,
        cadence: "monthly",
        scope: "universal",
        category: "Universal",
        minutes: `28+ days · ${days} practice days`,
        family: `habit-${key}-monthly`,
        practice: { family },
        minimumDays: 28,
        minimumSessions: days,
        taskVersion: 2,
        participants: "solo",
        persistent: true,
        checklist: [
          "Choose the routine and starting point",
          "Complete the dated practice",
          "Review the result and next step",
        ],
        ...requestReward(rank, "monthly"),
      });
  }
  return result;
}
const MONTH_DAYS: Record<TaskRank, number> = {
  F: 28,
  E: 28,
  D: 28,
  C: 28,
  B: 28,
  A: 42,
  S: 56,
  SS: 84,
  SSS: 168,
};
const PRACTICE_DAYS: Record<TaskRank, number> = {
  F: 8,
  E: 10,
  D: 12,
  C: 12,
  B: 12,
  A: 18,
  S: 24,
  SS: 36,
  SSS: 72,
};
export function balanceRequest(c: Character, o: Objective): Objective {
  const rank = o.rank || "D";
  // A demanding single session belongs to a prepared quest or adventure, never an oversized daily task.
  let cadence = o.cadence;
  if (cadence === "daily" && TASK_RANKS.indexOf(rank) > TASK_RANKS.indexOf("C"))
    cadence =
      TASK_RANKS.indexOf(rank) > TASK_RANKS.indexOf("A") ? "monthly" : "weekly";
  if (
    cadence === "weekly" &&
    TASK_RANKS.indexOf(rank) > TASK_RANKS.indexOf("A")
  )
    cadence = "monthly";
  let shaped: Objective = { ...o, cadence, ...requestReward(rank, cadence) };
  if (cadence === "weekly" && !o.once) {
    if (o.scope === "class" && !o.id.endsWith("review-weekly"))
      shaped = {
        ...shaped,
        minimumDays: 4,
        minimumSessions: 3,
        practice: { classId: c.activeClass },
      };
    if (o.scope === "profession")
      shaped = {
        ...shaped,
        minimumDays: 4,
        minimumSessions: 3,
        practice: { careerCategory: o.careerCategory },
      };
    if (
      ["u-run-10k", "u-half-marathon", "u-pullup-8", "u-pullup-12"].includes(
        o.id,
      )
    )
      shaped = {
        ...shaped,
        minimumDays: 4,
        minimumSessions: 2,
        practice: { family: o.family },
        description: `Record two suitable preparation sessions on separate days this week, then complete the target after recovery. ${o.description}`,
      };
    if (o.id === "u-teach-topic")
      shaped = {
        ...shaped,
        minimumDays: 2,
        minimumSessions: 2,
        description: `Prepare and check your material on separate days before the final recording. ${o.description}`,
      };
  }
  if (cadence === "monthly") {
    const minimumDays = Math.max(o.minimumDays || 0, MONTH_DAYS[rank]),
      minimumSessions = Math.max(o.minimumSessions || 0, PRACTICE_DAYS[rank]);
    shaped = {
      ...shaped,
      persistent: !o.once,
      minimumDays,
      minimumSessions,
      minutes: `${minimumDays}+ days · ${minimumSessions} practice days`,
      checklist: o.checklist || [
        "Record a starting point and completion standard",
        "Complete the dated preparation and project",
        "Verify the outcome and save the result",
      ],
    };
    if (o.scope === "class") shaped.practice = { classId: c.activeClass };
    if (o.scope === "profession")
      shaped.practice = { careerCategory: o.careerCategory };
    if (o.id === `${c.activeClass}-monthly`)
      shaped.title = `${o.category} training adventure`;
  }
  if (o.workout) shaped = { ...shaped, ...regimenReward(o.workout.rank) };
  if (o.id.startsWith("regimen-weekly-") || o.id.startsWith("regimen-monthly-"))
    shaped = {
      ...shaped,
      minimumSessions: o.cadence === "weekly" ? 2 : 8,
      minimumDays: o.cadence === "weekly" ? 3 : 28,
    };
  if (
    c.trainingPlan &&
    o.scope === "class" &&
    o.stat === "STR" &&
    o.cadence !== "daily"
  )
    shaped = {
      ...shaped,
      minimumSessions: o.cadence === "weekly" ? 2 : 8,
      minimumDays: o.cadence === "weekly" ? 3 : 28,
      practice: {
        classId: c.activeClass,
        minimumRank: c.trainingPlan.rank,
        workoutOnly: true,
      },
    };
  return shaped;
}
