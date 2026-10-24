import { CAREER_GUIDES } from "./career-guides";
import type { Skill } from "./skill-catalog";
import type { Character } from "./domain";
import { ARCHETYPES, CLASSES } from "./class-catalog";
import { CAREER_CATEGORIES, careerCategory } from "./careers";
const techniques: Record<string, [string, string, string][]> = {
  fighter: [
    ["Weapon Discipline", "power", "A heavy, controlled strike."],
    ["Shield Breaker", "bash", "Damage and stun a regular enemy."],
    ["Sweeping Edge", "quick", "Strike the enemy line."],
    ["Armor Splitter", "pierce", "Bypass heavy defenses."],
    ["Battle Recovery", "heal-self", "Regain HP without help."],
    ["Steel Tempest", "quick", "A disciplined multi-target assault."],
    ["Duelist’s Answer", "counter", "Guard and punish an incoming attack."],
    ["Vanguard Charge", "coordinated", "Lead an ally in a coordinated strike."],
    ["Warrior’s Resolve", "focus", "Recover MP for a long encounter."],
    ["Perfect Cleave", "power", "Master a decisive physical strike."],
    ["Legend of Steel", "hybrid", "Combine weapon force and magic."],
    ["Endless Arsenal", "formation", "Prepare the party for a long battle."],
  ],
  guardian: [
    ["Shield Discipline", "taunt", "Draw attacks away from companions."],
    ["Tower Guard", "ward", "Protect all allies through the enemy turn."],
    ["Shield Rush", "bash", "Interrupt a regular enemy."],
    ["Iron Recovery", "heal-self", "Restore your own HP."],
    ["Return the Blow", "counter", "Counter incoming attacks."],
    ["Hold the Gate", "bulwark", "Guard the party and draw attacks."],
    ["Rescue Formation", "formation", "Increase the party’s defense."],
    ["Unbroken Watch", "focus", "Restore your reserve of MP."],
    ["Citadel Heart", "heal-all", "Recover the party’s HP."],
    ["Last Rampart", "bulwark", "Anchor a defensive formation."],
    ["Titan’s Reversal", "power", "Deliver a heavy counteroffensive."],
    ["Everlasting Bastion", "ward", "Maintain a protective barrier."],
  ],
  ranger: [
    ["Bow Discipline", "pierce", "A precise armor-piercing shot."],
    ["Twin Arrows", "quick", "Attack every enemy."],
    ["Quarry Mark", "scan", "Reduce a target’s defense."],
    ["Trail Remedy", "heal", "Restore one ally’s HP."],
    ["Hawk Volley", "flurry", "Fire twice at one target."],
    ["Expedition Guard", "ward", "Protect the expedition."],
    ["Wayfinder’s Signal", "coordinated", "Coordinate an attack with allies."],
    ["Ranger’s Reserve", "focus", "Recover MP."],
    ["Storm of Arrows", "quick", "Sweep the enemy formation."],
    ["Far Horizon", "pierce", "Master a focused precision shot."],
    ["Wildland Renewal", "heal-all", "Restore the expedition’s HP."],
    ["Endless Trail", "formation", "Prepare the party’s defenses."],
  ],
  rogue: [
    ["Knife Discipline", "pierce", "Target gaps in armor."],
    ["Feint", "scan", "Expose an enemy’s defense."],
    ["Quicksteel", "flurry", "Strike twice before withdrawing."],
    ["Veil Guard", "counter", "Guard and counter."],
    ["Escape Step", "ward", "Cover the party’s movement."],
    ["Precision Finish", "power", "A powerful single-target attack."],
    ["Ambush Orders", "coordinated", "Coordinate a decisive opening."],
    ["Rogue’s Reserve", "focus", "Restore MP."],
    ["Shadow Sweep", "quick", "Strike across the enemy line."],
    ["Nightglass Edge", "pierce", "Master armor penetration."],
    ["Phantom Flurry", "flurry", "Deliver two precise hits."],
    [
      "Perfect Opening",
      "formation",
      "Prepare companions to withstand retaliation.",
    ],
  ],
  mage: [
    ["Aether Control", "fire", "Concentrate magic on one enemy."],
    ["Ember Arc", "area", "Strike every enemy with magic."],
    ["Analyze Sigil", "scan", "Read and weaken a defense."],
    ["Mana Recall", "focus", "Restore your MP."],
    ["Rune Barrier", "ward", "Guard all allies."],
    ["Cinder Seal", "burn", "Inflict burning over three rounds."],
    ["Confluence", "hybrid", "Combine physical and arcane force."],
    ["Shared Reservoir", "focus-all", "Restore party MP."],
    ["Starfall", "area", "An advanced area spell."],
    ["Astral Focus", "fire", "Master concentrated magic."],
    ["Celestial Ward", "formation", "Raise the party’s defense."],
    ["Infinite Formula", "focus-all", "Sustain the party’s MP reserve."],
  ],
  cleric: [
    ["Restorative Prayer", "heal", "Restore HP to one living ally."],
    ["Sheltering Light", "ward", "Guard all allies."],
    ["Mercy’s Reach", "heal-all", "Restore HP to the party."],
    ["Steady Counsel", "focus", "Restore your MP."],
    ["Encouraging Word", "rally", "Raise party attack and magic."],
    ["Sanctuary", "bulwark", "Protect allies and draw attacks."],
    ["Shared Resolve", "focus-all", "Restore the party’s MP."],
    ["Radiant Edge", "hybrid", "A physical and magical strike."],
    ["Watchful Care", "formation", "Raise party defense."],
    ["Great Restoration", "heal-all", "Master party healing."],
    ["Light of Courage", "rally", "Prepare the party’s offense."],
    ["Enduring Ministry", "focus-all", "Sustain the whole party."],
  ],
  bard: [
    ["Battle Rhythm", "rally", "Raise party attack and magic."],
    ["Ballad of Recovery", "heal", "Restore an ally’s HP."],
    ["Distracting Verse", "scan", "Lower an enemy’s defense."],
    ["Refrain of Clarity", "focus-all", "Restore party MP."],
    ["Warning Call", "ward", "Protect the party."],
    ["Conductor’s Cue", "coordinated", "Lead a coordinated attack."],
    ["March of Courage", "formation", "Raise party defense."],
    ["Restful Chorus", "heal-all", "Recover the party’s HP."],
    ["Resonant Note", "fire", "Focus magic on an enemy."],
    ["Grand Performance", "rally", "Master party inspiration."],
    ["Unbroken Chorus", "focus-all", "Keep the party’s MP flowing."],
    ["Worldsong Reprise", "heal-all", "Sustain the party’s HP."],
  ],
  artificer: [
    ["Field Tools", "heal", "Repair an ally’s HP."],
    ["Spark Coil", "fire", "Discharge magic at one enemy."],
    ["Volatile Charge", "burn", "Inflict a three-round burn."],
    ["Shield Emitter", "ward", "Guard the party."],
    ["Diagnostic Lens", "scan", "Find and weaken enemy defenses."],
    ["Overload Array", "area", "Discharge magic over the enemy line."],
    ["Mana Cell", "focus", "Recharge your MP."],
    ["Linked Circuit", "focus-all", "Recharge party MP."],
    ["Adaptive Plating", "formation", "Raise party defense."],
    ["Grand Device", "hybrid", "Combine mechanical and magical force."],
    ["Restoration Engine", "heal-all", "Restore the whole party."],
    ["Perpetual Circuit", "focus-all", "Sustain the party’s MP supply."],
  ],
};
const levels = [1, 5, 5, 10, 10, 15, 25, 25, 40, 60, 80, 100],
  costs = [4, 6, 6, 8, 8, 10, 12, 12, 16, 20, 24, 30];
