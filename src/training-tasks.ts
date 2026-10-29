import { classPractice, classSecondaryPractice } from "./class-practice";
import {
  regimenRequests,
  regimenGoals,
  hardStrength,
  nextStrengthSession,
  workoutSummary,
  personalizedWorkout,
} from "./training-regimen";
import { periodStart, adventureConditionMet } from "./calendar-goals";
import { habitRequests, balanceRequest } from "./adventure-requests";
import { requestReward } from "./request-balance";
import { hasEquipment } from "./preferences";
import type { Character, Objective, Attribute } from "./domain";
import { CLASSES } from "./class-catalog";
import { TASK_RANKS, TASK_XP, TASK_GOLD } from "./task-ranks";
import type { TaskRank } from "./task-ranks";
import { careerCategory } from "./careers";
type TaskRow = [
  string,
  string,
  string,
  TaskRank,
  Attribute,
  string,
  string,
  ("bodyweight" | "pullup-bar" | "weights")?,
  number?,
  number?,
];
const ROWS: TaskRow[] = [
  [
    "walk-5",
    "Walk for 5 minutes",
    "Walk at a comfortable pace for five minutes.",
    "F",
    "CON",
    "5 min",
    "walk",
  ],
  [
    "walk-15",
    "Walk for 15 minutes",
    "Complete a comfortable fifteen-minute walk.",
    "E",
    "CON",
    "15 min",
    "walk",
  ],
  [
    "walk-brisk",
    "Brisk walk for 30 minutes",
    "Walk at a pace where conversation is possible but singing is difficult. Include an easy warm-up and cool-down.",
    "D",
    "CON",
    "30 min",
    "walk",
  ],
  [
    "run-walk",
    "Run/walk intervals",
    "After warming up, alternate one minute of comfortable jogging with two minutes walking for six rounds.",
    "D",
    "CON",
    "25 min",
    "run",
    undefined,
    24,
  ],
  [
    "run-5k",
    "Complete a 5 km run",
    "Complete five kilometres at a sustainable pace after a progressive run/walk buildup.",
    "C",
    "CON",
    "5 km",
    "run",
    undefined,
    48,
  ],
  [
    "run-10k",
    "Complete a 10 km run",
    "Complete ten kilometres after gradually building weekly running volume.",
    "B",
    "CON",
    "10 km",
    "run",
    undefined,
    72,
  ],
  [
    "half-marathon",
    "Complete a half marathon",
    "Complete a planned half marathon after a progressive training block with recovery weeks.",
    "A",
    "CON",
    "21.1 km",
    "run",
    undefined,
    168,
  ],
  [
    "marathon",
    "Complete a marathon",
    "Finish a marathon after a structured training block and a suitable taper. This is a milestone, not a daily workout.",
    "S",
    "CON",
    "42.2 km",
    "run",
    undefined,
    336,
  ],
  [
    "mobility-5",
    "Mobility for 5 minutes",
    "Practice gentle controlled ankle, hip, and shoulder movement through a comfortable range.",
    "F",
    "DEX",
    "5 min",
    "mobility",
  ],
  [
    "balance-practice",
    "Balance practice",
    "Near a stable support, practice three controlled single-leg stands on each side. Keep eyes open.",
    "E",
    "DEX",
    "10 min",
    "balance",
  ],
  [
    "movement-control",
    "Movement control circuit",
    "Complete three rounds of controlled step-ups, supported balance, and gentle coordination drills.",
    "D",
    "DEX",
    "20 min",
    "movement",
    undefined,
    24,
  ],
  [
    "coordination-session",
    "Coordination progression",
    "Practice a movement skill for thirty minutes with a defined technique target and feedback from video or a partner.",
    "C",
    "DEX",
    "30 min",
    "movement",
    undefined,
    24,
  ],
  [
    "wall-push",
    "Wall pushups · 2 × 5",
    "Complete two sets of five controlled wall pushups, with comfortable rest.",
    "F",
    "STR",
    "2 sets × 5",
    "push",
    "bodyweight",
    24,
  ],
  [
    "incline-push",
    "Incline pushups · 3 × 8",
    "Use a stable raised surface. Complete three sets of eight controlled pushups with full-body alignment and rest between sets.",
    "E",
    "STR",
    "3 sets × 8",
    "push",
    "bodyweight",
    48,
  ],
  [
    "floor-push-8",
    "Floor pushups · 3 × 8",
    "Complete three sets of eight full-range floor pushups. Leave repetitions in reserve and rest between sets.",
    "D",
    "STR",
    "3 sets × 8",
    "push",
    "bodyweight",
    48,
  ],
  [
    "floor-push-20",
    "Floor pushups · 3 × 20",
    "Complete three sets of twenty full-range floor pushups with controlled form and adequate rest. Build to this volume gradually.",
    "C",
    "STR",
    "3 sets × 20",
    "push",
    "bodyweight",
    48,
  ],
  [
    "pullup-3",
    "Pullups · 3 × 3",
    "Complete three sets of three strict pullups from a controlled hang, with no kipping and adequate rest.",
    "C",
    "STR",
    "3 sets × 3",
    "pull",
    "pullup-bar",
    48,
    3,
  ],
  [
    "pullup-8",
    "Pullups · 4 × 8",
    "Complete four sets of eight strict pullups with controlled range and sufficient rest.",
    "B",
    "STR",
    "4 sets × 8",
    "pull",
    "pullup-bar",
    72,
    10,
  ],
  [
    "pullup-12",
    "Pullups · 5 × 12",
    "Complete five sets of twelve strict pullups after progressively building capacity.",
    "A",
    "STR",
    "5 sets × 12",
    "pull",
    "pullup-bar",
    72,
    15,
  ],
  [
    "pullup-20",
    "Pullups · 5 × 20",
    "Complete five sets of twenty strict pullups with full controlled range and adequate rest. This is exceptional volume for an advanced trainee.",
    "S",
    "STR",
    "5 sets × 20",
    "pull",
    "pullup-bar",
    96,
    25,
  ],
  [
    "chair-squat",
    "Chair stands · 2 × 8",
    "Stand from a stable chair and sit under control. Complete two sets of eight. Use an appropriate variation.",
    "E",
    "STR",
    "2 sets × 8",
    "legs",
    "bodyweight",
    48,
  ],
  [
    "bodyweight-squat",
    "Squats · 3 × 12",
    "Complete three controlled sets of twelve squats to a comfortable consistent depth, resting between sets.",
    "D",
    "STR",
    "3 sets × 12",
    "legs",
    "bodyweight",
    48,
  ],
  [
    "split-squat",
    "Split squats · 3 × 10 each side",
    "Complete three controlled sets of ten split squats on each side. Use support if needed.",
    "C",
    "STR",
    "3 × 10 / side",
    "legs",
    "bodyweight",
    48,
  ],
  [
    "weighted-strength",
    "Progressive resistance session",
    "Complete a planned resistance session using familiar loads, controlled technique, and sufficient rest. Progress load or repetitions only when form is consistent.",
    "C",
    "STR",
    "30–50 min",
    "resistance",
    "weights",
    48,
  ],
  [
    "read-5",
    "Read for 5 minutes",
    "Read a short section of a book or article without distractions.",
    "F",
    "INT",
    "5 min",
    "reading",
  ],
  [
    "recall-15",
    "Read and recall",
    "Read for fifteen minutes, close the source, and retrieve three key ideas before checking them.",
    "E",
    "INT",
    "20 min",
    "study",
  ],
  [
    "spaced-recall",
    "Spaced retrieval session",
    "Use twenty minutes of active recall on earlier material. Check errors and schedule another review.",
    "D",
    "INT",
    "20 min",
    "study",
  ],
  [
    "apply-concept",
    "Apply a concept",
    "Study a concept and solve a new problem or build a working example without copying the solution. Verify the result.",
    "C",
    "INT",
    "45–60 min",
    "study",
  ],
  [
    "teach-topic",
    "Teach a difficult topic",
    "Prepare and record a sourced explanation of a difficult topic. Answer five likely questions and check your answers against original sources.",
    "B",
    "INT",
    "2–3 hours",
    "learning-project",
  ],
  [
    "finish-course",
    "Complete an assessed course",
    "Finish a substantive course with its assessments and an original application of the material.",
    "A",
    "INT",
    "Multiweek",
    "learning-milestone",
  ],
  [
    "bible-short",
    "Read a Bible passage",
    "Read a short Bible passage in its surrounding context.",
    "F",
    "WIS",
    "5 min",
    "scripture",
  ],
  [
    "bible-recall",
    "Scripture comprehension",
    "Read a passage, explain its central meaning in your own words, and check that explanation against the context.",
    "E",
    "WIS",
    "15 min",
    "scripture",
  ],
  [
    "bible-application",
    "Study and apply Scripture",
    "Study a passage in context, explain its meaning, and carry out an appropriate personal application that does not require another participant.",
    "D",
    "WIS",
    "25 min",
    "scripture",
  ],
  [
    "chapter-study",
    "Bible chapter study",
    "Study a chapter with its historical and literary context. Explain its main teaching and distinguish it from a personal inference.",
    "C",
    "WIS",
    "45 min",
    "scripture",
  ],
  [
    "service-plan",
    "Complete a service commitment",
    "Identify an actual need, agree on a realistic commitment, carry it out, and ask whether it helped.",
    "B",
    "WIS",
    "This week",
    "service",
  ],
  [
    "christian-study",
    "Complete a Bible study plan",
    "Complete a multiweek Bible study plan with contextual comprehension checks and sustained practical service.",
    "A",
    "WIS",
    "Multiweek",
    "faith-milestone",
  ],
  [
    "contact",
    "Draft a thoughtful message",
    "Write a thoughtful message to a friend. Review its tone and clarity; no reply is required.",
    "F",
    "CHA",
    "5 min",
    "connection",
  ],
  [
    "listen",
    "Recorded listening practice",
    "Listen to a short public talk without the transcript. Summarize its point, then compare your summary against the transcript.",
    "E",
    "CHA",
    "15 min",
    "connection",
  ],
  [
    "explain-clearly",
    "Record a clear explanation",
    "Record a concise explanation. Review whether its purpose, key points, and next action are clear; revise one unclear section.",
    "D",
    "CHA",
    "20 min",
    "communication",
  ],
  [
    "presentation",
    "Solo presentation rehearsal",
    "Rehearse and record a ten-minute presentation alone. Use a clarity and structure checklist to revise the weakest section.",
    "C",
    "CHA",
    "45–60 min",
    "communication",
  ],
  [
    "lead-discussion",
    "Lead a group discussion",
    "Facilitate a planned group discussion, include quieter participants, and produce a clear shared decision or summary.",
    "B",
    "CHA",
    "1–2 hours",
    "communication-project",
  ],
  [
    "mentor-project",
    "Complete a mentoring project",
    "Support someone through an agreed multiweek learning goal. Obtain their feedback and review the outcome.",
    "A",
    "CHA",
    "Multiweek",
    "mentoring-milestone",
  ],
  [
    "movement-plan",
    "Complete a movement-skill plan",
    "Complete four weeks of progressive movement-skill practice, using repeated video or coach feedback and a repeatable performance check.",
    "B",
    "DEX",
    "4 weeks",
    "movement-project",
  ],
  [
    "movement-performance",
    "Perform an assessed skill routine",
    "Prepare and perform a challenging coordination routine. Obtain independent feedback and demonstrate consistent technique across repeated attempts.",
    "A",
    "DEX",
    "Multiweek",
    "movement-milestone",
  ],
  [
    "movement-qualification",
    "Complete an advanced movement assessment",
    "Complete an advanced sport, dance, or movement-skill assessment after a structured preparation block. Save dated practice and independent assessment evidence.",
    "S",
    "DEX",
    "Multiweek",
    "movement-milestone",
  ],
  [
    "learning-capstone",
    "Complete an independently assessed capstone",
    "Finish a substantial original learning project, present it to a qualified reviewer, and correct the issues identified in their assessment.",
    "S",
    "INT",
    "Multiweek",
    "learning-milestone",
  ],
  [
    "service-project",
    "Lead a sustained service project",
    "Deliver a multiweek Christian service project addressing an agreed practical need. Obtain feedback from those served and review its actual benefit.",
    "S",
    "WIS",
    "Multiweek",
    "faith-milestone",
  ],
  [
    "communication-capstone",
    "Lead a substantial team project",
    "Guide a team through an agreed multiweek project, resolve communication problems, and obtain documented feedback on the outcome.",
    "S",
    "CHA",
    "Multiweek",
    "mentoring-milestone",
  ],
];
const DEVELOPMENT: [Attribute, string, string][] = [
  [
    "STR",
    "strength",
    "a progressive strength plan with consistent technique, recovery, and measured improvement",
  ],
  [
    "DEX",
    "movement",
    "a progressive coordination or movement-skill plan with feedback and repeatable performance checks",
  ],
  [
    "CON",
    "conditioning",
    "a progressive conditioning plan with measured distance, pace, or tolerance and adequate recovery",
  ],
  [
    "INT",
    "learning",
    "an assessed learning project with spaced retrieval and a substantial original application",
  ],
  [
    "WIS",
    "service",
    "a sustained Christian study and service commitment with contextual comprehension checks and evidence of practical benefit",
  ],
  [
    "CHA",
    "communication",
    "a sustained communication or mentoring project with repeated practice and feedback from participants",
  ],
];
const ELITE_GOALS: Record<Attribute, [string, string]> = {
  STR: [
    "Meet an established advanced standard in a strength or calisthenics discipline.",
    "Meet an established elite competition or expert qualification standard in a strength discipline.",
  ],
  DEX: [
    "Pass a recognized advanced movement-skill assessment.",
    "Pass an expert performance qualification or achieve an externally judged high-level competition standard.",
  ],
  CON: [
    "Complete an independently verified endurance event beyond ordinary recreational distances.",
    "Complete a recognized ultra-endurance achievement after suitable preparation and independent verification.",
  ],
  INT: [
    "Complete an advanced assessed capstone with substantial original work.",
    "Produce original work that passes expert review at publication or equivalent professional standard.",
  ],
  WIS: [
    "Deliver a sustained Christian service program with reviewed outcomes and Scripture comprehension.",
    "Establish a substantial Christian service program with independently reviewed benefit, accountable leadership, and trained successors.",
  ],
  CHA: [
    "Lead a substantial team through a difficult project with independent participant feedback.",
    "Lead a complex high-stakes collaboration through completion with independently reviewed outcomes and sustained participant feedback.",
  ],
};
export function universalTasks(): Objective[] {
  const list: Objective[] = ROWS.map(
    ([
      id,
      title,
      description,
      rank,
      stat,
      minutes,
      family,
      equipment,
      cooldownHours,
      minimumPullups,
    ]) => ({
      id: `u-${id}`,
      title,
      description,
      rank,
      xp: TASK_XP[rank],
      stat,
      minutes,
      family: `u-${family}`,
      equipment: equipment || "bodyweight",
      cooldownHours,
      minimumPullups,
      participants: "solo",
      cadence: ["service-plan", "lead-discussion"].includes(id)
        ? "weekly"
        : id === "marathon"
          ? "monthly"
          : id === "half-marathon"
            ? "weekly"
            : [
                  "movement-project",
                  "movement-milestone",
                  "learning-milestone",
                  "faith-milestone",
                  "mentoring-milestone",
                ].includes(family)
              ? "monthly"
              : "daily",
      scope: "universal",
      category: "Universal",
      kind: ["STR", "CON", "DEX"].includes(stat) ? "fitness" : undefined,
      taskVersion: 2,
    }),
  );
  for (const [stat, name, goal] of DEVELOPMENT)
    for (const rank of ["SS", "SSS"] as const)
      list.push({
        id: `u-${name}-${rank.toLowerCase()}`,
        title: `${rank === "SS" ? "Masterwork" : "Legendary"} ${name} commitment`,
        description: `Complete ${goal}. ${rank === "SS" ? "Sustain preparation for at least 12 weeks and meet an independently assessed advanced standard." : "Sustain preparation for at least 24 weeks and meet a rare, externally defined expert standard."} ${ELITE_GOALS[stat][rank === "SS" ? 0 : 1]} Time alone does not satisfy this request.`,
        rank,
        xp: TASK_XP[rank],
        stat,
        minutes: rank === "SS" ? "12 weeks" : "24 weeks",
        cadence: "monthly",
        scope: "universal",
        category: "Universal",
        taskVersion: 2,
        family: `u-${name}-long`,
        minimumDays: rank === "SS" ? 84 : 168,
        once: true,
        minimumSessions: rank === "SS" ? 36 : 72,
        checklist: [
          "Record an external performance standard, starting result, and qualified assessor",
          "Complete progressive practice with appropriate recovery",
          "Save dated evidence of work and repeated performance checks",
          rank === "SS"
            ? "Meet the advanced standard and record independent assessment"
            : "Meet the rare expert standard and record independent assessment",
        ],
        statReward: { stat, amount: rank === "SS" ? 3 : 6 },
      });
  for (const o of list) {
    o.gold = TASK_GOLD[o.rank!];
    o.participants ??= "solo";
  }
  list.push(...GROUP_QUESTS, ...habitRequests());
  return list;
}
const GROUP_QUESTS: Objective[] = [
  {
    id: "q-group-hike",
    title: "Group hike",
    description:
      "Complete a planned 60–90 minute hike with companions. Keep a sustainable pace, share navigation decisions, and check that the route suits the group.",
    stat: "CON",
    trainingMix: { CON: 0.7, CHA: 0.3 },
    rank: "C",
    xp: 150,
    gold: 30,
    minutes: "60–90 min",
    family: "u-walk",
    cadence: "weekly",
    scope: "universal",
    category: "Universal",
    taskVersion: 2,
    participants: "group",
    cooldownHours: 24,
  },
  {
    id: "q-listening",
    title: "Conversation and listening quest",
    description:
      "Have a focused conversation. Ask open questions, summarize the other person's view, and ask them to correct anything you missed.",
    stat: "CHA",
    rank: "D",
    xp: 60,
    gold: 12,
    minutes: "20–30 min",
    family: "q-conversation",
    cadence: "weekly",
    scope: "universal",
    category: "Universal",
    taskVersion: 2,
    participants: "group",
  },
  {
    id: "q-study-group",
    title: "Study circle",
    description:
      "Prepare a topic independently, explain it to a study partner, solve unfamiliar problems together, and correct errors using original sources.",
    stat: "INT",
    trainingMix: { INT: 0.7, CHA: 0.3 },
    rank: "C",
    xp: 150,
    gold: 30,
    minutes: "60 min",
    family: "q-study",
    cadence: "weekly",
    scope: "universal",
    category: "Universal",
    taskVersion: 2,
    participants: "group",
  },
  {
    id: "q-service-team",
    title: "Service team commission",
    description:
      "Agree on a useful Christian service project with others. Complete your responsibilities and obtain feedback from the people served.",
    stat: "WIS",
    trainingMix: { WIS: 0.7, CHA: 0.3 },
    rank: "B",
    xp: 350,
    gold: 70,
    minutes: "2–3 hours",
    family: "q-service",
    cadence: "weekly",
    scope: "universal",
    category: "Universal",
    taskVersion: 2,
    participants: "group",
  },
  {
    id: "q-training-partner",
    title: "Partner technique review",
    description:
      "Complete a suitable strength session with a partner. Review each other's technique and record one useful correction without competing for maximum load.",
    stat: "STR",
    trainingMix: { STR: 0.8, CHA: 0.2 },
    rank: "C",
    xp: 150,
    gold: 30,
    minutes: "45 min",
    family: "u-resistance",
    cadence: "weekly",
    scope: "universal",
    category: "Universal",
    taskVersion: 2,
    participants: "group",
    cooldownHours: 48,
  },
];
export function rankedObjectives(
  c: Character,
  legacy: Objective[],
): Objective[] {
  const list: Objective[] = legacy
    .filter((o) => o.scope !== "universal")
    .map((o) => {
      const rank: TaskRank =
        o.cadence === "monthly"
          ? "B"
          : o.cadence === "weekly"
            ? "C"
            : o.id.endsWith("technique-daily")
              ? "E"
              : "D";
      return {
        ...o,
        rank,
        xp: TASK_XP[rank],
        taskVersion: 2 as const,
        gold: TASK_GOLD[rank],
        participants: "solo" as const,
        family:
          o.scope === "class" ? `class-${c.activeClass}-${o.cadence}` : o.id,
      };
    });
  // The category is determined by the selected role/focus; these are not global menu choices.
  const role = c.profession.toLowerCase(),
    vocation = c.vocation;
  const networking =
    vocation === "networking" ||
    /network|system.*admin|infrastructure|telecom|cybersecurity|information security|computer support|it support/.test(
      role,
    );
  const analysis =
    vocation === "analysis" ||
    vocation === "business-analysis" ||
    /analyst|data scientist|statistician|business intelligence/.test(role);
  for (const o of list)
    if (o.scope === "class" && o.cadence === "daily") {
      o.title = o.id.endsWith("technique-daily")
        ? `${CLASSES.find((p) => p.id === c.activeClass)!.name} technique check`
        : `${CLASSES.find((p) => p.id === c.activeClass)!.name} commission`;
      o.description = classPractice(
        CLASSES.find((p) => p.id === c.activeClass)!,
        c,
        o.id.endsWith("technique-daily"),
      );
      o.kind = undefined;
      if (
        c.trainingPlan &&
        o.stat === "STR" &&
        !o.id.endsWith("technique-daily")
      ) {
        o.rank = c.trainingPlan.rank;
        o.workout = personalizedWorkout(
          c,
          c.trainingPlan.rank,
          nextStrengthSession(c),
          c.trainingPlan.environment,
        );
        o.description =
          workoutSummary(o.workout) +
          ` Complete the class focus: ${CLASSES.find((p) => p.id === c.activeClass)!.goal}`;
        o.minutes = `${o.workout.minutes} min`;
        o.equipment =
          c.trainingPlan.environment === "home" ? "bodyweight" : "weights";
        o.cooldownHours = 48;
        // Easy technique review is separate practice, not a hard strength session.
        o.family = `class-${c.activeClass}-strength`;
        const secondary = classSecondaryPractice(
          CLASSES.find((p) => p.id === c.activeClass)!,
        );
        if (secondary) o.checklist = [secondary];
      }
    }
  if (c.trainingPlan)
    for (const o of list.filter(
      (o) => o.scope === "class" && o.stat === "STR" && o.cadence !== "daily",
    )) {
      o.rank = c.trainingPlan.rank;
      o.minimumSessions = o.cadence === "weekly" ? 2 : 8;
      o.minimumDays = o.cadence === "weekly" ? 3 : 28;
      o.description = `${o.cadence === "weekly" ? "Complete two" : "Complete eight"} full-body class sessions on separate days with recovery between them. Record exercises, reps and loads, and review progress on the same variations. Complete your class’s secondary focus as part of each session.`;
    }
  const filtered = list.filter(
    (o) =>
      (o.scope === "class" || !o.id.startsWith("network-") || networking) &&
      (!o.id.startsWith("analysis-") || analysis),
  );
  for (const o of filtered)
    if (
      o.scope === "profession" &&
      o.id !== "profession-daily" &&
      o.cadence === "daily" &&
      !o.id.startsWith("network-") &&
      !o.id.startsWith("analysis-")
    )
      o.description = `Work independently on ${o.category} using a written case, simulation, or practical exercise. Check the result against a source or marking guide and record one correction.`;
  const application = filtered.find((o) => o.id === "profession-daily");
  if (application && c.profession === "Analyst")
    application.description =
      "Independently tailor and submit one relevant job application, or improve a portfolio work sample against a target role's requirements.";
  const monthly = filtered.find((o) => o.id === "profession-monthly");
  if (monthly) monthly.careerCategory = careerCategory(c.profession).id;
  return [
    ...universalTasks(),
    ...regimenRequests(c),
    ...regimenGoals(),
    ...filtered.flatMap((o) =>
      o.cadence === "daily" &&
      !o.workout &&
      (o.scope === "profession" || ["INT", "WIS", "CHA"].includes(o.stat)) &&
      !o.id.endsWith("technique-daily")
        ? (["F", "E", "D", "C"] as const).map((rank) => ({
            ...o,
            id:
              rank === "D" ? o.id : `${o.id}-proficiency-${rank.toLowerCase()}`,
            rank,
            requestGroup: o.id,
            groupTitle: o.title,
            minutes: {
              F: "5–10 min",
              E: "15 min",
              D: "25 min",
              C: "35–45 min",
            }[rank],
            ...requestReward(rank, "daily"),
          }))
        : [o],
    ),
  ].map((o) => balanceRequest(c, o));
}
export function entryTrial(_c: Character, id: string): Objective | undefined {
  const p = CLASSES.find((p) => p.id === id);
  if (!p) return;
  const high = p.tier === "Prestige" || p.tier === "Ascendant",
    rank: TaskRank = high ? "B" : "D";
  const physical = ["STR", "DEX", "CON"].includes(p.stat);
  return {
    id: `trial-${id}-entry`,
    title: `${p.name} entry trial`,
    description: `Complete a ${high ? "three-session" : "focused"} ${p.name.toLowerCase()} commission. ${p.goal}`,
    cadence: high ? "weekly" : "daily",
    stat: p.stat,
    ...requestReward(rank, high ? "weekly" : "daily"),
    minutes: high ? "3 sessions" : "25–40 min",
    scope: "class",
    category: "Class trials",
    rank,
    taskVersion: 2,
    participants: "solo",
    kind: "class-trial",
    once: true,
    targetClass: id,
    family: `trial-${id}`,
    checklist: physical
      ? [
          "Complete suitable training with controlled technique",
          "Demonstrate the class’s secondary focus, if it has one",
          "Review the result and choose a specific next progression",
        ]
      : [
          "Complete focused practice using the class’s real-world goal",
          "Demonstrate recall, application, or feedback without copying a solution",
          "Review the result and choose a specific next progression",
        ],
  };
}
export function taskRequirements(
  c: Character,
  o: Objective,
  now = new Date(),
  phase: "accept" | "complete" = "complete",
): string[] {
  const missing: string[] = [];
  const prefs = c.preferences;
  const otherStrength =
    o.workout || hardStrength(o)
      ? c.completions
          .filter(
            (x) =>
              hardStrength(x) &&
              (o.workout || (x.workout && hardStrength(o))) &&
              new Date(x.at) <= now,
          )
          .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0]
      : undefined;
  if (otherStrength) {
    const hours = (now.getTime() - Date.parse(otherStrength.at)) / 3600000;
    if (hours < 48)
      missing.push(
        `${Math.ceil(48 - hours)} hours until another full-body or overlapping strength request`,
      );
  }
  if (
    o.equipment &&
    o.equipment !== "bodyweight" &&
    !hasEquipment(prefs?.equipment, o.equipment)
  )
    missing.push(
      `Equipment: ${o.equipment === "pullup-bar" ? "pull-up bar" : "weights"}`,
    );
  if (
    o.minimumPullups &&
    (c.baseline.assessment?.pullups ?? 0) < o.minimumPullups
  )
    missing.push(
      `Recent strict pull-up assessment: ${o.minimumPullups}+ repetitions`,
    );
  const previous = c.completions
    .filter((x) => x.family && x.family === o.family)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0];
  if (previous && !(o.calendarBound && o.minimumSessions)) {
    const elapsed = (now.getTime() - new Date(previous.at).getTime()) / 3600000;
    if (
      previous.cadence === "daily" &&
      new Date(previous.at).toDateString() === now.toDateString()
    )
      missing.push(
        "A request from this training group is already completed today",
      );
    if (o.cadence === "weekly" && previous.cadence === "weekly") {
      if (monday(new Date(previous.at)) === monday(now))
        missing.push(
          "A quest from this training group is already completed this week",
        );
    }
    const rest = Math.max(o.cooldownHours || 0, previous.cooldownHours || 0);
    if (elapsed < rest)
      missing.push(
        `${Math.ceil(rest - elapsed)} hours until this training group is available`,
      );
  }
  const taken = c.takenRequests?.find((r) => r.id === o.id);
  if (phase === "accept" && (o.persistent || o.once || o.practice)) {
    const conflicting = c.takenRequests?.find(
      (r) =>
        r.id !== o.id &&
        r.family === o.family &&
        (r.persistent ||
          r.once ||
          (r.cadence === "weekly" &&
            monday(new Date(r.takenAt)) === monday(now))) &&
        !c.completions.some((x) => x.id === r.id && x.period === r.takenPeriod),
    );
    if (conflicting)
      missing.push(
        `A request from this training group is already taken: ${conflicting.title}`,
      );
  }
  if (phase === "complete" && (o.minimumDays || o.minimumSessions)) {
    if (!taken)
      missing.push("Take this request to start its dated preparation");
    else {
      const progress = requestProgress(c, o, now);
      if (o.minimumSessions && progress.sessions < o.minimumSessions)
        missing.push(
          `Dated practice days: ${progress.sessions}/${o.minimumSessions}`,
        );
      if (o.minimumDays && progress.days < o.minimumDays)
        missing.push(
          `${o.minimumDays}-day commitment: ${progress.days}/${o.minimumDays} days`,
        );
    }
  }
  if (
    phase === "complete" &&
    o.adventureRequirement &&
    !adventureConditionMet(c, o.adventureRequirement, o.cadence, now)
  )
    missing.push("Complete the linked adventure guild request this period");
  if (phase === "complete" && (o.preparationDays || o.preparationSessions)) {
    const practice = c.completions.filter(
      (x) =>
        x.cadence === "daily" && x.stat === o.stat && new Date(x.at) <= now,
    );
    const dates = new Set(practice.map((x) => new Date(x.at).toDateString()))
      .size;
    const first = practice
      .map((x) => new Date(x.at).getTime())
      .sort((a, b) => a - b)[0];
    const elapsed =
      first === undefined ? 0 : Math.floor((now.getTime() - first) / 86400000);
    if (o.preparationDays && elapsed < o.preparationDays)
      missing.push(`Prior preparation: ${elapsed}/${o.preparationDays} days`);
    if (o.preparationSessions && dates < o.preparationSessions)
      missing.push(`Prior practice: ${dates}/${o.preparationSessions} dates`);
  }
  return missing;
}
export const rankIndex = (rank: TaskRank = "D") => TASK_RANKS.indexOf(rank);

