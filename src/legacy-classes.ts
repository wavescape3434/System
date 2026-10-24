import type { Attribute, Stats } from "./domain";
export interface LegacyClassPath {
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
export const CLASSES: LegacyClassPath[] = [
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
