import { SKILLS } from "./skill-catalog";
import type { Skill } from "./skill-catalog";
import { professionGroup } from "./professions";
export const ATTRIBUTES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;
export type Attribute = (typeof ATTRIBUTES)[number];
export type Stats = Record<Attribute, number>;
export type Cadence = "daily" | "weekly" | "monthly";
export interface Baseline {
  mode: "bodyweight" | "weights";
  pushupStyle?: "floor" | "knee" | "incline" | "wall";
  pushups: number;
  squats: number;
  balance: number;
  walk: number;
  reading: number;
  reflection: number;
  connection: number;
  load: number;
  reps: number;
  bodyweight: number;
}
export const EMPTY_BASELINE: Baseline = {
  mode: "bodyweight",
  pushups: 0,
  squats: 0,
  balance: 0,
  walk: 0,
  reading: 0,
  reflection: 0,
  connection: 0,
  load: 0,
  reps: 0,
  bodyweight: 0,
};
export interface ClassPath {
  id: string;
  name: string;
  motto: string;
  description: string;
  stat: Attribute;
  icon: string;
  color: string;
  requirements: Partial<Stats>;
  minXP?: number;
  classRequirements?: { id: string; level: number }[];
  subclasses: {
    id: string;
    name: string;
    description: string;
    stat: Attribute;
    minClassLevel?: number;
    requirements?: Partial<Stats>;
    requiredSkills?: string[];
  }[];
}
export const CLASSES: ClassPath[] = [
  {
    id: "warrior",
    name: "Warrior",
    motto: "Strength through consistency.",
    description:
      "Build practical strength, move with intention, and become someone you can count on.",
    stat: "STR",
    icon: "sword",
    color: "rust",
    requirements: { STR: 5 },
    subclasses: [
      {
        id: "eldritch-knight",
        name: "Eldritch Knight",
        description: "Pair strength with focused study and information recall.",
        stat: "INT",
      },
      {
        id: "warpriest",
        name: "Warpriest",
        description:
          "Train your body. Study Scripture. Put faith into practice.",
        stat: "WIS",
      },
      {
        id: "guardian",
        name: "Guardian",
        description: "Build endurance and serve the people around you.",
        stat: "CON",
      },
    ],
  },
  {
    id: "ranger",
    name: "Ranger",
    motto: "Find your own trail.",
    description:
      "Develop coordination, mobility, and an enduring connection to the outdoors.",
    stat: "DEX",
    icon: "compass",
    color: "green",
    requirements: { DEX: 5 },
    subclasses: [
      {
        id: "trailwarden",
        name: "Trailwarden",
        description: "Go farther with stamina and outdoor exploration.",
        stat: "CON",
      },
      {
        id: "pathfinder",
        name: "Pathfinder",
        description: "Learn navigation, plan routes, and solve problems.",
        stat: "INT",
      },
    ],
  },
  {
    id: "scholar",
    name: "Scholar",
    motto: "Curiosity is a calling.",
    description:
      "Read deeply, reason clearly, and turn new knowledge into useful skills.",
    stat: "INT",
    icon: "book",
    color: "blue",
    requirements: { INT: 5 },
    subclasses: [
      {
        id: "scribe",
        name: "Scripture Scribe",
        description:
          "Read the Bible with context, reflection, and application.",
        stat: "WIS",
      },
      {
        id: "tactician",
        name: "Tactician",
        description: "Practice communication and teach what you learn.",
        stat: "CHA",
      },
    ],
  },
  {
    id: "bard",
    name: "Bard",
    motto: "Leave people a little brighter.",
    description:
      "Strengthen relationships, communicate with courage, and create something meaningful.",
    stat: "CHA",
    icon: "music",
    color: "purple",
    requirements: { CHA: 5 },
    subclasses: [
      {
        id: "herald",
        name: "Herald",
        description: "Build public speaking and persuasive writing skills.",
        stat: "INT",
      },
      {
        id: "encourager",
        name: "Encourager",
        description:
          "Listen well, pray for others, and offer practical encouragement.",
        stat: "WIS",
      },
    ],
  },
  {
    id: "disciple",
    name: "Disciple",
    motto: "Faithful in the little things.",
    description:
      "Grow in Christian faith through Scripture, prayer, reflection, and service.",
    stat: "WIS",
    icon: "cross",
    color: "gold",
    requirements: {},
    subclasses: [
      {
        id: "servant",
        name: "Servant",
        description: "Express faith through acts of care and community.",
        stat: "CHA",
      },
      {
        id: "apologist",
        name: "Apologist",
        description:
          "Study Christian theology and explain your faith thoughtfully.",
        stat: "INT",
      },
    ],
  },
  {
    id: "sentinel",
    name: "Sentinel",
    motto: "A steady heart. A stronger foundation.",
    description:
      "Build sustainable health through movement, rest, and everyday resilience.",
    stat: "CON",
    icon: "shield",
    color: "teal",
    requirements: { CON: 5 },
    subclasses: [
      {
        id: "ironheart",
        name: "Ironheart",
        description: "Build strength alongside your endurance practice.",
        stat: "STR",
      },
      {
        id: "wayfarer",
        name: "Wayfarer",
        description: "Improve balance, mobility, and time outside.",
        stat: "DEX",
      },
    ],
  },
  {
    id: "paladin",
    name: "Paladin",
    motto: "Strength in service of something greater.",
    description:
      "An advanced path that brings physical discipline and Christian service together.",
    stat: "STR",
    icon: "shield",
    color: "gold",
    requirements: { STR: 7, WIS: 7 },
    minXP: 500,
    subclasses: [
      {
        id: "oathkeeper",
        name: "Oathkeeper",
        description: "Lead with integrity, Scripture, and consistent action.",
        stat: "WIS",
      },
    ],
  },
  {
    id: "sage",
    name: "Sage",
    motto: "Knowledge, made wise.",
    description:
      "An advanced path for deep study, thoughtful reflection, and teaching others.",
    stat: "INT",
    icon: "sparkles",
    color: "blue",
    requirements: { INT: 8, WIS: 7 },
    minXP: 1000,
    subclasses: [
      {
        id: "mentor",
        name: "Mentor",
        description: "Share what you know through patient, practical teaching.",
        stat: "CHA",
      },
    ],
  },
];
CLASSES.push(
  {
    id: "monk",
    name: "Monk",
    motto: "Bodyweight training and coordination",
    description:
      "Train movement control, coordination, and bodyweight strength. This is a physical training class.",
    stat: "DEX",
    icon: "DEX",
    color: "green",
    requirements: { DEX: 7, CON: 6 },
    subclasses: [
      {
        id: "pugilist",
        name: "Pugilist",
        description: "Add strength and controlled striking drills.",
        stat: "STR",
        minClassLevel: 3,
        requirements: { STR: 10 },
      },
      {
        id: "athlete",
        name: "Athlete",
        description: "Develop conditioning and recovery routines.",
        stat: "CON",
        minClassLevel: 3,
        requirements: { CON: 10 },
      },
    ],
  },
  {
    id: "rogue",
    name: "Rogue",
    motto: "Precision, planning, and agility",
    description:
      "Develop coordination, situational awareness, and problem-solving.",
    stat: "DEX",
    icon: "compass",
    color: "purple",
    requirements: { DEX: 8, INT: 6 },
    subclasses: [
      {
        id: "scout",
        name: "Scout",
        description: "Practice observation, navigation, and planning.",
        stat: "INT",
        minClassLevel: 3,
        requirements: { INT: 10 },
      },
      {
        id: "duelist",
        name: "Duelist",
        description: "Combine precise movement with strength practice.",
        stat: "STR",
        minClassLevel: 4,
        requirements: { STR: 12 },
      },
    ],
  },
  {
    id: "artificer",
    name: "Artificer",
    motto: "Technical study and practical projects",
    description:
      "Build useful things through technical learning, design, and iteration.",
    stat: "INT",
    icon: "INT",
    color: "blue",
    requirements: { INT: 8 },
    subclasses: [
      {
        id: "engineer",
        name: "Engineer",
        description:
          "Practice precision design, tools, and technical validation.",
        stat: "DEX",
        minClassLevel: 3,
        requirements: { DEX: 10 },
      },
      {
        id: "runewright",
        name: "Runewright",
        description:
          "Practice careful design, documentation, and ethical decisions.",
        stat: "WIS",
        minClassLevel: 3,
        requirements: { WIS: 10 },
      },
    ],
  },
  {
    id: "marshal",
    name: "Marshal",
    motto: "Leadership and team coordination",
    description: "Develop planning, communication, and responsible leadership.",
    stat: "CHA",
    icon: "shield",
    color: "gold",
    requirements: { CHA: 8, INT: 7 },
    subclasses: [
      {
        id: "commander",
        name: "Commander",
        description: "Study planning, delegation, and decision-making.",
        stat: "INT",
        minClassLevel: 4,
        requirements: { INT: 12 },
      },
      {
        id: "chaplain",
        name: "Chaplain",
        description: "Study Christian Scripture and practice care and service.",
        stat: "WIS",
        minClassLevel: 3,
        requirements: { WIS: 10 },
      },
    ],
  },
);
CLASSES.find((p) => p.id === "paladin")!.classRequirements = [
  { id: "warrior", level: 5 },
  { id: "disciple", level: 3 },
];
CLASSES.find((p) => p.id === "sage")!.classRequirements = [
  { id: "scholar", level: 8 },
  { id: "disciple", level: 3 },
];
for (const p of CLASSES)
  p.motto =
    {
      warrior: "Strength training",
      ranger: "Mobility and outdoor activity",
      scholar: "Study and applied knowledge",
      bard: "Communication and relationships",
      disciple: "Christian Scripture, prayer, and service",
      sentinel: "Conditioning and recovery",
      paladin: "Strength training and Christian service",
      sage: "Research and teaching",
      monk: "Bodyweight control and coordination",
      rogue: "Agility and planning",
      artificer: "Technical learning and projects",
      marshal: "Leadership and coordination",
    }[p.id] || p.motto;
