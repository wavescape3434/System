import {
  SUPPLY_RESTORE,
  SUPPLY_PRICES,
  supplyRecovery,
  supplyQuote,
} from "./supplies";
import type { SupplyId } from "./supplies";
export { SUPPLY_RESTORE, SUPPLY_PRICES } from "./supplies";
import { progressionLedger } from "./progression-ledger";
import {
  characterAppearance,
  COMPANION_APPEARANCES,
} from "./appearance-catalog";
import {
  WORLD_REGIONS,
  WORLD_ENCOUNTERS,
  TOWN_GEAR,
  TOWNS,
  MONSTER_NAMES,
  BOSS_KINDS,
} from "./world-catalog";
import {
  upgradeWorldStages,
  worldEncounterOpen,
  placeProgress,
  regionOpen,
} from "./world-state";
import type { WorldState } from "./world-state";
import { classPower } from "./class-catalog";
import { COMBAT_EFFECTS } from "./class-roles";
import type { Character, Stats } from "./domain";
import { stats, currentPath, adventurerXP, level, period } from "./domain";
import { SKILLS } from "./skill-catalog";
import {
  combatFamily,
  combatProfile,
  resolvedLoadout,
} from "./combat-progression";
import { openingTactics, chargedAttack } from "./enemy-tactics";
export interface AdventureVitals {
  day: string;
  members: Record<
    string,
    { hp: number; mp: number; maxHp: number; maxMp: number }
  >;
}
export interface Campaign {
  vitals?: AdventureVitals;
  cleared: string[];
  gold: number;
  trainingGoldAccrued?: number;
  inventory: Record<string, number>;
  roster: string[];
  party: string[];
  equipment: string[];
  equippedSkills: string[];
  battle?: Battle;
  world?: WorldState;
}
export type Encounter = import("./world-catalog").WorldEncounter;
export const REGIONS = WORLD_REGIONS;
export const ENCOUNTERS: Encounter[] = WORLD_ENCOUNTERS;
export const COMPANIONS = [
  {
    id: "mira",
    name: "Mira",
    role: "Medic",
    description:
      "Restoration and light magic. Assigned to your first expedition.",
    skill: "heal",
    requires: "",
  },
  {
    id: "orin",
    name: "Orin",
    role: "Guardian",
    description: "High defense and a shield attack.",
    skill: "power",
    requires: "mossfall-boss",
  },
  {
    id: "lyra",
    name: "Lyra",
    role: "Ranger",
    description: "Fast attacks and multi-target shots.",
    skill: "quick",
    requires: "quarry-boss",
  },
  {
    id: "gideon",
    name: "Gideon",
    role: "Scholar",
    description: "Magic damage and enemy analysis.",
    skill: "fire",
    requires: "ruins-boss",
  },
  {
    id: "nessa",
    name: "Nessa",
    role: "Tide Warden",
    description: "Party barriers and steady support.",
    skill: "ward",
    requires: "coast-boss",
  },
  {
    id: "toma",
    name: "Toma",
    role: "Fen Scout",
    description: "Armor-piercing attacks and quick positioning.",
    skill: "pierce",
    requires: "fen-boss",
  },
  {
    id: "elara",
    name: "Elara",
    role: "Winter Guardian",
    description: "Draws enemy attacks away from vulnerable allies.",
    skill: "taunt",
    requires: "frost-boss",
  },
] as const;
export interface Equipment {
  id: string;
  name: string;
  slot: "weapon" | "armor" | "accessory";
  price: number;
  mod: Partial<Stats>;
  description: string;
}
const LEGACY_EQUIPMENT: Equipment[] = [
  {
    id: "training-sword",
    name: "Training Sword",
    slot: "weapon",
    price: 0,
    mod: { STR: 1 },
    description: "+1 combat STR",
  },
  {
    id: "iron-sword",
    name: "Iron Sword",
    slot: "weapon",
    price: 75,
    mod: { STR: 3 },
    description: "+3 combat STR",
  },
  {
    id: "oak-staff",
    name: "Oak Staff",
    slot: "weapon",
    price: 75,
    mod: { INT: 3 },
    description: "+3 combat INT",
  },
  {
    id: "shortbow",
    name: "Shortbow",
    slot: "weapon",
    price: 90,
    mod: { DEX: 3 },
    description: "+3 combat DEX",
  },
  {
    id: "runed-blade",
    name: "Runed Blade",
    slot: "weapon",
    price: 300,
    mod: { STR: 4, INT: 2 },
    description: "+4 combat STR, +2 combat INT",
  },
  {
    id: "travel-clothes",
    name: "Travel Clothes",
    slot: "armor",
    price: 0,
    mod: { CON: 1 },
    description: "+1 combat CON",
  },
  {
    id: "leather-armor",
    name: "Leather Armor",
    slot: "armor",
    price: 80,
    mod: { CON: 3, DEX: 1 },
    description: "+3 combat CON, +1 combat DEX",
  },
  {
    id: "steel-armor",
    name: "Steel Armor",
    slot: "armor",
    price: 220,
    mod: { CON: 6 },
    description: "+6 combat CON",
  },
  {
    id: "scholar-robes",
    name: "Scholar Robes",
    slot: "armor",
    price: 180,
    mod: { INT: 3, WIS: 2 },
    description: "+3 combat INT, +2 combat WIS",
  },
  {
    id: "focus-charm",
    name: "Focus Charm",
    slot: "accessory",
    price: 120,
    mod: { INT: 2, WIS: 2 },
    description: "+2 combat INT, +2 combat WIS",
  },
  {
    id: "trail-ring",
    name: "Trail Ring",
    slot: "accessory",
    price: 120,
    mod: { DEX: 2, CON: 2 },
    description: "+2 combat DEX, +2 combat CON",
  },
];
export const EQUIPMENT: Equipment[] = [...LEGACY_EQUIPMENT, ...TOWN_GEAR];
export function newCampaign(): Campaign {
  return {
    cleared: [],
    gold: 0,
    inventory: {
      potion: 3,
      ether: 1,
      "training-sword": 1,
      "travel-clothes": 1,
    },
    roster: ["mira"],
    party: ["mira"],
    equipment: ["training-sword", "travel-clothes"],
    equippedSkills: [],
  };
}
export const campaign = (c: Character, now = new Date()): Campaign => {
  let data = c.campaign || newCampaign();
  const day = period("daily", now);
  const old = data.vitals || {
    day,
    members: Object.fromEntries(
      (data.battle?.party || []).map((u) => [u.id, vitalRecord(u)]),
    ),
  };
  if (day > old.day) {
    const members: AdventureVitals["members"] = {};
    const battle = data.battle
      ? {
          ...data.battle,
          party: data.battle.party.map((u) => ({
            ...u,
            hp: u.maxHp,
            mp: u.maxMp,
          })),
        }
      : undefined;
    if (battle?.phase === "player" && data.battle!.party[battle.actor].hp === 0)
      battle.actor = 0;
    data = { ...data, vitals: { day, members }, ...(battle ? { battle } : {}) };
  } else if (!data.vitals) data = { ...data, vitals: old };
  const earned = progressionLedger(c).gold;
  return {
    ...data,
    equippedSkills: resolvedLoadout(
      c.earnedSkills,
      data.equippedSkills,
      SKILLS,
    ),
    gold: data.gold + Math.max(0, earned - (data.trainingGoldAccrued || 0)),
    trainingGoldAccrued: earned,
    ...(c.calendarVersion === 1 ? { world: upgradeWorldStages(data) } : {}),
  };
};
export function toggleEquippedSkill(c: Character, id: string): Character {
  const data = campaign(c),
    s = SKILLS.find((s) => s.id === id);
  if (
    !s ||
    !c.earnedSkills.includes(id) ||
    s.automatic ||
    s.nonCombat ||
    id === "universal-root" ||
    data.battle?.phase === "player"
  )
    return c;
  const upgraded = resolvedLoadout(c.earnedSkills, [id], SKILLS)[0];
  const family = combatFamily(s);
  const equipped = data.equippedSkills.some(
    (key) => combatFamily(SKILLS.find((s) => s.id === key)!) === family,
  );
  if (!equipped && data.equippedSkills.length >= 4) return c;
  return {
    ...c,
    campaign: {
      ...data,
      equippedSkills: equipped
        ? data.equippedSkills.filter(
            (key) => combatFamily(SKILLS.find((s) => s.id === key)!) !== family,
          )
        : [...data.equippedSkills, upgraded],
    },
  };
}
export function combatAttributes(c: Character): Stats {
  const result = { ...stats(c) };
  result[currentPath(c).stat] += 2;
  for (const id of campaign(c).equipment) {
    const item = EQUIPMENT.find((x) => x.id === id);
    if (item)
      for (const [a, n] of Object.entries(item.mod))
        result[a as keyof Stats] += n!;
  }
  for (const id of campaign(c).equippedSkills) {
    const s = SKILLS.find((x) => x.id === id);
    if (
      s &&
      c.earnedSkills.includes(id) &&
      !s.automatic &&
      !s.nonCombat &&
      s.id !== "universal-root"
    )
      result[s.stat] += combatProfile(s).statBonus;
  }
  return result;
}
export interface Ability {
  id: string;
  name: string;
  type: string;
  cost: number;
  power: number;
  potency?: number;
  description?: string;
  rank?: number;
}
const ability = (id: string, name: string, type: string): Ability => ({
  id,
  name,
  type,
  cost: COMBAT_EFFECTS[type]?.mp || 5,
  power: type === "fire" ? 1.6 : type === "power" ? 1.8 : 1.2,
});
export interface Unit {
  id: string;
  name: string;
  sprite: string;
  appearance?: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  magic: number;
  defense: number;
  speed: number;
  guard: boolean;
  guardPower?: number;
  abilities: Ability[];
  boss?: boolean;
  penetration?: number;
  healing?: number;
  support?: number;
  stun?: number;
  taunt?: number;
  counter?: boolean;
  counterPower?: number;
  shell?: number;
  chargeEvery?: number;
  chargeMultiplier?: number;
  cleave?: boolean;
  burn?: number;
  burnDamage?: number;
}
export interface Battle {
  encounterId: string;
  party: Unit[];
  enemies: Unit[];
  actor: number;
  round: number;
  phase: "player" | "won" | "lost" | "fled";
  log: string[];
  items: Record<string, number>;
  claimed: boolean;
  source?: {
    placeId: string;
    kind: "stage" | "wild" | "roaming-boss" | "ambush";
  };
}
const enemyNames = MONSTER_NAMES;
export function encounterAvailable(c: Character, id: string): boolean {
  return worldEncounterOpen(campaign(c), id);
}
function vitalRecord(u: Unit) {
  return { hp: u.hp, mp: u.mp, maxHp: u.maxHp, maxMp: u.maxMp };
}
function storeVitals(data: Campaign, party: Unit[]): AdventureVitals {
  return {
    day: data.vitals!.day,
    members: {
      ...data.vitals!.members,
      ...Object.fromEntries(party.map((u) => [u.id, vitalRecord(u)])),
    },
  };
}
export function refreshAdventure(c: Character, now = new Date()): Character {
  if (
    !c.campaign ||
    (c.campaign.vitals && c.campaign.vitals.day >= period("daily", now))
  )
    return c;
  return { ...c, campaign: campaign(c, now) };
}
export function adventureParty(c: Character, now = new Date()): Unit[] {
  const data = campaign(c, now),
    s = combatAttributes(c),
    lv = level(adventurerXP(c)),
    path = currentPath(c),
    mix = path.mix;
  const maxHp = 40 + s.CON * 5 + Math.round((25 * (mix.guardian || 0)) / 100),
    maxMp =
      12 +
      s.INT * 2 +
      s.WIS +
      Math.round((10 * (mix.mage || 0) + 5 * (mix.bard || 0)) / 100);
  const hero: Unit = {
    id: "hero",
    name: c.name,
    sprite: c.activeClass,
    appearance: characterAppearance(c).id,
    hp: maxHp,
    maxHp,
    mp: maxMp,
    maxMp,
    attack:
      7 +
      s.STR * 2 +
      s.DEX +
      Math.floor(((s.DEX / 2) * (mix.rogue || 0)) / 100),
    magic: 6 + s.INT * 2 + s.WIS + Math.round((4 * (mix.artificer || 0)) / 100),
    defense:
      2 +
      Math.floor(s.CON * 0.8) +
      Math.round((5 * (mix.guardian || 0) + 2 * (mix.fighter || 0)) / 100),
    speed: 5 + s.DEX,
    guard: false,
    penetration: Math.round(
      (4 * (mix.rogue || 0) + 2 * (mix.ranger || 0)) / 100,
    ),
    healing: 1 + (0.25 * (mix.cleric || 0)) / 100,
    support: 1 + Math.max(0, s.CHA - 10) / 20,
    abilities: [
      {
        ...ability(
          `signature-${path.id}`,
          path.signature.name,
          path.signature.effect,
        ),
        potency: classPower(path),
      },
      ...campaign(c).equippedSkills.flatMap((id) => {
        const skill = SKILLS.find((s) => s.id === id);
        return skill?.combat && !skill.nonCombat && c.earnedSkills.includes(id)
          ? [
              {
                ...ability(id, skill.name, skill.combat),
                cost: combatProfile(skill).mp,
                potency: combatProfile(skill).potency,
                rank: combatProfile(skill).rank,
                description: combatProfile(skill).description,
              },
            ]
          : [];
      }),
    ],
  };
  if (c.activeClass === "sage")
    for (const skill of hero.abilities)
      skill.cost = Math.max(1, skill.cost - 1);
  const companions = campaign(c)
    .party.filter((id) => campaign(c).roster.includes(id))
    .slice(0, 2)
    .flatMap((id) => {
      const npc = COMPANIONS.find((n) => n.id === id);
      if (!npc) return [];
      const hp = 60 + lv * 12,
        mp = 20 + lv * 5 + (c.activeClass === "bard" ? 5 : 0);
      return [
        {
          id,
          name: npc.name,
          sprite: id,
          appearance: COMPANION_APPEARANCES[id],
          hp,
          maxHp: hp,
          mp,
          maxMp: mp,
          attack: 15 + lv * 3 + (c.activeClass === "marshal" ? 2 : 0),
          magic: 18 + lv * 4,
          defense: id === "orin" ? 12 + lv * 2 : 5 + lv,
          speed: 9 + lv + (id === "lyra" ? 5 : 0),
          guard: false,
          abilities: [
            ability(
              `${id}-skill`,
              (
                {
                  heal: "Restore",
                  power: "Shield Bash",
                  quick: "Twin Shot",
                  fire: "Ember Burst",
                  ward: "Tidal Barrier",
                  pierce: "Fenfang Strike",
                  taunt: "Winter Watch",
                } as Record<string, string>
              )[npc.skill],
              npc.skill,
            ),
            ...(id === "mira"
              ? [ability("mira-glimmer", "Glimmer", "fire")]
              : []),
          ],
        },
      ];
    });
  return [hero, ...companions].map((u) => {
    const saved = data.vitals!.members[u.id];
    return saved
      ? {
          ...u,
          hp: Math.min(u.maxHp, saved.hp),
          mp: Math.min(u.maxMp, saved.mp),
        }
      : u;
  });
}
export function encounterEnemies(id: string): Unit[] {
  const e = ENCOUNTERS.find((e) => e.id === id);
  if (!e) return [];
  return e.enemies.map((kind, i) => {
    const boss = BOSS_KINDS.has(kind),
      hp = (boss ? 105 : 38) + e.tier * (boss ? 28 : 12);
    return {
      id: `${kind}-${i}`,
      name: enemyNames[kind] || kind,
      sprite: kind,
      hp,
      maxHp: hp,
      mp: 0,
      maxMp: 0,
      attack: 9 + e.tier * 5 + (boss ? 4 : 0),
      magic: 0,
      defense: 2 + e.tier * 2,
      speed: 7 + e.tier,
      guard: false,
      abilities: [],
      boss,
      ...openingTactics(e.id, i),
    };
  });
}
export function startBattle(
  c: Character,
  id: string,
  now = new Date(),
): Character {
  const data = campaign(c, now);
  if (
    !encounterAvailable(c, id) ||
    data.battle?.phase === "player" ||
    (data.battle?.phase === "won" && !data.battle.claimed)
  )
    return c;
  const party = adventureParty(c, now);
  const actor = party.findIndex((u) => u.hp > 0);
  if (actor < 0) return c;
  const e = ENCOUNTERS.find((x) => x.id === id)!;
  const enemies = encounterEnemies(id);
  let battle: Battle = {
    encounterId: id,
    party,
    enemies,
    actor,
    round: 1,
    phase: "player",
    log: [`Battle started: ${e.name}.`],
    items: { ...campaign(c).inventory },
    claimed: false,
    source: { placeId: e.placeId, kind: e.kind },
  };
  if (
    data.world?.areas[e.placeId]?.last?.kind === "ambush" &&
    data.world.areas[e.placeId].last?.encounterId === id
  ) {
    battle.source = { placeId: e.placeId, kind: "ambush" };
    battle.log.push("Ambush! The enemy strikes first.");
    battle = enemyVolley(battle);
  }
  return {
    ...c,
    campaign: {
      ...data,
      battle,
      vitals: storeVitals(data, battle.party),
      ...(data.world
        ? {
            world: {
              ...data.world,
              townId: REGIONS.find((r) => r.id === e.region)!.town,
              placeId: e.placeId,
              expedition: e.placeId,
            },
          }
        : {}),
    },
  };
}
export const SHELL_BREAK_EFFECTS = [
  "power",
  "quick",
  "fire",
  "area",
  "burn",
  "pierce",
  "bash",
  "hybrid",
  "coordinated",
] as const;
export const breaksShellImmediately = (type: string) =>
  type === "scan" || (SHELL_BREAK_EFFECTS as readonly string[]).includes(type);
