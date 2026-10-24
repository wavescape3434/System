import { EXPANDED_SKILLS } from "./expanded-skills";
import { SUBCLASS_TECHNIQUES } from "./class-roles";
import type { Attribute, Character } from "./domain";
import { PROFESSION_GROUPS, professionGroup } from "./professions";
export interface Skill {
  id: string;
  name: string;
  description: string;
  stat: Attribute;
  category: "universal" | "class" | "subclass" | "profession";
  branch: string;
  owner?: string;
  subclass?: string;
  parents: string[];
  x: number;
  y: number;
  cost: number;
  target: number;
  proof: string;
  tier: string;
  current: (c: Character) => number;
  automatic?: boolean;
  combat?: string;
  archetype?:string;
  requiredLevel?:number;
  legacy?:boolean;
  nonCombat?:boolean;
}
const count = (c: Character, stat?: Attribute) =>
  c.completions.filter((o) => !stat || o.stat === stat).length;
const credential = (c: Character, names: string[]) =>
  c.certificates.some((x) => names.includes(x.name)) ? 1 : 0;
export const SKILLS: Skill[] = [];
const add = (s: Skill) => SKILLS.push(s);
add({
  id: "universal-root",
  name: "Guild Training",
  description:
    "Basic adventure actions: attack, defend, and use items. No real-world stat bonus.",
  stat: "CON",
  category: "universal",
  branch: "Universal",
  parents: [],
  x: 540,
  y: 690,
  cost: 0,
  target: 0,
  current: () => 0,
  proof: "Available to every adventurer",
  tier: "Foundation",
});
const universal: [Attribute, string, string, string, string][] = [
  [
    "STR",
    "Strength Basics",
    "Iron Resolve",
    "Power Strike",
    "Controlled strength training and repeatable technique.",
  ],
  [
    "DEX",
    "Mobility Basics",
    "Sure Footing",
    "Quickstep",
    "Balance, mobility, and coordination practice.",
  ],
  [
    "CON",
    "Conditioning",
    "Endurance",
    "Second Wind",
    "Sustainable movement and recovery habits.",
  ],
  [
    "INT",
    "Study Method",
    "Focused Recall",
    "Tactical Insight",
    "Study, retrieval practice, and applied learning.",
  ],
  [
    "WIS",
    "Reflection",
    "Rooted in the Word",
    "Field Medicine",
    "Christian reflection, Scripture study, and service.",
  ],
  [
    "CHA",
    "Conversation",
    "Voice of Encouragement",
    "Rally",
    "Communication and consistent relationship practice.",
  ],
];
universal.forEach(([stat, a, b, d, description], i) => {
  const x = 90 + i * 180,
    oldId =
      stat === "STR"
        ? "strength"
        : stat === "WIS"
          ? "scripture"
          : stat === "CHA"
            ? "connection"
            : `universal-${stat.toLowerCase()}-2`;
  const id = `universal-${stat.toLowerCase()}-1`;
  add({
    id,
    name: a,
    description,
    stat,
    category: "universal",
    branch: "Universal",
    parents: ["universal-root"],
    x,
    y: 480,
    cost: 1,
    target: 1,
    current: (c) => count(c, stat),
    proof: `Complete 1 ${stat} objective`,
    tier: "I",
  });
  add({
    id: oldId,
    name: b,
    description: `Continue ${description.toLowerCase()} Requires the earlier node.`,
    stat,
    category: "universal",
    branch: "Universal",
    parents: [id],
    x,
    y: 280,
    cost: 1,
    target: stat === "WIS" ? 7 : stat === "CHA" ? 5 : 10,
    current: (c) => count(c, stat),
    proof: `Complete ${stat === "WIS" ? 7 : stat === "CHA" ? 5 : 10} ${stat} objectives`,
    tier: "II",
  });
  add({
    id: `universal-${stat.toLowerCase()}-3`,
    name: d,
    description: `Unlocks ${d.toLowerCase()} in adventures. Does not increase real-world attributes.`,
    stat,
    category: "universal",
    branch: "Universal",
    parents: [oldId],
    x,
    y: 80,
    cost: 2,
    target: 20,
    current: (c) => count(c, stat),
    proof: `Complete 20 ${stat} objectives`,
    tier: "III",
    combat: (
      {
        STR: "power",
        DEX: "quick",
        CON: "guard",
        INT: "scan",
        WIS: "heal",
        CHA: "rally",
      } as const
    )[stat],
  });
});
const classRows: [string, Attribute, string, string, string, string][] = [
  [
    "warrior",
    "STR",
    "Weapon Drills",
    "Shield Bash",
    "Cleave",
    "Battle Training",
  ],
  [
    "ranger",
    "DEX",
    "Trailcraft",
    "Aimed Shot",
    "Twin Arrows",
    "Ranger Training",
  ],
  [
    "scholar",
    "INT",
    "Research Methods",
    "Arcane Bolt",
    "Elemental Burst",
    "Scholar Training",
  ],
  [
    "bard",
    "CHA",
    "Performance",
    "Battle Song",
    "Inspiring Chorus",
    "Bard Training",
  ],
  [
    "disciple",
    "WIS",
    "Scripture Study",
    "Restoration",
    "Sanctuary",
    "Disciple Training",
  ],
  [
    "sentinel",
    "CON",
    "Defensive Drills",
    "Brace",
    "Hold the Line",
    "Sentinel Training",
  ],
  [
    "paladin",
    "STR",
    "Oath Training",
    "Radiant Strike",
    "Aegis",
    "Paladin Training",
  ],
  ["sage", "INT", "Advanced Study", "Focused Bolt", "Insight", "Sage Training"],
  ["monk", "DEX", "Body Control", "Flurry", "Centering", "Monk Training"],
  ["rogue", "DEX", "Precision Drills", "Backstab", "Evasion", "Rogue Training"],
  [
    "artificer",
    "INT",
    "Applied Craft",
    "Spark Charge",
    "Field Repair",
    "Artificer Training",
  ],
  [
    "marshal",
    "CHA",
    "Leadership Practice",
    "Command",
    "Coordinated Strike",
    "Marshal Training",
  ],
];
classRows.forEach(([owner, stat, root, left, right, branch]) => {
  const practice = (c: Character) =>
    c.completions.filter(
      (o) =>
        o.classId === owner &&
        o.stat === stat &&
        (!o.scope || o.scope === "class" || o.scope === "subclass"),
    ).length;
  add({
    id: `${owner}-root`,
    name: root,
    description: `Train the ${owner} class through real-world ${stat} objectives.`,
    stat,
    category: "class",
    branch,
    owner,
    parents: [],
    x: 540,
    y: 650,
    cost: 1,
    target: 2,
    current: practice,
    proof: `2 ${owner} ${stat} objectives`,
    tier: "I",
  });
  [left, right].forEach((name, i) =>
    add({
      id: `${owner}-branch-${i}`,
      name,
      description: `Unlocks a ${i ? "support or multi-target" : "focused attack"} action in turn-based adventures.`,
      stat,
      category: "class",
      branch,
      owner,
      parents: [`${owner}-root`],
      x: 330 + i * 420,
      y: 420,
      cost: 1,
      target: 5 + i * 3,
      current: practice,
      proof: `${5 + i * 3} ${owner} ${stat} objectives`,
      tier: "II",
      combat: (
        {
          warrior: ["bash", "quick"],
          ranger: ["pierce", "quick"],
          scholar: ["fire", "area"],
          bard: ["rally", "heal-all"],
          disciple: ["heal", "ward"],
          sentinel: ["ward", "taunt"],
          paladin: ["hybrid", "ward"],
          sage: ["fire", "scan"],
          monk: ["flurry", "heal-self"],
          rogue: ["pierce", "counter"],
          artificer: ["area", "heal"],
          marshal: ["rally", "coordinated"],
        } as Record<string, string[]>
      )[owner][i],
    }),
  );
  add({
    id: `${owner}-mastery`,
    name: `${owner[0].toUpperCase() + owner.slice(1)} Mastery`,
    description:
      "Advanced class technique. Requires both class branches and documented practice.",
    stat,
    category: "class",
    branch,
    owner,
    parents: [`${owner}-branch-0`, `${owner}-branch-1`],
    x: 540,
    y: 190,
    cost: 2,
    target: 25,
    current: practice,
    proof: `25 ${owner} ${stat} objectives`,
    tier: "III",
    combat: (
      {
        warrior: "quick",
        ranger: "pierce",
        scholar: "area",
        bard: "focus-all",
        disciple: "heal-all",
        sentinel: "bulwark",
        paladin: "formation",
        sage: "scan",
        monk: "flurry",
        rogue: "power",
        artificer: "burn",
        marshal: "formation",
      } as Record<string, string>
    )[owner],
  });
});
const subclasses: [string, string, Attribute, string][] = [
  ["warpriest", "warrior", "WIS", "Prayer & Service"],
  ["eldritch-knight", "warrior", "INT", "Spellcraft"],
  ["guardian", "warrior", "CON", "Guardian Formation"],
  ["scribe", "scholar", "WIS", "Scripture Exegesis"],
  ["tactician", "scholar", "CHA", "Tactical Command"],
  ["trailwarden", "ranger", "CON", "Trail Endurance"],
  ["pathfinder", "ranger", "INT", "Route Planning"],
  ["herald", "bard", "INT", "Public Address"],
  ["encourager", "bard", "WIS", "Encouragement"],
  ["servant", "disciple", "CHA", "Practical Service"],
  ["apologist", "disciple", "INT", "Christian Apologetics"],
  ["ironheart", "sentinel", "STR", "Iron Guard"],
  ["wayfarer", "sentinel", "DEX", "Mobile Defense"],
  ["oathkeeper", "paladin", "WIS", "Oathkeeper Discipline"],
  ["mentor", "sage", "CHA", "Mentorship"],
  ["pugilist", "monk", "STR", "Striking Technique"],
  ["athlete", "monk", "CON", "Athletic Recovery"],
  ["scout", "rogue", "INT", "Reconnaissance"],
  ["duelist", "rogue", "STR", "Duel Technique"],
  ["engineer", "artificer", "DEX", "Precision Tools"],
  ["runewright", "artificer", "WIS", "Careful Design"],
  ["commander", "marshal", "INT", "Battle Planning"],
  ["chaplain", "marshal", "WIS", "Christian Care"],
];
subclasses.forEach(([subclass, owner, stat, name]) => {
  const branch = `${subclass} Specialization`,
    practice = (c: Character) =>
      c.completions.filter((o) => o.id === `${subclass}-daily`).length;
  const root = `sub-${subclass}`;
  add({
    id: root,
    name,
    description:
      "Specialization training. Selecting a subclass grants no stats or abilities by itself.",
    stat,
    category: "subclass",
    branch,
    owner,
    subclass,
    parents: [],
    x: 540,
    y: 650,
    cost: 1,
    target: 2,
    current: practice,
    proof: "Complete 2 specialization objectives",
    tier: "I",
  });
  for (let i = 0; i < 2; i++)
    add({
      id: `${root}-branch-${i}`,
      name: SUBCLASS_TECHNIQUES[subclass][i],
      description:
        "An equipped combat skill. This does not alter real-world attributes.",
      stat,
      category: "subclass",
      branch,
      owner,
      subclass,
      parents: [root],
      x: 300 + i * 480,
      y: 420,
      cost: 2,
      target: 6 + i * 2,
      current: practice,
      proof: `Complete ${6 + i * 2} specialization objectives`,
      tier: "II",
      combat: SUBCLASS_TECHNIQUES[subclass][3].split(",")[i],
    });
  add({
    id: `${root}-mastery`,
    name: SUBCLASS_TECHNIQUES[subclass][2],
    description: "Advanced specialization technique for JRPG combat.",
    stat,
    category: "subclass",
    branch,
    owner,
    subclass,
    parents: [`${root}-branch-0`, `${root}-branch-1`],
    x: 540,
    y: 190,
    cost: 3,
    target: 18,
    current: practice,
    proof: "Complete 18 specialization objectives",
    tier: "III",
    combat: SUBCLASS_TECHNIQUES[subclass][3].split(",")[2],
  });
});
PROFESSION_GROUPS.forEach((group) => {
  const id = `career-${group.code}`;
  const current = (c: Character) =>
    c.completions.filter(
      (o) =>
        o.id.startsWith("profession-") &&
        professionGroup(o.profession || c.profession).code === group.code,
    ).length;
  const entries = [
    ["Role Foundations", 2, 540, 650, [], 1],
    ["Applied Practice", 8, 330, 400, [id + "-0"], 1],
    ["Portfolio Project", 12, 750, 400, [id + "-0"], 1],
    ["Professional Practice", 25, 540, 170, [id + "-1", id + "-2"], 2],
  ] as const;
  entries.forEach(([name, target, x, y, parents, cost], i) =>
    add({
      id: `${id}-${i}`,
      name,
      description: `${group.name}: ${i < 2 ? group.practice : group.project}`,
      stat: "INT",
      category: "profession",
      branch: group.name,
      owner: group.code,
      parents: [...parents],
      x,
      y,
      cost,
      target,
      current,
      proof: `Complete ${target} ${group.name.toLowerCase()} profession objectives`,
      tier: String(i + 1),
      combat: i === 3 ? "scan" : undefined,
    }),
  );
});
const networkPractice = (c: Character) =>
  c.completions.filter((o) => o.id.startsWith("network-")).length;