for (const p of CLASSES)
  for (const sub of p.subclasses) {
    sub.minClassLevel ??= sub.id === "eldritch-knight" ? 4 : 3;
    sub.requirements ??= { [sub.stat]: sub.id === "eldritch-knight" ? 12 : 10 };
  }
export function subclassRequirements(
  c: Character,
  sub: ClassPath["subclasses"][number],
): string[] {
  const p = currentPath(c),
    missing: string[] = [];
  if (classLevel(c, p.id) < (sub.minClassLevel || 3))
    missing.push(`${p.name} level ${sub.minClassLevel || 3}`);
  for (const [a, n] of Object.entries(sub.requirements || {}))
    if (stats(c)[a as Attribute] < n!) missing.push(`${a} ${n}`);
  for (const id of sub.requiredSkills || [])
    if (!c.earnedSkills.includes(id))
      missing.push(`Skill: ${SKILLS.find((s) => s.id === id)?.name || id}`);
  return missing;
}
export function selectSubclass(c: Character, id: string | null): Character {
  if (id === null) return { ...c, subclass: null };
  const sub = currentPath(c).subclasses.find((s) => s.id === id);
  if (!sub || subclassRequirements(c, sub).length) return c;
  return { ...c, subclass: id };
}
export { PROFESSIONS } from "./professions";
export interface Objective {
  id: string;
  title: string;
  description: string;
  cadence: Cadence;
  stat: Attribute;
  xp: number;
  minutes: string;
  category: string;
  kind?: "fitness";
  checklist?: string[];
  scope?: "universal" | "class" | "subclass" | "profession";
  statReward?: { stat: Attribute; amount: number };
}
const CORE: Record<string, [string, string, string, string]> = {
  warrior: [
    "Strength session",
    "Perform a controlled strength session using wall, knee, or floor pushups, squats, or your usual weighted routine. Stop before form breaks.",
    "Three strength sessions",
    "Complete three strength sessions with recovery days. Record the exercises and repetitions.",
  ],
  ranger: [
    "Walk and mobility",
    "Take a comfortable walk and practice balance or mobility for 5 minutes.",
    "Explore a route",
    "Complete three walks and explore one new safe route.",
  ],
  scholar: [
    "Focused study",
    "Study for 20 minutes, then write three points from memory.",
    "Apply a concept",
    "Complete three study sessions and apply one concept to a small project.",
  ],
  bard: [
    "Conversation practice",
    "Have a conversation in which you ask questions and summarize what the other person says.",
    "Presentation practice",
    "Prepare and deliver a short presentation. Ask for one specific piece of feedback.",
  ],
  disciple: [
    "Bible study",
    "Read a Bible passage in context. Note its meaning and one practical application.",
    "Scripture and service",
    "Study a Bible chapter and complete one practical act of service.",
  ],
  sentinel: [
    "Conditioning session",
    "Complete a comfortable walk or low-impact conditioning session. Record duration.",
    "Conditioning plan",
    "Complete three conditioning sessions and review your recovery and sleep.",
  ],
  paladin: [
    "Strength and prayer",
    "Complete an appropriate strength session and set aside 5 minutes for Christian prayer.",
    "Training and service",
    "Complete three strength sessions and help someone with a practical need.",
  ],
  sage: [
    "Research and reflection",
    "Study a topic for 25 minutes. Record evidence, questions, and an explanation in your own words.",
    "Teach a topic",
    "Research a topic, check sources, and teach the main ideas to someone.",
  ],
  monk: [
    "Movement control",
    "Practice controlled bodyweight movement and mobility for 15 minutes.",
    "Bodyweight routine",
    "Complete three technique-focused bodyweight sessions. Review form and recovery.",
  ],
  rogue: [
    "Agility and planning",
    "Practice gentle coordination drills and solve a logic or route-planning problem.",
    "Precision practice",
    "Complete three coordination sessions and document one planning exercise.",
  ],
  artificer: [
    "Technical practice",
    "Build, configure, repair, or prototype something small. Document and test the result.",
    "Build a prototype",
    "Finish a small practical project with requirements and validation notes.",
  ],
  marshal: [
    "Leadership practice",
    "Plan a shared task, clarify responsibilities, or ask a teammate for specific feedback.",
    "Coordinate a project",
    "Organize a small shared project. Record the plan, decisions, and outcome.",
  ],
};
export interface Completion {
  id: string;
  period: string;
  at: string;
  xp: number;
  stat: Attribute;
  classId: string;
  title: string;
  profession?: string;
  scope?: "universal" | "class" | "subclass" | "profession";
  subclassId?: string;
  statReward?: { stat: Attribute; amount: number };
}
export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  reference: string;
}
export interface JournalEntry {
  id: string;
  at: string;
  text: string;
}
export interface Character {
  version: 1;
  id: string;
  name: string;
  title: string;
  createdAt: string;
  baseline: Baseline;
  baseStats: Stats;
  activeClass: string;
  subclass: string | null;
  profession: string;
  completions: Completion[];
  certificates: Certificate[];
  journal: JournalEntry[];
  relics: string[];
  earnedSkills: string[];
  milestones: Record<string, number[]>;
  startingRank?: "F" | "E" | "D";
  learnedSkills?: string[];
  skillPurchases?: { id: string; wallet: string; cost: number }[];
  campaign?: import("./rpg").Campaign;
  demo: boolean;
}
const clamp = (n: number, max: number) =>
  Math.max(0, Math.min(max, Number.isFinite(n) ? n : 0));