const parents = [[], [0], [0], [1], [2], [0], [3], [4], [5], [6], [7], [8]];
const positions = [
  [540, 1040],
  [230, 860],
  [850, 860],
  [150, 650],
  [930, 650],
  [540, 820],
  [240, 450],
  [840, 450],
  [540, 580],
  [150, 230],
  [930, 230],
  [540, 180],
];
const fighterPositions = [
  [800, 1000],
  [420, 1050],
  [1180, 1050],
  [180, 900],
  [1420, 900],
  [800, 700],
  [180, 600],
  [1420, 600],
  [800, 450],
  [180, 300],
  [1420, 300],
  [800, 200],
];
export const EXPANDED_SKILLS: Skill[] = [];
for (const a of ARCHETYPES) {
  const practice = (c: Character) =>
    c.completions.filter(
      (o) =>
        (!o.scope || o.scope === "class" || o.scope === "subclass") &&
        CLASSES.find((p) => p.id === o.classId)?.mix[a.id],
    ).length;
  techniques[a.id].forEach(([name, combat, description], i) =>
    EXPANDED_SKILLS.push({
      id: `arc-${a.id}-${i + 1}`,
      name,
      description,
      stat: a.stat,
      category: "class",
      branch: a.name,
      owner: a.id,
      archetype: a.id,
      parents: i >= 9 ? [] : parents[i].map((n) => `arc-${a.id}-${n + 1}`),
      anyParents:
        i >= 9
          ? [parents[i][0], 5].map((n) => `arc-${a.id}-${n + 1}`)
          : undefined,
      x: (a.id === "fighter" ? fighterPositions : positions)[i][0],
      y: (a.id === "fighter" ? fighterPositions : positions)[i][1],
      cost: costs[i],
      target: [2, 5, 5, 10, 10, 20, 30, 30, 50, 75, 100, 150][i],
      proof: `Complete ${[2, 5, 5, 10, 10, 20, 30, 30, 50, 75, 100, 150][i]} requests with a class that trains ${a.name}`,
      current: practice,
      tier: "I",
      requiredLevel: levels[i],
      combat,
    }),
  );
}
// Four independent weapon disciplines share the foundation and offer optional cross-training routes.
const martialBranches: [
  string,
  string,
  string[],
  string[],
  [number, number][],
][] = [
  [
    "sword",
    "Swordsmanship",
    ["Sword Guard", "Measured Cut", "Riposte Line", "Master of the Blade"],
    ["ward", "pierce", "counter", "quick"],
    [
      [480, 800],
      [480, 600],
      [480, 400],
      [480, 200],
    ],
  ],
  [
    "spear",
    "Spearcraft",
    ["Spear Reach", "Line Thrust", "Braced Point", "Master of the Spear"],
    ["pierce", "power", "counter", "coordinated"],
    [
      [650, 1200],
      [650, 1400],
      [650, 1600],
      [650, 1800],
    ],
  ],
  [
    "axe",
    "Axe Fighting",
    ["Axe Leverage", "Hooking Strike", "Sundering Arc", "Master of the Axe"],
    ["power", "bash", "pierce", "quick"],
    [
      [950, 1200],
      [950, 1400],
      [950, 1600],
      [950, 1800],
    ],
  ],
  [
    "unarmed",
    "Unarmed Combat",
    [
      "Open-Hand Guard",
      "Combination Strike",
      "Counterstep",
      "Master of the Empty Hand",
    ],
    ["ward", "flurry", "counter", "power"],
    [
      [1120, 800],
      [1120, 600],
      [1120, 400],
      [1120, 200],
    ],
  ],
];
for (const [branch, title, names, effects, coordinates] of martialBranches)
  names.forEach((name, i) => {
    const alternate =
      branch === "sword"
        ? "unarmed"
        : branch === "unarmed"
          ? "sword"
          : branch === "spear"
            ? "axe"
            : "spear";
    EXPANDED_SKILLS.push({
      id: `martial-${branch}-${i + 1}`,
      name,
      description: `${title}: ${["establish a distinct combat approach", "develop a focused follow-up", "exploit the discipline's tactical advantage", "master an advanced adventure technique"][i]}. Applies only in adventures.`,
      stat: "STR",
      category: "class",
      branch: title,
      owner: "fighter",
      archetype: "fighter",
      parents:
        i === 0 ? ["arc-fighter-1"] : i === 2 ? [] : [`martial-${branch}-${i}`],
      anyParents:
        i === 2 ? [`martial-${branch}-2`, `martial-${alternate}-2`] : undefined,
      x: coordinates[i][0],
      y: coordinates[i][1],
      cost: [4, 8, 14, 24][i],
      target: [2, 8, 20, 50][i],
      proof: `Complete ${[2, 8, 20, 50][i]} Fighter class requests`,
      current: (c) =>
        c.completions.filter(
          (o) =>
            o.scope === "class" &&
            !!CLASSES.find((p) => p.id === o.classId)?.mix.fighter,
        ).length,
      tier: "I",
      requiredLevel: [1, 5, 15, 30][i],
      combat: effects[i],
    });
  });