export function requestProgress(c: Character, o: Objective, now = new Date()) {
  const taken = c.takenRequests?.find((r) => r.id === o.id);
  if (!taken) return { days: 0, sessions: 0, startedAt: undefined };
  const start = o.calendarBound
    ? periodStart(o.cadence, now)
    : new Date(taken.takenAt);
  const localDay = (d: Date) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.max(
    0,
    Math.floor((localDay(now) - localDay(start)) / 86400000),
  );
  const sessions = new Set(
    c.completions
      .filter((x) => {
        if (
          x.cadence !== "daily" ||
          new Date(x.at) < start ||
          new Date(x.at) > now
        )
          return false;
        if (o.practice?.workoutOnly && !x.workout) return false;
        if (
          o.practice?.minimumRank &&
          TASK_RANKS.indexOf(x.rank || "F") <
            TASK_RANKS.indexOf(o.practice.minimumRank)
        )
          return false;
        if (o.practice?.family)
          return (
            x.family === o.practice.family ||
            (["u-push", "u-resistance"].includes(o.practice.family) &&
              !!x.workout)
          );
        if (o.practice?.classId)
          return x.scope === "class" && x.classId === o.practice.classId;
        if (o.practice?.careerCategory)
          return (
            x.scope === "profession" &&
            x.careerCategory === o.practice.careerCategory
          );
        return x.stat === o.stat;
      })
      .map((x) => new Date(x.at).toDateString()),
  ).size;
  return {
    days,
    sessions,
    startedAt: o.calendarBound ? start.toISOString() : taken.takenAt,
  };
}

function monday(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return copy.getTime();
}