// Guild scoring benchmarks, not population percentiles or clinical measurements.
export function startingStats(b: Baseline): Stats {
  const str =
    b.mode === "weights"
      ? (b.bodyweight > 0
          ? clamp(b.load, 500) / Math.max(30, b.bodyweight)
          : 0) *
        (1 + clamp(b.reps, 30) / 30) *
        9
      : clamp(b.pushups, 120) *
        0.4 *
        { floor: 1, knee: 0.65, incline: 0.45, wall: 0.25 }[
          b.pushupStyle || "floor"
        ];
  return {
    STR: Math.round(3 + Math.min(27, str)),
    DEX: Math.round(3 + Math.min(27, clamp(b.balance, 180) * 0.15)),
    CON: Math.round(
      3 + Math.min(27, clamp(b.walk, 180) * 0.1 + clamp(b.squats, 120) * 0.12),
    ),
    INT: Math.round(3 + Math.min(27, clamp(b.reading, 1200) * 0.025)),
    WIS: Math.round(3 + clamp(b.reflection, 7) * 3),
    CHA: Math.round(3 + Math.min(27, clamp(b.connection, 30) * 0.9)),
  };
}
export function startingRankFor(s: Stats): "F" | "E" | "D" {
  const values = Object.values(s),
    average = values.reduce((a, b) => a + b, 0) / 6;
  if (average >= 25 && values.filter((n) => n >= 25).length >= 5) return "D";
  if (
    average >= 18 &&
    values.filter((n) => n >= 22).length >= 3 &&
    [s.STR, s.DEX, s.CON].filter((n) => n >= 22).length >= 2
  )
    return "E";
  return "F";
}
export const totalXP = (c: Character) =>
  c.completions.reduce((s, x) => s + x.xp, 0);
