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
const parents = [
  [],
  [0],
  [0],
  [1],
  [2],
  [3, 4],
  [5],
  [5],
  [6, 7],
  [8],
  [9],
  [10],
];
const positions = [
  [540, 1040],
  [290, 920],
  [790, 920],
  [290, 800],
  [790, 800],
  [540, 680],
  [290, 560],
  [790, 560],
  [540, 440],
  [290, 320],
  [540, 200],
  [790, 80],
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
      parents: parents[i].map((n) => `arc-${a.id}-${n + 1}`),
      x: positions[i][0],
      y: positions[i][1],
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
      parents: i ? [`focus-${p.id}-${i - 1}`] : [],
      x: [540, 320, 760, 540][i],
      y: [680, 470, 280, 90][i],
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
      description: `${CAREER_GUIDES[g.id][i]} This is a non-combat competency.`,
      stat: g.stat,
      category: "profession",
      branch: g.name,
      owner: g.id,
      parents:
        i === 0
          ? []
          : i === 7
            ? [`profession-${g.id}-5`, `profession-${g.id}-6`]
            : [
                `profession-${g.id}-${i === 1 || i === 2 ? 0 : i === 3 || i === 4 ? i - 2 : i === 5 || i === 6 ? i - 2 : i - 1}`,
              ],
      x: [540, 290, 790, 290, 790, 290, 790, 540, 540, 540][i],
      y: [1040, 900, 900, 760, 760, 620, 620, 480, 340, 200][i],
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