export interface Action {
  kind: "attack" | "guard" | "ability" | "potion" | "ether" | "flee";
  target: number;
  abilityId?: string;
}
export function takeAction(input: Battle, action: Action): Battle {
  if (input.phase !== "player") return input;
  const b = structuredClone(input),
    actor = b.party[b.actor];
  let potency = 1;
  let breaksShell = false;
  if (!actor || actor.hp <= 0) return input;
  const hit = (target: Unit, raw: number) => {
    const shielded = (target.shell || 0) > 0;
    if (shielded) {
      target.shell = breaksShell ? 0 : Math.max(0, target.shell! - 1);
      if (!target.shell) b.log.push(`${target.name}'s shell breaks.`);
    }
    const damage = Math.max(
      1,
      Math.round(
        (raw * potency * (shielded && !breaksShell ? 0.55 : 1) -
          Math.max(0, target.defense - (actor.penetration || 0))) *
          (target.guard ? 0.45 / (target.guardPower || 1) : 1),
      ),
    );
    target.hp = Math.max(0, target.hp - damage);
    b.log.push(`${actor.name} → ${target.name}: ${damage} damage.`);
  };
  if (action.kind === "flee") {
    b.phase = "fled";
    b.log.push("Party retreated. Used items are not restored.");
    return b;
  }
  if (action.kind === "attack") {
    const target = b.enemies[action.target];
    if (!target || target.hp <= 0) return input;
    hit(target, actor.attack);
  } else if (action.kind === "guard") {
    actor.guard = true;
    actor.guardPower = 1;
    actor.mp = Math.min(actor.maxMp, actor.mp + 3);
    b.log.push(`${actor.name} guards and restores 3 MP.`);
  } else if (action.kind === "potion" || action.kind === "ether") {
    const target = b.party[action.target];
    if (
      !target ||
      target.hp <= 0 ||
      !(b.items[action.kind] > 0) ||
      !supplyRecovery(target, action.kind)
    )
      return input;
    b.items[action.kind]--;
    if (action.kind === "potion")
      target.hp = Math.min(target.maxHp, target.hp + SUPPLY_RESTORE.potion);
    else target.mp = Math.min(target.maxMp, target.mp + SUPPLY_RESTORE.ether);
    b.log.push(`${actor.name} uses ${action.kind} on ${target.name}.`);
  } else {
    const skill = actor.abilities.find((x) => x.id === action.abilityId);
    if (!skill || actor.mp < skill.cost) return input;
    const target =
      skill.type === "heal" ? b.party[action.target] : b.enemies[action.target];
    if (!target || target.hp <= 0) return input;
    actor.mp -= skill.cost;
    potency = skill.potency || 1;
    breaksShell = (SHELL_BREAK_EFFECTS as readonly string[]).includes(
      skill.type,
    );
    b.log.push(`${actor.name} uses ${skill.name}.`);
    const restore = (ally: Unit, scale: number) => {
      const amount = Math.round(
        actor.magic * scale * (actor.healing || 1) * potency,
      );
      ally.hp = Math.min(ally.maxHp, ally.hp + amount);
      b.log.push(`${ally.name}: +${amount} HP.`);
    };
    if (skill.type === "heal") restore(target, 1.3);
    else if (skill.type === "heal-self") restore(actor, 1.15);
    else if (skill.type === "heal-all")
      for (const ally of b.party.filter((p) => p.hp > 0)) restore(ally, 0.85);
    else if (["guard", "ward", "bulwark"].includes(skill.type)) {
      for (const ally of b.party.filter((p) => p.hp > 0)) {
        ally.guard = true;
        ally.guardPower = potency;
      }
      if (skill.type === "bulwark") actor.taunt = Math.ceil(2 * potency);
    } else if (skill.type === "taunt") {
      actor.guard = true;
      actor.taunt = Math.ceil(2 * potency);
      actor.guardPower = potency;
    } else if (skill.type === "counter") {
      actor.guard = true;
      actor.counter = true;
      actor.counterPower = potency;
      actor.guardPower = potency;
    } else if (skill.type === "rally" || skill.type === "formation")
      for (const ally of b.party.filter((p) => p.hp > 0)) {
        ally.attack += Math.round(
          (skill.type === "formation" ? 3 : 2) * potency * (actor.support || 1),
        );
        ally.magic += Math.round(2 * potency * (actor.support || 1));
        if (skill.type === "formation") {
          ally.defense += Math.round(2 * potency * (actor.support || 1));
          ally.guard = true;
          ally.guardPower = potency;
        }
      }
    else if (skill.type === "scan") {
      const reduction = Math.round(3 * potency);
      target.defense = Math.max(0, target.defense - reduction);
      if (target.shell) {
        target.shell = 0;
        b.log.push(`${target.name}'s shell breaks.`);
      }
      b.log.push(`${target.name}: defense -${reduction}.`);
    } else if (skill.type === "focus" || skill.type === "focus-all") {
      for (const ally of skill.type === "focus"
        ? [actor]
        : b.party.filter((p) => p.hp > 0)) {
        const amount = Math.round((skill.type === "focus" ? 12 : 10) * potency);
        ally.mp = Math.min(ally.maxMp, ally.mp + amount);
        b.log.push(`${ally.name}: +${amount} MP.`);
      }
      if (skill.type === "focus") restore(actor, 0.35);
    } else if (skill.type === "quick" || skill.type === "area")
      for (const enemy of b.enemies.filter((p) => p.hp > 0))
        hit(
          enemy,
          skill.type === "quick" ? actor.attack * 0.9 : actor.magic * 1.1,
        );
    else if (skill.type === "pierce")
      hit(target, actor.attack * 1.2 + target.defense);
    else if (skill.type === "flurry") {
      hit(target, actor.attack * 0.8);
      if (target.hp > 0) hit(target, actor.attack * 0.8);
    } else if (skill.type === "bash") {
      hit(target, actor.attack * 1.15);
      if (!target.boss) target.stun = 1;
      else b.log.push(`${target.name} resists stun.`);
    } else if (skill.type === "hybrid") {
      hit(target, actor.attack * 0.85 + actor.magic * 0.6);
      restore(actor, 0.25);
    } else if (skill.type === "coordinated")
      hit(
        target,
        actor.attack +
          b.party
            .filter((p) => p.hp > 0 && p.id !== actor.id)
            .reduce((n, p) => n + p.attack * 0.4, 0),
      );
    else if (skill.type === "burn") {
      hit(target, actor.magic * 0.9);
      target.burn = 3;
      target.burnDamage = Math.max(1, Math.round(actor.magic * 0.3 * potency));
    } else
      hit(
        target,
        (skill.type === "fire" ? actor.magic : actor.attack) * skill.power,
      );
  }

  if (b.enemies.every((x) => x.hp === 0)) {
    b.phase = "won";
    b.log.push("Victory. Claim expedition rewards.");
    return b;
  }
  let next = b.actor + 1;
  while (next < b.party.length && b.party[next].hp === 0) next++;
  if (next < b.party.length) {
    b.actor = next;
    b.log = b.log.slice(-30);
    return b;
  }
  return enemyVolley(b);
}
export function enemyVolley(b: Battle): Battle {
  for (let i = 0; i < b.enemies.length; i++) {
    const enemy = b.enemies[i];
    if (enemy.hp === 0) continue;
    if ((enemy.burn || 0) > 0) {
      enemy.burn!--;
      enemy.hp = Math.max(0, enemy.hp - (enemy.burnDamage || 1));
      b.log.push(`${enemy.name} takes ${enemy.burnDamage || 1} burn damage.`);
      if (enemy.hp === 0) continue;
    }
    if ((enemy.stun || 0) > 0) {
      enemy.stun!--;
      b.log.push(`${enemy.name} is stunned.`);
      continue;
    }
    const living = b.party.filter((x) => x.hp > 0);
    if (!living.length) break;
    const charged = chargedAttack(enemy, b.round);
    const targets =
      charged && enemy.cleave
        ? living
        : [
            living.find((p) => (p.taunt || 0) > 0) ||
              living[(b.round + i) % living.length],
          ];
    for (const target of targets) {
      const damage = Math.max(
        1,
        Math.round(
          (enemy.attack * (charged ? enemy.chargeMultiplier || 1.6 : 1) -
            target.defense) *
            (target.guard ? 0.45 / (target.guardPower || 1) : 1),
        ),
      );
      target.hp = Math.max(0, target.hp - damage);
      b.log.push(
        `${enemy.name}${charged ? (enemy.cleave ? " uses Briar Cleave on" : " uses Heavy Strike on") : " attacks"} ${target.name}: ${damage} damage.`,
      );
      if (target.counter && target.hp > 0) {
        const amount = Math.max(
          1,
          Math.round(target.attack * (target.counterPower || 1)) -
            enemy.defense,
        );
        enemy.hp = Math.max(0, enemy.hp - amount);
        b.log.push(`${target.name} counters: ${amount} damage.`);
        if (enemy.hp === 0) break;
      }
    }
  }
  for (const ally of b.party) {
    ally.guard = false;
    ally.guardPower = 1;
    ally.counter = false;
    ally.counterPower = 1;
    if ((ally.taunt || 0) > 0) ally.taunt!--;
  }
  if (b.enemies.every((x) => x.hp === 0) && b.party.some((p) => p.hp > 0)) {
    b.phase = "won";
    b.log.push("Victory. Claim expedition rewards.");
  } else if (b.party.every((x) => x.hp === 0)) {
    b.phase = "lost";
    b.log.push("Party defeated. No real-world progress is lost.");
  } else {
    b.actor = b.party.findIndex((x) => x.hp > 0);
    b.round++;
    b.log.push(`Round ${b.round}.`);
  }
  b.log = b.log.slice(-30);
  return b;
}
export function act(c: Character, action: Action, now = new Date()): Character {
  const data = campaign(c, now);
  const old = data.battle;
  if (!old) return c;
  const battle = takeAction(old, action);
  if (old === battle) return c;
  return {
    ...c,
    campaign: {
      ...data,
      battle,
      vitals: storeVitals(data, battle.party),
      inventory: { ...battle.items },
    },
  };
}
export function claimVictory(c: Character): Character {
  const data = campaign(c),
    b = data.battle;
  if (!b || b.phase !== "won" || b.claimed) return c;
  const e = ENCOUNTERS.find((x) => x.id === b.encounterId)!;
  const inventory = { ...data.inventory };
  if (data.world)
    for (const [id, n] of Object.entries(e.loot))
      inventory[id] = (inventory[id] || 0) + n;
  else inventory.potion = (inventory.potion || 0) + 1;
  let world = data.world;
  if (world) {
    const kills = { ...world.kills };
    for (const enemy of e.enemies)
      kills[`${e.placeId}:${enemy}`] =
        (kills[`${e.placeId}:${enemy}`] || 0) + 1;
    const old = placeProgress(world, e.placeId),
      roaming = e.kind === "roaming-boss";
    world = {
      ...world,
      journal: old.last
        ? world.journal.map((event) =>
            event.id === old.last!.id
              ? { ...event, resolved: true, text: `Victory: ${e.name}` }
              : event,
          )
        : world.journal,
      kills: {
        ...kills,
        [e.placeId]: (world.kills[e.placeId] || 0) + e.enemies.length,
      },
      areas: {
        ...world.areas,
        [e.placeId]: {
          ...old,
          ...(roaming
            ? {
                pendingBoss: false,
                ignored: 0,
                sinceBoss: 0,
                bossVictories: old.bossVictories + 1,
              }
            : {}),
          ...(old.last
            ? {
                last: {
                  ...old.last,
                  resolved: true,
                  text: `Victory: ${e.name}`,
                },
              }
            : {}),
        },
      },
    };
  }
  return {
    ...c,
    relics: e.id.endsWith("-boss")
      ? [...new Set([...c.relics, `${e.region}-sigil`])]
      : c.relics,
    campaign: {
      ...data,
      cleared: [...new Set([...data.cleared, e.id])],
      gold: data.gold + e.gold,
      inventory,
      battle: { ...b, claimed: true },
      ...(world ? { world } : {}),
    },
  };
}