export const level = (xp: number) => Math.floor(xp / 250) + 1;
export const classXP = (c: Character, id: string) =>
  c.completions
    .filter(
      (x) =>
        x.classId === id &&
        (!x.scope || x.scope === "class" || x.scope === "subclass"),
    )
    .reduce((n, x) => n + x.xp, 0);
export const classLevel = (c: Character, id: string) =>
  1 + Math.floor(classXP(c, id) / 100);
export const professionXP = (c: Character, name = c.profession) =>
  c.completions
    .filter((x) => x.scope === "profession" && x.profession === name)
    .reduce((n, x) => n + x.xp, 0);
export const professionLevel = (c: Character, name = c.profession) =>
  1 + Math.floor(professionXP(c, name) / 100);
export const subclassXP = (c: Character, id = c.subclass) =>
  c.completions
    .filter((x) => x.scope === "subclass" && x.subclassId === id)
    .reduce((n, x) => n + x.xp, 0);
export const subclassLevel = (c: Character, id = c.subclass) =>
  1 + Math.floor(subclassXP(c, id) / 100);
export function professionStat(name: string): Attribute {
  const code = professionGroup(name).code;
  return ["21", "23", "25", "41", "43"].includes(code)
    ? "CHA"
    : ["35", "39", "47", "49", "51"].includes(code)
      ? "DEX"
      : ["33", "37", "45", "53", "55"].includes(code)
        ? "CON"
        : "INT";
}
export function stats(c: Character): Stats {
  const result = { ...c.baseStats };
  for (const p of CLASSES) result[p.stat] += classLevel(c, p.id) - 1;
  const professions = [
    ...new Set(
      c.completions
        .filter((o) => o.scope === "profession")
        .map((o) => o.profession)
        .filter((x): x is string => !!x),
    ),
  ];
  for (const name of professions)
    result[professionStat(name)] += professionLevel(c, name) - 1;
  for (const o of c.completions)
    if (o.statReward) result[o.statReward.stat] += o.statReward.amount;
  return result;
}
export const classRank = (lv: number) =>
  lv >= 20
    ? "Master"
    : lv >= 10
      ? "Expert"
      : lv >= 5
        ? "Adept"
        : lv >= 3
          ? "Apprentice"
          : "Novice";
