export const ATTRIBUTES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;
export type Attribute = (typeof ATTRIBUTES)[number];
export type Stats = Record<Attribute, number>;
export type Cadence = "daily" | "weekly" | "monthly";
export interface Baseline {
  mode: "bodyweight" | "weights";
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
  bodyweight: 70,
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
  subclasses: {
    id: string;
    name: string;
    description: string;
    stat: Attribute;
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
export const PROFESSIONS = [
  "Analyst",
  "Developer",
  "Designer",
  "Educator",
  "Entrepreneur",
  "Student",
  "Craftsperson",
  "Explorer",
] as const;
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
}
const CORE: Record<string, [string, string, string, string]> = {
  warrior: [
    "Forge your strength",
    "Complete a comfortable strength session: wall, knee, or floor pushups; squats; or your usual weighted routine. Leave a few reps in reserve.",
    "Build a stronger foundation",
    "Complete three manageable strength sessions this week. Rest between sessions.",
  ],
  ranger: [
    "Walk the untraveled path",
    "Take a comfortable walk and practice a few minutes of gentle balance or mobility.",
    "A little farther afield",
    "Explore a new safe route and complete three movement sessions this week.",
  ],
  scholar: [
    "A page toward mastery",
    "Spend 20 focused minutes reading or studying. Write one thing you can explain from memory.",
    "Knowledge into practice",
    "Complete three study sessions and apply one idea in a small project.",
  ],
  bard: [
    "Make a meaningful connection",
    "Reach out to someone, listen with care, and ask one thoughtful question.",
    "Let your voice be heard",
    "Practice a presentation or share something you created with another person.",
  ],
  disciple: [
    "Be still & grow",
    "Read a passage of the Bible. Note its context, what it teaches, and one way to apply it. Close in prayer.",
    "Faith in action",
    "Study a Bible chapter in context and complete one act of service this week.",
  ],
  sentinel: [
    "Tend to your foundation",
    "Take a comfortable walk, stretch gently, and set aside time for a consistent bedtime.",
    "A rhythm that restores",
    "Complete three gentle movement sessions and reflect on your sleep habits.",
  ],
  paladin: [
    "Strength with purpose",
    "Complete a comfortable strength session and a quiet moment of prayer.",
    "Put your strength to work",
    "Complete three training sessions and help someone with a practical need.",
  ],
  sage: [
    "Seek understanding",
    "Study for 20 minutes and reflect on how the idea connects to your values.",
    "Pass the light along",
    "Study a topic deeply and teach someone the key idea this week.",
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
  demo: boolean;
}
const clamp = (n: number, max: number) =>
  Math.max(0, Math.min(max, Number.isFinite(n) ? n : 0));
export function startingStats(b: Baseline): Stats {
  const strength =
    b.mode === "weights"
      ? (clamp(b.load, 500) / Math.max(30, b.bodyweight)) *
        (1 + clamp(b.reps, 30) / 30) *
        6
      : clamp(b.pushups, 80) / 4;
  return {
    STR: 3 + Math.min(15, Math.round(strength)),
    DEX: 3 + Math.round(clamp(b.balance, 90) / 6),
    CON:
      3 +
      Math.min(
        15,
        Math.round(clamp(b.walk, 120) / 12 + clamp(b.squats, 80) / 10),
      ),
    INT: 3 + Math.round(clamp(b.reading, 150) / 10),
    WIS: 3 + Math.round(clamp(b.reflection, 7) * 1.5),
    CHA: 3 + Math.round(clamp(b.connection, 10) * 1.5),
  };
}
export const totalXP = (c: Character) =>
  c.completions.reduce((s, x) => s + x.xp, 0);
export const level = (xp: number) => Math.floor(xp / 250) + 1;
export function stats(c: Character): Stats {
  return Object.fromEntries(
    ATTRIBUTES.map((a) => [
      a,
      c.baseStats[a] +
        Math.floor(
          c.completions
            .filter((x) => x.stat === a)
            .reduce((s, x) => s + x.xp, 0) / 100,
        ),
    ]),
  ) as Stats;
}
export const classXP = (c: Character, id: string) =>
  c.completions.filter((x) => x.classId === id).reduce((s, x) => s + x.xp, 0);
export const classLevel = (c: Character, id: string) =>
  Math.floor(classXP(c, id) / 100) + 1;
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
export const RANKS = [
  { name: "F", xp: 0 },
  { name: "E", xp: 500 },
  { name: "D", xp: 1500 },
  { name: "C", xp: 3500 },
  { name: "B", xp: 7000 },
  { name: "A", xp: 12000 },
  { name: "S", xp: 20000 },
  { name: "SS", xp: 32000 },
  { name: "SSS", xp: 50000 },
];
export const rank = (xp: number) =>
  [...RANKS].reverse().find((r) => xp >= r.xp)!;
export const available = (p: ClassPath, s: Stats, xp: number) =>
  Object.entries(p.requirements).every(([a, n]) => s[a as Attribute] >= n!) &&
  xp >= (p.minXP || 0);
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
      title: "A moment of gratitude",
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
          ? "Build your next opportunity"
          : "Practice your craft",
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
      title: "Connect the dots",
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
      title: "The network apprentice",
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
      title: "The making of a hero",
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
      title: "A light in your community",
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
  const sub = p.subclasses.find((x) => x.id === c.subclass);
  if (sub)
    result.splice(1, 0, {
      id: `${sub.id}-daily`,
      title:
        sub.id === "warpriest" || sub.id === "scribe"
          ? "Rooted in the Word"
          : `${sub.name} practice`,
      description:
        sub.description +
        " Spend 15 intentional minutes and note one practical takeaway.",
      cadence: "daily",
      stat: sub.stat,
      xp: 25,
      minutes: "15 min",
      category: sub.name,
    });
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
      },
    ],
  };
}
export function switchClass(c: Character, id: string): Character {
  const p = CLASSES.find((x) => x.id === id);
  if (!p || !available(p, stats(c), totalXP(c))) return c;
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
    title: "A story yet unwritten",
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
  c.title = "The beginning of something great";
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
export interface Skill {
  id: string;
  name: string;
  description: string;
  stat: Attribute;
  current: (c: Character) => number;
  target: number;
  proof: string;
  tier: string;
}
export const SKILLS: Skill[] = [
  {
    id: "network-initiate",
    name: "Packet Initiate",
    description: "Lay the foundations of networking with deliberate practice.",
    stat: "INT",
    current: (c) =>
      c.completions.filter((x) => x.id.startsWith("network-")).length,
    target: 3,
    proof: "Complete 3 networking objectives",
    tier: "Foundation",
  },
  {
    id: "network-intermediate",
    name: "Architect of Connections",
    description:
      "A recognized networking credential becomes a permanent part of your character.",
    stat: "INT",
    current: (c) =>
      c.certificates.some((x) =>
        ["CCNA", "CompTIA Network+", "Juniper JNCIA-Junos"].includes(x.name),
      )
        ? 1
        : 0,
    target: 1,
    proof: "Record a CCNA, Network+, or JNCIA-Junos certificate",
    tier: "Intermediate",
  },
  {
    id: "network-master",
    name: "Realm Network Architect",
    description:
      "Demonstrate advanced network expertise with a professional certification.",
    stat: "INT",
    current: (c) =>
      c.certificates.some((x) =>
        ["CCNP Enterprise", "Juniper JNCIP-ENT"].includes(x.name),
      )
        ? 1
        : 0,
    target: 1,
    proof: "Record a CCNP Enterprise or JNCIP-ENT certificate",
    tier: "Advanced",
  },
  {
    id: "strength",
    name: "Iron Resolve",
    description: "Show up for your strength practice again and again.",
    stat: "STR",
    current: (c) => c.completions.filter((x) => x.stat === "STR").length,
    target: 10,
    proof: "Complete 10 strength objectives",
    tier: "Foundation",
  },
  {
    id: "scripture",
    name: "Rooted in the Word",
    description:
      "Deepen your understanding through Scripture and intentional reflection.",
    stat: "WIS",
    current: (c) => c.completions.filter((x) => x.stat === "WIS").length,
    target: 7,
    proof: "Complete 7 wisdom objectives",
    tier: "Foundation",
  },
  {
    id: "connection",
    name: "Voice of Encouragement",
    description: "Make connection and care a consistent part of your life.",
    stat: "CHA",
    current: (c) => c.completions.filter((x) => x.stat === "CHA").length,
    target: 5,
    proof: "Complete 5 charisma objectives",
    tier: "Foundation",
  },
];
export const hasSkill = (c: Character, s: Skill) =>
  c.earnedSkills.includes(s.id) || s.current(c) >= s.target;
export function awardSkills(c: Character): Character {
  return {
    ...c,
    earnedSkills: [
      ...new Set([
        ...c.earnedSkills,
        ...SKILLS.filter((s) => s.current(c) >= s.target).map((s) => s.id),
      ]),
    ],
  };
}