// Focus trees add class identity to the shared archetype foundations.
for (const p of CLASSES) {
  const current = (c: Character) =>
    c.completions.filter(
      (o) =>
        o.classId === p.id &&
        (!o.scope || o.scope === "class" || o.scope === "subclass"),
    ).length;
  const names = [
    `${p.name} Initiation`,
    `${p.signature.name}: Discipline`,
    `${p.signature.name}: Mastery`,
    `${p.name} Legacy`,
  ];
  names.forEach((name, i) =>
    EXPANDED_SKILLS.push({
      id: `focus-${p.id}-${i}`,
      name,
      description:
        i === 0
          ? p.goal
          : `Refine the ${p.name.toLowerCase()} combat style. ${p.signature.description}`,
      stat: p.stat,
      category: "class",
      branch: `${p.name} Focus`,
      owner: p.id,
      parents: i === 1 || i === 2 ? [`focus-${p.id}-0`] : [],
      anyParents: i === 3 ? [`focus-${p.id}-1`, `focus-${p.id}-2`] : undefined,
      x: [540, 320, 760, 540][i],
      y: [680, 450, 450, 160][i],
      cost: [4, 8, 14, 24][i],
      target: [2, 10, 30, 75][i],
      current,
      proof: `Complete ${[2, 10, 30, 75][i]} ${p.name} class requests`,
      tier: "I",
      requiredLevel: [1, 10, 25, 50][i],
      combat: i ? p.signature.effect : undefined,
    }),
  );
}
for (const g of CAREER_CATEGORIES) {
  const current = (c: Character) =>
    c.completions.filter(
      (o) =>
        o.scope === "profession" &&
        (o.careerCategory ||
          (o.id.startsWith("network-")
            ? "technology"
            : o.id.startsWith("analysis-")
              ? "business"
              : careerCategory(o.profession || c.profession).id)) === g.id,
    ).length;
  g.nodes.forEach((name, i) =>
    EXPANDED_SKILLS.push({
      id: `profession-${g.id}-${i}`,
      name,
      description: `${CAREER_GUIDES[g.id][i]}`,
      stat: g.stat,
      category: "profession",
      branch: g.name,
      owner: g.id,
      parents:
        i === 0
          ? []
          : i <= 3
            ? [`profession-${g.id}-0`]
            : i <= 6
              ? [`profession-${g.id}-${i - 3}`]
              : [],
      anyParents:
        i >= 7
          ? [
              `profession-${g.id}-${i - 3}`,
              `profession-${g.id}-${i === 9 ? 4 : i - 2}`,
            ]
          : undefined,
      x: [540, 220, 540, 860, 150, 540, 930, 220, 540, 860][i],
      y: [900, 700, 650, 700, 480, 430, 480, 220, 140, 220][i],
      cost: [4, 6, 6, 8, 8, 10, 10, 14, 18, 24][i],
      target: [2, 5, 5, 10, 10, 20, 20, 35, 55, 80][i],
      current,
      proof: `Complete ${[2, 5, 5, 10, 10, 20, 20, 35, 55, 80][i]} ${g.name} career requests`,
      tier: "I",
      requiredLevel: [1, 5, 5, 10, 10, 15, 15, 25, 40, 60][i],
      nonCombat: true,
    }),
  );
}