// Each promotion costs twice the previous: 500, 1,000, 2,000, ... XP.
export const RANKS = ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"].map(
  (name, i) => ({ name, xp: 500 * (2 ** i - 1) }),
);
export const rank = (xp: number) =>
  [...RANKS].reverse().find((r) => xp >= r.xp) || RANKS[0];
export const startingRankCredit = (c: Character) =>
  RANKS.find((r) => r.name === (c.startingRank || "F"))!.xp;
export const rankXP = (c: Character) => totalXP(c) + startingRankCredit(c);
export const characterRank = (c: Character) => rank(rankXP(c));
export const available = (p: ClassPath, s: Stats, xp: number, c?: Character) =>
  Object.entries(p.requirements).every(([a, n]) => s[a as Attribute] >= n!) &&
  xp >= (p.minXP || 0) &&
  (p.classRequirements || []).every(
    (r) => !!c && classLevel(c, r.id) >= r.level,
  );
export const currentPath = (c: Character) =>
  CLASSES.find((p) => p.id === c.activeClass)!;
export function objectives(c: Character): Objective[] {
  const p = currentPath(c),
    core = CORE[p.id];
  const result: Objective[] = [
    {
      id: `${p.id}-daily`,
      title: core[0],
      description: core[1],
      cadence: "daily",
      stat: p.stat,
      xp: 30,
      minutes: "15–20 min",
      category: p.name,
      kind: ["STR", "CON", "DEX"].includes(p.stat) ? "fitness" : undefined,
    },
    {
      id: "reflection-daily",
      title: "Prayer and reflection",
      description:
        "Pause, pray, and write down one thing you are grateful for and one way you can show up better today.",
      cadence: "daily",
      stat: "WIS",
      xp: 20,
      minutes: "5 min",
      category: "Heart",
    },
    {
      id: "profession-daily",
      title:
        c.profession === "Analyst"
          ? "Targeted job application"
          : "Profession practice",
      description:
        c.profession === "Analyst"
          ? "Tailor one job application, improve a portfolio insight, or reach out to a professional contact. Record what you did in your journal."
          : `Spend 20 focused minutes developing your ${c.profession.toLowerCase()} practice. Record what you learned.`,
      cadence: "daily",
      stat: "INT",
      xp: 30,
      minutes: "20 min",
      category: c.profession,
    },
    {
      id: "network-daily",
      title: "Networking study",
      description:
        "Study one CCNA topic or complete a small networking lab. Explain the result in your own words.",
      cadence: "daily",
      stat: "INT",
      xp: 25,
      minutes: "20 min",
      category: "Networking",
    },
    {
      id: `${p.id}-weekly`,
      title: core[2],
      description: core[3],
      cadence: "weekly",
      stat: p.stat,
      xp: 120,
      minutes: "This week",
      category: p.name,
    },
    {
      id: "network-weekly",
      title: "Three networking labs",
      description:
        "Complete three networking labs covering switching, routing, or subnetting. Save your notes and configurations.",
      cadence: "weekly",
      stat: "INT",
      xp: 100,
      minutes: "3 sessions",
      category: "Networking",
    },
    {
      id: `${p.id}-monthly`,
      title: "Monthly training plan",
      description: `Build a sustainable month of ${p.name.toLowerCase()} practice. Complete each milestone before claiming the adventure.`,
      cadence: "monthly",
      stat: p.stat,
      xp: 400,
      minutes: "This month",
      category: p.name,
      checklist: [
        "Complete 12 practice sessions",
        "Reflect on what improved",
        "Set a sustainable next goal",
      ],
    },
    {
      id: "service-monthly",
      title: "Community service project",
      description:
        "Turn Christian faith into practical love. Complete each milestone at your own pace this month.",
      cadence: "monthly",
      stat: "WIS",
      xp: 300,
      minutes: "This month",
      category: "Service",
      checklist: [
        "Identify a practical need",
        "Offer your time or resources",
        "Reflect and pray for the people you served",
      ],
    },
  ];
  const group = professionGroup(c.profession);
  const extra: [string, string, string, Cadence, Attribute, number, string][] =
    [
      [
        "reading-daily",
        "Reading and recall",
        "Read for 15 minutes. Write a summary without looking at the source.",
        "daily",
        "INT",
        20,
        "15 min",
      ],
      [
        "mobility-daily",
        "Mobility practice",
        "Practice gentle, controlled mobility appropriate to your ability.",
        "daily",
        "DEX",
        20,
        "10 min",
      ],
      [
        "connection-daily",
        "Contact someone",
        "Contact a friend, family member, or professional connection and listen to their response.",
        "daily",
        "CHA",
        20,
        "10 min",
      ],
      [
        "service-daily",
        "Practical service",
        "Complete one useful action for another person without expecting a reward.",
        "daily",
        "WIS",
        20,
        "10–20 min",
      ],
      [
        "profession-portfolio-daily",
        "Profession learning",
        group.practice,
        "daily",
        "INT",
        25,
        "20 min",
      ],
      [
        "profession-weekly",
        "Profession project",
        group.project,
        "weekly",
        "INT",
        100,
        "1–2 hours",
      ],
      [
        "profession-application-weekly",
        "Career review",
        "Review three relevant job descriptions. Identify recurring requirements and update one résumé section or skill goal.",
        "weekly",
        "CHA",
        80,
        "45 min",
      ],
      [
        "network-subnet-daily",
        "Subnetting practice",
        "Solve five IPv4 subnetting exercises. Check network, broadcast, and usable address ranges.",
        "daily",
        "INT",
        25,
        "15 min",
      ],
      [
        "network-switch-daily",
        "Switching lab",
        "Configure or simulate VLANs or trunking. Test connectivity and save the configuration.",
        "daily",
        "INT",
        30,
        "25 min",
      ],
      [
        "network-route-daily",
        "Routing lab",
        "Configure or simulate a route. Check the routing table and explain the packet path.",
        "daily",
        "INT",
        30,
        "25 min",
      ],
      [
        "network-lab-weekly",
        "Document a network lab",
        "Build a lab combining addressing, switching, and routing. Save a topology and test results.",
        "weekly",
        "INT",
        100,
        "60 min",
      ],
      [
        "analysis-spreadsheet-daily",
        "Spreadsheet practice",
        "Clean a dataset, write formulas, and check results against a small manual sample.",
        "daily",
        "INT",
        25,
        "20 min",
      ],
      [
        "analysis-sql-daily",
        "SQL practice",
        "Write and test queries using filters, joins, aggregation, or window functions. Explain each result.",
        "daily",
        "INT",
        25,
        "20 min",
      ],
      [
        "analysis-chart-daily",
        "Chart and explanation",
        "Create a chart from a dataset. State the question, conclusion, and limitations.",
        "daily",
        "INT",
        25,
        "20 min",
      ],
      [
        "faith-weekly",
        "Bible chapter review",
        "Read a Bible chapter, note the context, and explain its main teaching and application.",
        "weekly",
        "WIS",
        80,
        "30 min",
      ],
      [
        "profession-monthly",
        "Portfolio project",
        group.project + " Save the finished work and a short review.",
        "monthly",
        "INT",
        350,
        "4 sessions",
      ],
      [
        `${p.id}-technique-daily`,
        `${p.name} technique`,
        CORE[p.id][1] +
          " Spend 10 minutes focusing on technique or reviewing what you learned.",
        "daily",
        p.stat,
        20,
        "10 min",
      ],
      [
        `${p.id}-review-weekly`,
        `${p.name} progress review`,
        "Review your practice log. Identify one improvement, one difficulty, and your next training goal.",
        "weekly",
        p.stat,
        80,
        "20 min",
      ],
      [
        "study-monthly",
        "Complete a learning project",
        "Finish a course unit, technical project, or reading plan. Produce a summary and a practical example.",
        "monthly",
        "INT",
        300,
        "4 sessions",
      ],
    ];
  for (const [id, title, description, cadence, stat, xp, minutes] of extra)
    result.push({
      id,
      title,
      description,
      cadence,
      stat,
      xp,
      minutes,
      category: id.startsWith("profession-")
        ? c.profession
        : id.startsWith("network-")
          ? "Networking"
          : id.startsWith("analysis-")
            ? "Data Analysis"
            : id.startsWith(p.id)
              ? p.name
              : "Universal",
      checklist:
        cadence === "monthly"
          ? [
              "Complete the planned work",
              "Save evidence or notes",
              "Review the result",
            ]
          : undefined,
    });
  const sub = p.subclasses.find((x) => x.id === c.subclass);
  if (sub)
    result.splice(1, 0, {
      id: `${sub.id}-daily`,
      title:
        sub.id === "warpriest" || sub.id === "scribe"
          ? "Scripture study"
          : `${sub.name} practice`,
      description:
        sub.description +
        " Spend 15 minutes practicing and write a specific takeaway.",
      cadence: "daily",
      stat: sub.stat,
      xp: 25,
      minutes: "15 min",
      category: sub.name,
    });
  for (const o of result) {
    o.scope =
      o.id.startsWith("profession-") ||
      o.id.startsWith("network-") ||
      o.id.startsWith("analysis-")
        ? "profession"
        : o.category === p.name
          ? "class"
          : o.category === sub?.name
            ? "subclass"
            : "universal";
    if (o.id === `${p.id}-monthly`) o.statReward = { stat: p.stat, amount: 1 };
    if (o.id === "profession-monthly")
      o.statReward = { stat: professionStat(c.profession), amount: 1 };
    if (o.id === `${p.id}-review-weekly`)
      o.statReward = { stat: "WIS", amount: 1 };
  }
  if (sub) {
    result.push({
      id: `${sub.id}-weekly`,
      title: `${sub.name} weekly practice`,
      description: `Complete three ${sub.name.toLowerCase()} practice sessions. Review the notes and explain what you learned.`,
      cadence: "weekly",
      stat: sub.stat,
      xp: 90,
      minutes: "3 sessions",
      category: sub.name,
      scope: "subclass",
    });
    result.push({
      id: `${sub.id}-monthly`,
      title: `${sub.name} project`,
      description: `Complete a focused ${sub.name.toLowerCase()} project or study plan. ${sub.description}`,
      cadence: "monthly",
      stat: sub.stat,
      xp: 300,
      minutes: "4 sessions",
      category: sub.name,
      scope: "subclass",
      checklist: [
        "Complete four focused sessions",
        "Save notes or evidence",
        "Explain the practical result",
      ],
    });
  }
  return result;
}
export function period(cadence: Cadence, date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (cadence === "weekly") d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const year = d.getFullYear(),
    month = String(d.getMonth() + 1).padStart(2, "0"),
    day = String(d.getDate()).padStart(2, "0");
  return cadence === "monthly" ? `${year}-${month}` : `${year}-${month}-${day}`;
}
export const isComplete = (c: Character, o: Objective, now = new Date()) =>
  c.completions.some(
    (x) => x.id === o.id && x.period === period(o.cadence, now),
  );
