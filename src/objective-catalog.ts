import type { Character, Objective, Attribute, Cadence } from "./domain";
import type { TaskRank } from "./task-ranks";
import { TASK_RANKS } from "./task-ranks";
import { requestReward } from "./request-balance";
import { careerCategory, VOCATIONS } from "./careers";

type Series = [
  string,
  string,
  Attribute,
  string,
  [string, string, string, string],
  "weights"?,
];
const DAILY: Series[] = [
  [
    "core",
    "Core control",
    "STR",
    "core",
    [
      "Practice five slow dead bugs per side with a stable trunk.",
      "Complete two sets of six controlled dead bugs per side.",
      "Complete three sets of eight dead bugs per side, keeping the trunk stable.",
      "Complete three controlled rounds of dead bugs, side planks, and bird dogs. Keep each position controlled and rest between rounds.",
    ],
  ],
  [
    "hinge",
    "Hip hinge practice",
    "STR",
    "hinge",
    [
      "Practice five unloaded hip hinges against a wall.",
      "Complete two sets of eight unloaded hinges and review alignment.",
      "Complete three sets of ten glute bridges and controlled hip hinges.",
      "Complete a planned posterior-chain session with bridges, single-leg variations suited to your capacity, and controlled hinges.",
    ],
  ],
  [
    "carry",
    "Loaded carries",
    "STR",
    "carry",
    [
      "Practice a short light two-handed carry on a clear flat path.",
      "Complete three short light carries with rest and an upright posture.",
      "Complete four 30-second carries at a familiar manageable load.",
      "Complete a planned loaded-carry session with four controlled rounds and adequate rest; record load and distance.",
    ],
    "weights",
  ],
  [
    "footwork",
    "Footwork drills",
    "DEX",
    "footwork",
    [
      "Practice slow side steps over a floor line for five minutes.",
      "Practice forward, backward, and lateral steps for ten minutes near stable support.",
      "Practice three controlled footwork patterns for fifteen minutes and review accuracy.",
      "Complete twenty-five minutes of footwork practice, combining patterns while preserving accurate placement.",
    ],
  ],
  [
    "hands",
    "Hand coordination",
    "DEX",
    "hands",
    [
      "Alternate accurate fingertip touches between two targets for five minutes.",
      "Practice three simple hand-coordination patterns for ten minutes.",
      "Practice a new two-hand pattern for fifteen minutes; count accurate sequences.",
      "Practice a complex hand-coordination sequence for twenty-five minutes, recording errors and correcting the weakest transition.",
    ],
  ],
  [
    "joint-control",
    "Joint control",
    "DEX",
    "joint-control",
    [
      "Perform five minutes of gentle controlled ankle and shoulder circles.",
      "Practice a ten-minute comfortable hip, ankle, and shoulder routine.",
      "Complete a twenty-minute controlled mobility sequence and record one movement that improved.",
      "Complete a thirty-minute mobility and control sequence, using video to check alignment and consistency.",
    ],
  ],
  [
    "cycling",
    "Cycling session",
    "CON",
    "cycling",
    [
      "Cycle comfortably for five minutes on a familiar safe route or stationary bicycle.",
      "Cycle comfortably for fifteen minutes.",
      "Complete thirty minutes of cycling at a sustainable conversational pace.",
      "Complete forty-five minutes of planned cycling with a warm-up and cool-down.",
    ],
  ],
  [
    "stairs",
    "Stair walking",
    "CON",
    "stairs",
    [
      "Walk one familiar flight of stairs at a comfortable pace using the handrail if needed.",
      "Practice five minutes of easy stair walking with rest.",
      "Complete ten minutes of controlled stair walking with recovery breaks.",
      "Complete a planned twenty-minute stair session at a sustainable pace with adequate breaks.",
    ],
  ],
  [
    "retrieval",
    "Retrieval practice",
    "INT",
    "retrieval",
    [
      "Recall five facts before checking the source.",
      "Complete ten minutes of closed-book retrieval and correct errors.",
      "Complete twenty minutes of spaced retrieval on older material and schedule a review.",
      "Complete forty minutes of retrieval and unfamiliar application, then explain and correct every error.",
    ],
  ],
  [
    "writing",
    "Explanatory writing",
    "INT",
    "writing",
    [
      "Write a five-point outline answering one concrete question.",
      "Write a clear paragraph from memory, then verify its claims.",
      "Write a structured explanation using two reliable sources and check its reasoning.",
      "Write a sourced decision brief comparing alternatives, limitations, and a justified conclusion.",
    ],
  ],
  [
    "language",
    "Language study",
    "INT",
    "language",
    [
      "Recall five words without looking at the answers.",
      "Practice ten minutes of vocabulary retrieval and pronunciation.",
      "Complete twenty minutes of listening, retrieval, and original sentences.",
      "Complete forty minutes of language practice, including an unfamiliar passage and a recorded explanation.",
    ],
  ],
  [
    "context",
    "Scripture context",
    "WIS",
    "context",
    [
      "Read the paragraphs surrounding a selected Bible passage.",
      "Identify the speaker, audience, and main point of a Bible passage.",
      "Outline a passage in its literary and historical context; distinguish interpretation from personal application.",
      "Compare a passage with related Scripture, check contextual claims, and write a supported explanation and personal application.",
    ],
  ],
  [
    "reflection",
    "Decision review",
    "WIS",
    "reflection",
    [
      "Record one decision and the reason you made it.",
      "Separate observations, assumptions, and uncertainties in one decision.",
      "Review a decision against its evidence, consequences, and Christian convictions; choose one correction.",
      "Review a difficult decision using Scripture in context, reliable evidence, alternative explanations, and a specific follow-up check.",
    ],
  ],
  [
    "speech",
    "Speaking rehearsal",
    "CHA",
    "speech",
    [
      "Record a clear sixty-second introduction.",
      "Record a three-minute explanation with a beginning, middle, and conclusion.",
      "Rehearse a five-minute explanation, review clarity and pace, and record an improved version.",
      "Record a ten-minute presentation, critique its structure and delivery, and repeat its weakest section.",
    ],
  ],
  [
    "listening-lab",
    "Listening analysis",
    "CHA",
    "listening-lab",
    [
      "Listen to a short public recording and name its main point.",
      "Summarize a recorded conversation without reading its transcript first.",
      "Compare your summary with the transcript; correct missed intentions and unsupported assumptions.",
      "Analyze two recorded explanations of a disagreement, summarize both positions fairly, and identify a useful clarifying question.",
    ],
  ],
  [
    "message-craft",
    "Message writing",
    "CHA",
    "message-craft",
    [
      "Draft a thoughtful message with a clear purpose.",
      "Revise a message so its request, tone, and next step are clear.",
      "Write a difficult-message draft that separates the issue, impact, request, and opportunity to respond.",
      "Write and compare three approaches to a difficult conversation; rehearse a respectful response to likely objections.",
    ],
  ],
];
const groups: Record<string, [string, string[]]> = {
  walk: ["Walking", ["u-walk-5", "u-walk-15", "u-walk-brisk"]],
  push: [
    "Pushup practice",
    ["u-wall-push", "u-incline-push", "u-floor-push-8", "u-floor-push-20"],
  ],
  squat: [
    "Squat practice",
    ["u-chair-squat", "u-bodyweight-squat", "u-split-squat"],
  ],
  running: ["Running", ["u-run-walk", "u-run-5k"]],
  pull: ["Pullup progression", ["u-pullup-8", "u-pullup-12"]],
  bible: [
    "Bible study",
    [
      "u-bible-short",
      "u-bible-recall",
      "u-bible-application",
      "u-chapter-study",
    ],
  ],
};
export function decorateRequest(o: Objective): Objective {
  let group = o.requestGroup,
    title = o.groupTitle;
  for (const [key, [name, ids]] of Object.entries(groups))
    if (ids.includes(o.id)) {
      group = key;
      title = name;
    }
  const habit = o.id.match(/^habit-(.+)-(weekly|monthly)-[fed]$/);
  if (habit) {
    group = `habit-${habit[1]}`;
    title = `${({ walk: "Walking", reading: "Reading", mobility: "Mobility", strength: "Strength", scripture: "Scripture", communication: "Communication" } as Record<string, string>)[habit[1]] || habit[1]} ${o.cadence === "weekly" ? "week" : "month"}`;
  }
  const owner =
    o.scope === "class" || o.scope === "profession" ? `:${o.category}` : "";
  const key = group?.startsWith(`${o.cadence}|`)
    ? group
    : `${o.cadence}|${o.scope || "class"}${owner}|${group || o.id}`;
  return {
    ...o,
    requestGroup: key,
    groupTitle: title || o.title,
    tags: [
      ...new Set([
        ...(o.tags || []),
        o.stat,
        o.category,
        o.scope || "class",
        ...(o.adventureRequirement || o.adventureBonus ? ["Hybrid"] : []),
      ]),
    ],
  };
}
export interface RequestGroup {
  id: string;
  title: string;
  variants: Objective[];
}
export function groupRequests(list: Objective[]): RequestGroup[] {
  const result = new Map<string, RequestGroup>();
  for (const o of list) {
    const key = o.requestGroup || o.id;
    const g = result.get(key) || {
      id: key,
      title: o.groupTitle || o.title,
      variants: [],
    };
    if (!g.variants.some((v) => v.id === o.id)) g.variants.push(o);
    result.set(key, g);
  }
  return [...result.values()].map((g) => ({
    ...g,
    variants: g.variants.sort(
      (a, b) =>
        TASK_RANKS.indexOf(a.rank || "D") - TASK_RANKS.indexOf(b.rank || "D"),
    ),
  }));
}
const extraCache = new Map<string, Objective[]>();
export function extraObjectives(c: Character): Objective[] {
  const cacheKey = `${c.profession}|${c.vocation || ""}`;
  const cached = extraCache.get(cacheKey);
  if (cached) return cached;
  const result: Objective[] = [];
  const add = (
    id: string,
    title: string,
    stat: Attribute,
    rank: TaskRank,
    cadence: Cadence,
    description: string,
    extra: Partial<Objective> = {},
  ) =>
    result.push({
      id,
      title,
      description,
      stat,
      rank,
      cadence,
      scope: "universal",
      category: "Universal",
      minutes:
        cadence === "daily"
          ? {
              F: "5 min",
              E: "10–15 min",
              D: "20–30 min",
              C: "30–45 min",
              B: "Project",
              A: "Project",
              S: "Project",
              SS: "Project",
              SSS: "Project",
            }[rank]
          : cadence === "weekly"
            ? "This week"
            : "This month",
      taskVersion: 2,
      participants: "solo",
      ...requestReward(rank, cadence),
      ...extra,
    });
  for (const [key, title, stat, family, descriptions, equipment] of DAILY)
    (["F", "E", "D", "C"] as const).forEach((rank, i) =>
      add(
        `practice-${key}-${rank.toLowerCase()}`,
        title,
        stat,
        rank,
        "daily",
        descriptions[i],
        {
          requestGroup: `practice-${key}`,
          groupTitle: title,
          family: `extra-${family}`,
          equipment: equipment || "bodyweight",
          cooldownHours: stat === "STR" ? 48 : undefined,
          tags: [
            stat === "STR"
              ? "Strength"
              : stat === "INT"
                ? "Learning"
                : stat === "WIS"
                  ? "Faith"
                  : "Practice",
          ],
        },
      ),
    );
  add(
    "daily-sleep-log",
    "Sleep routine log",
    "CON",
    "F",
    "daily",
    "Record sleep and wake times and one change that would make tonight’s routine more consistent.",
    { family: "u-sleep", tags: ["Recovery", "Sleep"] },
  );
  add(
    "daily-prayer",
    "Prayer",
    "WIS",
    "F",
    "daily",
    "Set aside five focused minutes for Christian prayer. Record one concern and one practical response.",
    { family: "u-prayer", tags: ["Faith", "Prayer"] },
  );
  add(
    "daily-meal-plan",
    "Plan a balanced meal",
    "CON",
    "E",
    "daily",
    "Plan or prepare a meal with a protein source, vegetables or fruit, and a suitable carbohydrate source. Record one practical improvement.",
    { family: "u-meals", tags: ["Nutrition"] },
  );
  const projects: [string, string, Attribute, string, string][] = [
    [
      "sleep",
      "Sleep routine",
      "CON",
      "u-sleep",
      "Review your logged sleep and wake times, follow a consistent wind-down routine, and compare what helped.",
    ],
    [
      "writing",
      "Writing portfolio",
      "INT",
      "extra-writing",
      "Produce a small collection of original explanations, revise them against sources, and keep the final versions.",
    ],
    [
      "speech",
      "Presentation workshop",
      "CHA",
      "extra-speech",
      "Prepare, record, critique, and revise a presentation; keep the original and improved recordings.",
    ],
    [
      "prayer",
      "Prayer and application",
      "WIS",
      "u-prayer",
      "Follow a regular Christian prayer routine and carry out a specific, appropriate personal application.",
    ],
    [
      "coordination",
      "Coordination study",
      "DEX",
      "extra-hands",
      "Practice a new coordination pattern and compare repeatable accuracy checks.",
    ],
    [
      "core",
      "Core training plan",
      "STR",
      "extra-core",
      "Follow a suitable core-control plan with recovery, a consistent technique standard, and recorded practice.",
    ],
  ];
  for (const [key, title, stat, family, goal] of projects)
    for (const cadence of ["weekly", "monthly"] as const)
      for (const [rank, count] of (cadence === "weekly"
        ? [
            ["F", 3],
            ["D", 4],
            ["C", 5],
          ]
        : [
            ["F", 8],
            ["D", 12],
            ["B", 16],
          ]) as [TaskRank, number][]) {
        const sessions =
          stat === "STR"
            ? Math.min(count, cadence === "weekly" ? 3 : 12)
            : count;
        add(
          `project-${key}-${cadence}-${rank.toLowerCase()}`,
          title,
          stat,
          rank,
          cadence,
          goal,
          {
            requestGroup: `project-${key}`,
            groupTitle: title,
            family: `project-${key}-${cadence}`,
            minimumSessions: sessions,
            minimumDays: cadence === "weekly" ? 2 : 7,
            practice: { family },
            checklist: [
              "Complete the recorded practice",
              "Compare the starting and final work",
              "Choose a useful next step",
            ],
            tags: ["Plan", title],
          },
        );
      }
  const category = careerCategory(c.profession),
    vocation = VOCATIONS.find((v) => v.id === c.vocation);
  const categories = [
    category,
    ...(vocation && vocation.category !== category.id
      ? [careerCategoryFor(vocation.category)]
      : []),
  ];
  for (const cat of categories)
    for (const index of [1, 3, 5])
      for (const rank of ["D", "C"] as const) {
        const topic = cat.nodes[index];
        add(
          `career-${cat.id}-${index}-${rank.toLowerCase()}`,
          topic,
          cat.stat,
          rank,
          "daily",
          `${cat.practice} Focus on ${topic.toLowerCase()}. ${rank === "C" ? "Build an unfamiliar example, test it, and document the errors you corrected." : "Use one small worked example, then check a fresh example without copying."}`,
          {
            scope: "profession",
            category: cat.name,
            careerCategory: cat.id,
            requestGroup: `career-${cat.id}-${index}`,
            groupTitle: topic,
            family: `career-${cat.id}-${index}`,
            tags: ["Career", cat.name, topic],
          },
        );
      }
  if (
    vocation?.id === "networking" ||
    /network|system.*admin|infrastructure|telecom|cybersecurity/i.test(
      c.profession,
    )
  ) {
    const labs = [
      [
        "subnets",
        "Subnetting drills",
        "Solve unfamiliar IPv4 subnetting problems and check network, broadcast, and host ranges.",
      ],
      [
        "vlans",
        "VLAN lab",
        "Build a small VLAN topology, assign access ports, and verify trunk behavior.",
      ],
      [
        "routing",
        "Routing lab",
        "Configure routes between two small networks and verify forwarding and failure behavior.",
      ],
      [
        "packets",
        "Packet analysis",
        "Capture a familiar protocol exchange and explain its addressing, order, and one failure case.",
      ],
      [
        "acl",
        "Access-control lab",
        "Write a small access-control policy, test allowed and denied flows, and correct any mismatch.",
      ],
      [
        "troubleshoot",
        "Network fault isolation",
        "Introduce one lab fault, collect evidence, isolate its cause, and verify the repair.",
      ],
    ];
    for (const [key, title, goal] of labs)
      for (const rank of ["D", "C"] as const)
        add(
          `network-lab-${key}-${rank.toLowerCase()}`,
          title,
          "INT",
          rank,
          "daily",
          `${goal} ${rank === "C" ? "Repeat with an unfamiliar topology and save a verification checklist." : "Save the configuration and a short explanation."}`,
          {
            scope: "profession",
            category: "Networking",
            careerCategory: "technology",
            requestGroup: `network-lab-${key}`,
            family: `network-lab-${key}`,
            tags: ["CCNA", "Networking", "Lab"],
          },
        );
  }
  const hybrids: [
    string,
    string,
    Attribute,
    Cadence,
    string,
    string,
    boolean,
  ][] = [
    [
      "chapel",
      "Chapel supplies",
      "WIS",
      "weekly",
      "Complete three contextual Bible-study sessions and deliver medicinal herbs to Alderhaven.",
      "alderhaven-herbs",
      true,
    ],
    [
      "trail",
      "Trail conditioning",
      "CON",
      "weekly",
      "Complete three walking sessions. The Mossfall patrol request pays an additional reward.",
      "alderhaven-hunt",
      false,
    ],
    [
      "forge",
      "Forge discipline",
      "STR",
      "weekly",
      "Complete three suitable strength sessions and deliver ore to Brassford.",
      "brassford-ore",
      true,
    ],
    [
      "research",
      "Field research notes",
      "INT",
      "weekly",
      "Complete three retrieval or applied-study sessions. Supplying Embermere’s scholars pays a bonus.",
      "embermere-relics",
      false,
    ],
    [
      "rescue",
      "Supply coordination",
      "CHA",
      "monthly",
      "Complete twelve communication practices and help provision Tidecross.",
      "tidecross-supplies",
      true,
    ],
    [
      "chapel-month",
      "Chapel study plan",
      "WIS",
      "monthly",
      "Complete twelve contextual Scripture study dates. Supplying the chapel clinic pays a bonus.",
      "alderhaven-herbs",
      false,
    ],
    [
      "frost",
      "Frostmarch preparation",
      "CON",
      "monthly",
      "Complete twelve conditioning dates and deliver Frostholm’s medicinal supplies.",
      "frostholm-herbs",
      true,
    ],
    [
      "craft",
      "Craft and study",
      "INT",
      "monthly",
      "Complete twelve study dates. Brassford’s ore commission pays an additional reward.",
      "brassford-ore",
      false,
    ],
  ];
  for (const [key, title, stat, cadence, goal, contract, required] of hybrids)
    add(
      `hybrid-${key}`,
      title,
      stat,
      cadence === "weekly" ? "C" : "B",
      cadence,
      goal,
      {
        family: `hybrid-${key}`,
        minimumDays: cadence === "weekly" ? 2 : 12,
        minimumSessions: cadence === "weekly" ? 3 : 12,
        checklist: [
          "Complete the real-world practice",
          "Review and record the outcome",
        ],
        tags: ["Hybrid"],
        ...(required
          ? { adventureRequirement: contract }
          : {
              adventureBonus: {
                contractId: contract,
                xp: cadence === "weekly" ? 150 : 900,
                gold: cadence === "weekly" ? 30 : 180,
              },
            }),
      },
    );
  extraCache.set(cacheKey, result);
  return result;
}
import { CAREER_CATEGORIES } from "./careers";
function careerCategoryFor(id: string) {
  return CAREER_CATEGORIES.find((c) => c.id === id)!;
}
