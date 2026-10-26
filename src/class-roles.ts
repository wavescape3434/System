import { CLASSES, ARCHETYPES, classPower } from "./class-catalog";
export const CLASS_ROLES: Record<
  string,
  { role: string; description: string; stance: string }
> = {
  warrior: {
    role: "Vanguard",
    description:
      "Physical damage with shield control and multi-target attacks.",
    stance: "+2 combat STR, +2 defense",
  },
  ranger: {
    role: "Marksman",
    description: "Ranged attacks, armor penetration, and multi-target shots.",
    stance: "+2 combat DEX, attacks ignore 2 defense",
  },
  scholar: {
    role: "Caster",
    description:
      "Single-target magic and area attacks with a larger MP reserve.",
    stance: "+2 combat INT, +10 maximum MP",
  },
  bard: {
    role: "Support",
    description: "Raise party offense, restore allies, and manage MP.",
    stance: "+2 combat CHA, party starts with +5 maximum MP",
  },
  disciple: {
    role: "Healer",
    description: "Healing, barriers, and party recovery.",
    stance: "+2 combat WIS, healing strength +25%",
  },
  sentinel: {
    role: "Defender",
    description: "Guard allies, draw enemy attacks, and survive heavy strikes.",
    stance: "+2 combat CON, +25 maximum HP, +5 defense",
  },
  paladin: {
    role: "Frontline Support",
    description: "Combine physical attacks with healing and party protection.",
    stance: "+2 combat STR, +2 defense, +2 magic",
  },
  sage: {
    role: "Tactician",
    description: "Debuff enemies and use MP efficiently.",
    stance: "+2 combat INT, ability MP costs reduced by 1",
  },
  monk: {
    role: "Skirmisher",
    description: "Multi-hit attacks, self recovery, and defensive counters.",
    stance: "+2 combat DEX, attack gains half combat DEX",
  },
  rogue: {
    role: "Striker",
    description: "Armor-piercing attacks and high single-target damage.",
    stance: "+2 combat DEX, attacks ignore 4 defense",
  },
  artificer: {
    role: "Combat Engineer",
    description: "Area magic, repair, and damage over time.",
    stance: "+2 combat INT, +4 magic",
  },
  marshal: {
    role: "Commander",
    description: "Coordinate party attacks, offense, and defensive formations.",
    stance: "+2 combat CHA, companions gain +2 attack",
  },
};
export const SUBCLASS_TECHNIQUES: Record<
  string,
  [string, string, string, string]
> = {
  "eldritch-knight": [
    "Spellblade",
    "Runic Guard",
    "Arcane Cleave",
    "hybrid,ward,area",
  ],
  warpriest: [
    "Healing Prayer",
    "Consecrated Guard",
    "Merciful Strike",
    "heal,ward,hybrid",
  ],
  guardian: [
    "Interpose",
    "Shield Wall",
    "Guardian Vigil",
    "taunt,ward,bulwark",
  ],
  trailwarden: [
    "Field Recovery",
    "Trail Guard",
    "Enduring March",
    "heal,ward,heal-all",
  ],
  pathfinder: [
    "Mark Target",
    "Opening Shot",
    "Find an Opening",
    "scan,pierce,power",
  ],
  scribe: [
    "Scripture Recall",
    "Steady Counsel",
    "Teach the Word",
    "focus,rally,focus-all",
  ],
  tactician: [
    "Expose Weakness",
    "Coordinated Attack",
    "Battle Plan",
    "scan,coordinated,formation",
  ],
  herald: [
    "Clear Orders",
    "Warning Call",
    "Rallying Address",
    "rally,ward,formation",
  ],
  encourager: [
    "Encouragement",
    "Reassurance",
    "Renewed Courage",
    "heal,ward,heal-all",
  ],
  servant: ["First Aid", "Assist", "Community Support", "heal,rally,heal-all"],
  apologist: [
    "Reasoned Answer",
    "Composure",
    "Confident Witness",
    "scan,guard,rally",
  ],
  ironheart: [
    "Heavy Guard",
    "Counter Strike",
    "Unbroken Line",
    "ward,counter,bulwark",
  ],
  wayfarer: ["Sidestep", "Rescue Step", "Mobile Wall", "counter,heal,ward"],
  oathkeeper: [
    "Oath Strike",
    "Aegis Formation",
    "Stand Firm",
    "hybrid,ward,bulwark",
  ],
  mentor: [
    "Instruction",
    "Correct Course",
    "Shared Insight",
    "rally,focus,focus-all",
  ],
  pugilist: [
    "Combination",
    "Guard Break",
    "Relentless Flurry",
    "flurry,bash,quick",
  ],
  athlete: [
    "Sprint",
    "Second Wind",
    "Peak Performance",
    "quick,heal-self,focus",
  ],
  scout: [
    "Reconnaissance",
    "Marked Shot",
    "Ambush Plan",
    "scan,pierce,formation",
  ],
  duelist: ["Lunge", "Riposte", "Decisive Thrust", "pierce,counter,power"],
  engineer: ["Overload", "Repair", "Field Turret", "area,heal,burn"],
  runewright: [
    "Inscribed Ward",
    "Focused Mark",
    "Greater Ward",
    "ward,scan,bulwark",
  ],
  commander: [
    "Advance",
    "Hold Position",
    "Combined Arms",
    "rally,ward,coordinated",
  ],
  chaplain: [
    "Comfort",
    "Encouraging Prayer",
    "Care Formation",
    "heal,focus,heal-all",
  ],
};
export const COMBAT_EFFECTS: Record<
  string,
  { description: string; mp: number }