export function complete(
  c: Character,
  o: Objective,
  now = new Date(),
): Character {
  // Only current objective templates can award real-world progress. A period can be claimed once.
  const actual = objectives(c).find((x) => x.id === o.id);
  if (!actual || isComplete(c, actual, now)) return c;
  const checked =
    c.milestones[`${actual.id}:${period(actual.cadence, now)}`] || [];
  if (
    actual.checklist &&
    !actual.checklist.every((_, i) => checked.includes(i))
  )
    return c;
  return {
    ...c,
    completions: [
      ...c.completions,
      {
        id: actual.id,
        period: period(actual.cadence, now),
        at: now.toISOString(),
        xp: actual.xp,
        stat: actual.stat,
        classId: c.activeClass,
        title: actual.title,
        profession: c.profession,
        scope: actual.scope,
        ...(actual.scope === "subclass" && c.subclass
          ? { subclassId: c.subclass }
          : {}),
        ...(actual.statReward ? { statReward: actual.statReward } : {}),
      },
    ],
  };
}
export function switchClass(c: Character, id: string): Character {
  const p = CLASSES.find((x) => x.id === id);
  if (!p || !available(p, stats(c), totalXP(c), c)) return c;
  return {
    ...c,
    activeClass: id,
    subclass: id === c.activeClass ? c.subclass : null,
  };
}
export function createCharacter(
  name: string,
  baseline: Baseline,
  activeClass: string,
  profession: string,
  demo = false,
): Character {
  const baseStats = startingStats(baseline),
    selected = CLASSES.find((x) => x.id === activeClass);
  return {
    version: 1,
    id: crypto.randomUUID(),
    name: name.trim().slice(0, 32) || "Adventurer",
    title: "Guild member",
    createdAt: new Date().toISOString(),
    baseline,
    baseStats,
    activeClass:
      selected && available(selected, baseStats, 0) ? selected.id : "disciple",
    subclass: null,
    profession,
    completions: [],
    certificates: [],
    journal: [],
    relics: [],
    earnedSkills: [],
    milestones: {},
    startingRank: startingRankFor(baseStats),
    learnedSkills: [],
    skillPurchases: [],
    demo,
  };
}
export function demoCharacter(): Character {
  const c = createCharacter(
    "Rowan",
    {
      ...EMPTY_BASELINE,
      pushups: 24,
      squats: 30,
      balance: 30,
      walk: 30,
      reading: 40,
      reflection: 4,
      connection: 3,
    },
    "warrior",
    "Analyst",
    true,
  );
  c.title = "Registered adventurer";
  return c;
}
export function activity(c: Character, days = 7, now = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days + i + 1);
    const key = period("daily", d);
    return {
      key,
      label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      count: c.completions.filter(
        (x) => period("daily", new Date(x.at)) === key,
      ).length,
    };
  });
}
export { SKILLS } from "./skill-catalog";
export type { Skill } from "./skill-catalog";
export const hasSkill = (c: Character, s: Skill) =>
  c.earnedSkills.includes(s.id);