const network: [string, string, string[], number, number, number][] = [
  ["network-initiate", "Packet Initiate", [], 3, 540, 690],
  ["network-subnet", "Subnetting", ["network-initiate"], 6, 250, 480],
  ["network-switch", "Switching", ["network-initiate"], 6, 540, 480],
  ["network-route", "Routing", ["network-initiate"], 6, 830, 480],
  [
    "network-lab",
    "Network Lab Builder",
    ["network-subnet", "network-switch", "network-route"],
    12,
    540,
    270,
  ],
];
network.forEach(([id, name, parents, target, x, y]) =>
  add({
    id,
    name,
    description:
      "Earn through networking study and practical labs. Record what you configure and test.",
    stat: "INT",
    category: "profession",
    branch: "Networking",
    owner: "networking",
    parents,
    x,
    y,
    cost: 1,
    target,
    current: networkPractice,
    proof: `Complete ${target} networking objectives`,
    tier: "Practice",
    combat: id === "network-lab" ? "scan" : undefined,
  }),
);
add({
  id: "network-intermediate",
  name: "Architect of Connections",
  description:
    "Intermediate networking credential. Automatically earned when a qualifying certification is recorded.",
  stat: "INT",
  category: "profession",
  branch: "Networking",
  owner: "networking",
  parents: ["network-lab"],
  x: 320,
  y: 70,
  cost: 0,
  target: 1,
  current: (c) =>
    credential(c, ["CCNA", "CompTIA Network+", "Juniper JNCIA-Junos"]),
  proof: "Record CCNA, Network+, or JNCIA-Junos (self-reported)",
  tier: "Credential",
  automatic: true,
});
add({
  id: "network-master",
  name: "Realm Network Architect",
  description:
    "Advanced networking credential. Automatically earned when a qualifying certification is recorded.",
  stat: "INT",
  category: "profession",
  branch: "Networking",
  owner: "networking",
  parents: ["network-intermediate"],
  x: 790,
  y: 70,
  cost: 0,
  target: 1,
  current: (c) => credential(c, ["CCNP Enterprise", "Juniper JNCIP-ENT"]),
  proof: "Record CCNP Enterprise or JNCIP-ENT (self-reported)",
  tier: "Credential",
  automatic: true,
});
const analysis = [
  ["analysis-spreadsheets", "Spreadsheet Analysis", 3, 540, 650, []],
  ["analysis-sql", "SQL Queries", 8, 280, 420, ["analysis-spreadsheets"]],
  [
    "analysis-charts",
    "Data Visualization",
    8,
    800,
    420,
    ["analysis-spreadsheets"],
  ],
  [
    "analysis-report",
    "Analytical Report",
    18,
    540,
    190,
    ["analysis-sql", "analysis-charts"],
  ],
] as const;
analysis.forEach(([id, name, target, x, y, parents]) =>
  add({
    id,
    name,
    description:
      "Build and document analyses with spreadsheets, queries, visualizations, and written findings.",
    stat: "INT",
    category: "profession",
    branch: "Data Analysis",
    owner: "analysis",
    parents: [...parents],
    x,
    y,
    cost: 1,
    target,
    current: (c) =>
      c.completions.filter((o) => o.id.startsWith("analysis-")).length,
    proof: `Complete ${target} data-analysis objectives`,
    tier: "Practice",
    combat: id === "analysis-report" ? "scan" : undefined,
  }),
);