export function buy(c: Character, id: string, quantity = 1): Character {
  const data = campaign(c),
    item = EQUIPMENT.find((x) => x.id === id),
    price =
      item?.price ??
      (id === "potion" || id === "ether" ? SUPPLY_PRICES[id] : Infinity);
  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 99 ||
    (item && quantity !== 1) ||
    !!data.battle ||
    data.gold < price * quantity ||
    (item && data.inventory[id])
  )
    return c;
  let world = data.world;
  const inventory = { ...data.inventory };
  if (world) {
    const town = TOWNS.find((t) => t.id === world!.townId)!,
      gear = TOWN_GEAR.find((g) => g.id === id);
    if (!regionOpen(data, town.region)) return c;
    if (gear) {
      if (
        gear.town !== town.id ||
        (inventory[gear.material] || 0) < gear.quantity
      )
        return c;
      inventory[gear.material] -= gear.quantity;
    } else if (id === "potion" || id === "ether") {
      if (
        !supplyQuote(data.gold, world.stock[town.id]?.[id] || 0, id, quantity)
          .canBuy
      )
        return c;
      world = {
        ...world,
        stock: {
          ...world.stock,
          [town.id]: {
            ...world.stock[town.id],
            [id]: world.stock[town.id][id] - quantity,
          },
        },
      };
    } else return c;
  }
  return {
    ...c,
    campaign: {
      ...data,
      gold: data.gold - price * quantity,
      inventory: { ...inventory, [id]: (inventory[id] || 0) + quantity },
      ...(world ? { world } : {}),
    },
  };
}
export function useSupply(
  c: Character,
  targetId: string,
  id: SupplyId,
): Character {
  if (id !== "potion" && id !== "ether") return c;
  const data = campaign(c);
  if (data.battle || !(data.inventory[id] > 0)) return c;
  const party = adventureParty(c),
    target = party.find((u) => u.id === targetId);
  if (!target || !supplyRecovery(target, id)) return c;
  const changed = party.map((u) =>
    u.id !== targetId
      ? u
      : {
          ...u,
          ...(id === "potion"
            ? { hp: u.hp + supplyRecovery(u, id) }
            : { mp: u.mp + supplyRecovery(u, id) }),
        },
  );
  return {
    ...c,
    campaign: {
      ...data,
      inventory: { ...data.inventory, [id]: data.inventory[id] - 1 },
      vitals: storeVitals(data, changed),
    },
  };
}
export function equip(c: Character, id: string): Character {
  const data = campaign(c),
    item = EQUIPMENT.find((x) => x.id === id);
  if (!item || !data.inventory[id] || data.battle?.phase === "player") return c;
  return {
    ...c,
    campaign: {
      ...data,
      equipment: [
        ...data.equipment.filter(
          (old) => EQUIPMENT.find((x) => x.id === old)?.slot !== item.slot,
        ),
        id,
      ],
    },
  };
}