export function skillWallet(c: Character, s?: Skill): string {
  if (!s || s.category === "universal") return "universal";
  if (s.subclass) return `subclass:${s.subclass}`;
  if (s.category === "class") return `class:${s.owner}`;
  return `profession:${c.profession}`;
}
export function walletXP(c: Character, wallet: string): number {
  const [type, ...rest] = wallet.split(":"),
    id = rest.join(":");
  if (type === "class") return classXP(c, id);
  if (type === "subclass") return subclassXP(c, id);
  if (type === "profession") return professionXP(c, id);
  return c.completions
    .filter((o) => o.scope === "universal")
    .reduce((n, o) => n + o.xp, 0);
}
export const walletLevel = (c: Character, wallet: string) =>
  wallet === "universal"
    ? level(totalXP(c))
    : 1 + Math.floor(walletXP(c, wallet) / 100);
export const skillPointsEarned = (c: Character, wallet = "universal") =>
  Math.floor(walletXP(c, wallet) / 25) +
  Math.max(0, walletLevel(c, wallet) - 1) * 2;
export const skillPointsAvailable = (c: Character, wallet = "universal") =>
  skillPointsEarned(c, wallet) -
  (c.skillPurchases || [])
    .filter((p) => p.wallet === wallet)
    .reduce((n, p) => n + p.cost, 0);