// Expert and master sections extend each class beyond the initial branches.
const advanced: Record<
  string,
  [string, string, string, string, string, string]
> = {
  warrior: [
    "Riposte",
    "War Cry",
    "Unyielding Advance",
    "counter",
    "rally",
    "bulwark",
  ],
  ranger: [
    "Piercing Volley",
    "Trail Restoration",
    "Hail of Arrows",
    "pierce",
    "heal-self",
    "quick",
  ],
  scholar: [
    "Mana Study",
    "Blazing Field",
    "Arcane Storm",
    "focus",
    "burn",
    "area",
  ],
  bard: [
    "Restorative Verse",
    "Guiding Chorus",
    "Grand Performance",
    "heal-all",
    "focus-all",
    "formation",
  ],
  disciple: [
    "Sustaining Prayer",
    "Protective Care",
    "Group Restoration",
    "focus",
    "ward",
    "heal-all",
  ],
  sentinel: [
    "Shield Riposte",
    "Fortify",
    "Unbroken Bulwark",
    "counter",
    "taunt",
    "bulwark",
  ],
  paladin: [
    "Merciful Blow",
    "Guardian Oath",
    "Sanctuary Formation",
    "hybrid",
    "ward",
    "formation",
  ],
  sage: [
    "Analyze Armor",
    "Mental Focus",
    "Shared Understanding",
    "scan",
    "focus",
    "focus-all",
  ],
  monk: [
    "Counter Stance",
    "Controlled Breathing",
    "Perfect Flurry",
    "counter",
    "focus",
    "flurry",
  ],
  rogue: [
    "Expose Armor",
    "Ambush",
    "Finishing Strike",
    "scan",
    "power",
    "pierce",
  ],
  artificer: [
    "Incendiary Array",
    "Emergency Repair",
    "Overload Field",
    "burn",
    "heal",
    "area",
  ],
  marshal: [
    "Defensive Orders",
    "Supply Coordination",
    "Grand Strategy",
    "ward",
    "focus-all",
    "formation",
  ],
};
for (const [owner, stat] of classRows) {
  const root = SKILLS.find((s) => s.id === `${owner}-root`)!;
  root.y = 690;
  for (let i = 0; i < 2; i++)
    SKILLS.find((s) => s.id === `${owner}-branch-${i}`)!.y = 530;
  SKILLS.find((s) => s.id === `${owner}-mastery`)!.y = 370;
  const current = root.current;
  for (let i = 0; i < 2; i++)
    add({
      id: `${owner}-expert-${i}`,
      name: advanced[owner][i],
      description:
        "Expert class combat technique. Requires the level-10 class section and earlier mastery.",
      stat,
      category: "class",
      branch: root.branch,
      owner,
      parents: [`${owner}-mastery`],
      x: 330 + i * 420,
      y: 210,
      cost: 3,
      target: 40,
      current,
      proof: `40 ${owner} class objectives`,
      tier: "IV",
      combat: advanced[owner][i + 3],
    });
  add({
    id: `${owner}-capstone`,
    name: advanced[owner][2],
    description:
      "Master class technique. Requires level 20, both expert branches, and a sustained practice record.",
    stat,
    category: "class",
    branch: root.branch,
    owner,
    parents: [`${owner}-expert-0`, `${owner}-expert-1`],
    x: 540,
    y: 50,
    cost: 4,
    target: 75,
    current,
    proof: `75 ${owner} class objectives`,
    tier: "V",
    combat: advanced[owner][5],
  });
}
for (const [subclass, owner, stat, name] of subclasses) {
  const root = SKILLS.find((s) => s.id === `sub-${subclass}`)!;
  root.y = 690;
  for (let i = 0; i < 2; i++)
    SKILLS.find((s) => s.id === `sub-${subclass}-branch-${i}`)!.y = 530;
  SKILLS.find((s) => s.id === `sub-${subclass}-mastery`)!.y = 370;
  const current = root.current,
    tech = SUBCLASS_TECHNIQUES[subclass];
  add({
    id: `sub-${subclass}-expert`,
    name: `Advanced ${tech[0]}`,
    description:
      "Expert specialization training. An equipped combat technique, not a base attribute increase.",
    stat,
    category: "subclass",
    branch: root.branch,
    owner,
    subclass,
    parents: [`sub-${subclass}-mastery`],
    x: 540,
    y: 210,
    cost: 3,
    target: 30,
    current,
    proof: `30 ${name.toLowerCase()} objectives`,
    tier: "IV",
    combat: tech[3].split(",")[1],
  });
  add({
    id: `sub-${subclass}-capstone`,
    name: `${tech[2]} Mastery`,
    description:
      "Master specialization technique, unlocked at subclass level 20.",
    stat,
    category: "subclass",
    branch: root.branch,
    owner,
    subclass,
    parents: [`sub-${subclass}-expert`],
    x: 540,
    y: 50,
    cost: 4,
    target: 60,
    current,
    proof: `60 ${name.toLowerCase()} objectives`,
    tier: "V",
    combat: tech[3].split(",")[2],
  });
}

// Original skill IDs are retained for saved characters and purchased-skill records.
for(const s of SKILLS) {
 if(s.category==='class'||s.category==='subclass'||(s.category==='profession'&&!['networking','analysis'].includes(s.owner||''))) s.legacy=true;
 if(s.category==='universal'&&!s.automatic&&s.id!=='universal-root') s.cost=Math.max(4,s.cost*4);
 if(s.category==='profession'&&['networking','analysis'].includes(s.owner||'')) {s.nonCombat=true;s.combat=undefined;if(!s.automatic)s.cost=Math.max(4,s.cost*4);}
}
SKILLS.push(...EXPANDED_SKILLS);