> = {
  power: { description: "Heavy physical damage to one enemy.", mp: 4 },
  quick: { description: "Physical damage to all living enemies.", mp: 6 },
  guard: { description: "Guard the party until the enemy round ends.", mp: 5 },
  ward: { description: "Guard the party until the enemy round ends.", mp: 5 },
  heal: {
    description:
      "Restore HP to a living ally using magic and healing strength.",
    mp: 5,
  },
  "heal-self": {
    description: "Restore your own HP. Does not revive a fallen ally.",
    mp: 4,
  },
  "heal-all": { description: "Restore HP to all living party members.", mp: 8 },
  fire: { description: "High magic damage to one enemy.", mp: 5 },
  area: { description: "Magic damage to all living enemies.", mp: 8 },
  rally: {
    description:
      "Raise party attack and magic for this battle; strength scales with combat CHA above 10.",
    mp: 6,
  },
  scan: {
    description: "Lower an enemy’s defense by 3 for this battle.",
    mp: 4,
  },
  pierce: { description: "An armor-piercing physical attack.", mp: 5 },
  flurry: { description: "Strike one enemy twice.", mp: 5 },
  bash: {
    description:
      "Physical damage and stun for one enemy turn. Bosses resist stun.",
    mp: 5,
  },
  taunt: { description: "Guard and draw enemy attacks for two rounds.", mp: 4 },
  bulwark: {
    description: "Guard all allies and draw attacks for two rounds.",
    mp: 8,
  },
  counter: {
    description: "Guard and counter physical attacks this round.",
    mp: 5,
  },
  hybrid: {
    description: "Mixed physical/magic damage and minor self-healing.",
    mp: 6,
  },
  coordinated: {
    description: "Combine your attack with a contribution from living allies.",
    mp: 7,
  },
  formation: {
    description:
      "Raise party attack, magic and defense with combat CHA scaling; guard this round.",
    mp: 10,
  },
  focus: {
    description: "Restore 12 MP and a small amount of your own HP.",
    mp: 4,
  },
  "focus-all": {
    description: "Restore 10 MP to each living party member.",
    mp: 8,
  },
  burn: {
    description: "Magic damage and a damage-over-time effect for three rounds.",
    mp: 8,
  },
};

// The base families also supply combat roles to hybrid and prestige classes.

for (const p of CLASSES) {
  const primary = Object.entries(p.mix).sort((a, b) => b[1]! - a[1]!)[0][0];
  const a = ARCHETYPES.find((a) => a.id === primary)!;
  CLASS_ROLES[p.id] = {
    role: a.role,
    description: p.description,
    stance: `+2 combat ${p.stat}${classPower(p) > 1 ? ` · ${Math.round((classPower(p) - 1) * 100)}% signature potency` : ""}`,
  };
}