export function skillTier(s: Skill): number {
  return s.tier === "V"
    ? 20
    : s.tier === "IV"
      ? 10
      : s.tier === "III" || s.tier === "4"
        ? 5
        : s.tier === "II" || s.tier === "2" || s.tier === "3"
          ? 3
          : 1;
}
export function skillRequirements(c: Character, s: Skill): string[] {
  const missing: string[] = [];
  if (s.current(c) < s.target)
    missing.push(`${s.proof} (${s.current(c)}/${s.target})`);
  if (!s.automatic) {
    for (const id of s.parents) {
      const parent = SKILLS.find((x) => x.id === id);
      if (parent && !hasSkill(c, parent)) missing.push(`Learn ${parent.name}`);
    }
    const wallet = skillWallet(c, s),
      lv = walletLevel(c, wallet),
      needed = skillTier(s);
    if (lv < needed)
      missing.push(
        `${s.subclass ? "Subclass" : s.category === "class" ? "Class" : s.category === "profession" ? "Profession" : "Adventurer"} level ${needed} (current ${lv})`,
      );
    if (
      (s.category === "class" || s.category === "subclass") &&
      s.owner !== c.activeClass
    )
      missing.push(`Active class: ${s.owner}`);
    if (s.subclass && s.subclass !== c.subclass)
      missing.push(`Select subclass: ${s.subclass}`);
    if (
      s.category === "profession" &&
      s.owner !== "networking" &&
      s.owner !== "analysis" &&
      s.owner !== professionGroup(c.profession).code
    )
      missing.push(`Select a profession in ${s.branch}`);
    if (skillPointsAvailable(c, wallet) < s.cost)
      missing.push(`Need ${s.cost} ${wallet.split(":")[0]} skill shards`);
  }
  return missing;
}
export function learnSkill(c: Character, id: string): Character {
  const s = SKILLS.find((x) => x.id === id);
  if (!s || hasSkill(c, s) || s.automatic || skillRequirements(c, s).length)
    return c;
  return {
    ...c,
    earnedSkills: [...c.earnedSkills, id],
    learnedSkills: [...(c.learnedSkills || []), id],
    skillPurchases: [
      ...(c.skillPurchases || []),
      { id, wallet: skillWallet(c, s), cost: s.cost },
    ],
  };
}
export function awardSkills(c: Character): Character {
  return {
    ...c,
    earnedSkills: [
      ...new Set([
        ...c.earnedSkills,
        "universal-root",
        ...SKILLS.filter((s) => s.automatic && s.current(c) >= s.target).map(
          (s) => s.id,
        ),
      ]),
    ],
  };
}
