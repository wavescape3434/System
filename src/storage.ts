import { VOCATIONS, CAREER_CATEGORIES } from "./careers";
import { ENCOUNTERS, COMPANIONS, EQUIPMENT } from "./rpg";
import type { Character } from "./domain";
import {
  ATTRIBUTES,
  CLASSES,
  PROFESSIONS,
  SKILLS,
  upgradeProgression,
} from "./domain";
export const STORAGE_KEY = "the-guild.character.v1";
const finite = (x: unknown) =>
  typeof x === "number" && Number.isFinite(x) && x >= 0;
const str = (x: unknown) => typeof x === "string";
const date = (x: unknown) => str(x) && Number.isFinite(Date.parse(x as string));
export function validateCharacter(x: unknown): x is Character {
  try {
    if (!x || typeof x !== "object") return false;
    const c = x as Character;
    const path = CLASSES.find((p) => p.id === c.activeClass);
    return (
      c.version === 1 &&
      str(c.id) &&
      str(c.name) &&
      c.name.length <= 32 &&
      str(c.title) &&
      date(c.createdAt) &&
      !!path &&
      (c.subclass === null ||
        CLASSES.some((p) => p.subclasses.some((s) => s.id === c.subclass))) &&
      PROFESSIONS.includes(c.profession as (typeof PROFESSIONS)[number]) &&
      typeof c.demo === "boolean" &&
      (c.vocation === undefined ||
        c.vocation === null ||
        VOCATIONS.some((v) => v.id === c.vocation)) &&
      (c.unlockedClasses === undefined ||
        (Array.isArray(c.unlockedClasses) &&
          c.unlockedClasses.every((id) => CLASSES.some((p) => p.id === id)))) &&
      (c.progressionVersion === undefined || c.progressionVersion === 2) &&
      (c.legacyProgress === undefined || validLegacy(c.legacyProgress)) &&
      (c.startingRank === undefined ||
        ["F", "E", "D"].includes(c.startingRank)) &&
      (c.learnedSkills === undefined ||
        (Array.isArray(c.learnedSkills) &&
          c.learnedSkills.every((id) => SKILLS.some((s) => s.id === id)))) &&
      (c.skillPurchases === undefined ||
        (Array.isArray(c.skillPurchases) &&
          c.skillPurchases.every(
            (p) =>
              str(p.id) &&
              SKILLS.some((s) => s.id === p.id) &&
              str(p.wallet) &&
              finite(p.cost),
          ))) &&
      (c.campaign === undefined || validCampaign(c.campaign)) &&
      !!c.baseStats &&
      ATTRIBUTES.every(
        (a) =>
          finite(c.baseStats[a]) && c.baseStats[a] >= 3 && c.baseStats[a] <= 30,
      ) &&
      !!c.baseline &&
      ["bodyweight", "weights"].includes(c.baseline.mode) &&
      [
        "pushups",
        "squats",
        "balance",
        "walk",
        "reading",
        "reflection",
        "connection",
        "load",
        "reps",
        "bodyweight",
      ].every((k) => finite(c.baseline[k as keyof typeof c.baseline])) &&
      Array.isArray(c.completions) &&
      c.completions.every(
        (o) =>
          str(o.id) &&
          str(o.title) &&
          str(o.period) &&
          date(o.at) &&
          finite(o.xp) &&
          o.xp <= 400 &&
          (o.profession === undefined || str(o.profession)) &&
          (o.careerCategory === undefined ||
            CAREER_CATEGORIES.some((g) => g.id === o.careerCategory)) &&
          (o.vocationId === undefined ||
            VOCATIONS.some((v) => v.id === o.vocationId)) &&
          (o.scope === undefined ||
            ["universal", "class", "subclass", "profession"].includes(
              o.scope,
            )) &&
          (o.statReward === undefined ||
            (ATTRIBUTES.includes(o.statReward.stat) &&
              Number.isInteger(o.statReward.amount) &&
              o.statReward.amount >= 0 &&
              o.statReward.amount <= 3)) &&
          ATTRIBUTES.includes(o.stat) &&
          CLASSES.some((p) => p.id === o.classId),
      ) &&
      new Set(c.completions.map((o) => `${o.id}:${o.period}`)).size ===
        c.completions.length &&
      Array.isArray(c.certificates) &&
      c.certificates.every(
        (s) =>
          str(s.id) &&
          str(s.name) &&
          str(s.issuer) &&
          date(s.date) &&
          str(s.reference),
      ) &&
      Array.isArray(c.journal) &&
      c.journal.every(
        (j) => str(j.id) && date(j.at) && str(j.text) && j.text.length <= 4000,
      ) &&
      Array.isArray(c.relics) &&
      c.relics.every(str) &&
      Array.isArray(c.earnedSkills) &&
      c.earnedSkills.every((id) => SKILLS.some((s) => s.id === id)) &&
      !!c.milestones &&
      typeof c.milestones === "object" &&
      !Array.isArray(c.milestones) &&
      Object.values(c.milestones).every(
        (items) =>
          Array.isArray(items) &&
          items.every((i) => Number.isInteger(i) && i >= 0 && i <= 20),
      )
    );
  } catch {
    return false;
  }
}
export function loadCharacter(): Character | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  const parsed: unknown = JSON.parse(data);
  if (!validateCharacter(parsed))
    throw new Error(
      "Your saved character needs attention. Export or restore a valid backup; your existing data has been kept.",
    );
  return upgradeProgression(parsed);
}
export const saveCharacter = (c: Character) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));

function validCampaign(input: unknown): boolean {
  try {
    if (!input || typeof input !== "object") return false;
    const c = input as import("./rpg").Campaign;
    const strings = (x: unknown) => Array.isArray(x) && x.every(str);
    const inv = (x: unknown) =>
      !!x && typeof x === "object" && Object.values(x).every((n) => finite(n));
    if (
      !strings(c.cleared) ||
      !finite(c.gold) ||
      !inv(c.inventory) ||
      !strings(c.roster) ||
      !c.roster.every((id) => COMPANIONS.some((n) => n.id === id)) ||
      !strings(c.party) ||
      c.party.length > 2 ||
      !c.party.every((id) => c.roster.includes(id)) ||
      !strings(c.equipment) ||
      !c.equipment.every((id) => EQUIPMENT.some((e) => e.id === id)) ||
      !strings(c.equippedSkills) ||
      c.equippedSkills.length > 4 ||
      !c.equippedSkills.every((id) => SKILLS.some((s) => s.id === id)) ||
      new Set(c.equippedSkills).size !== c.equippedSkills.length
    )
      return false;
    if (!c.battle) return true;
    const b = c.battle;
    const units = (arr: unknown) =>
      Array.isArray(arr) &&
      arr.length > 0 &&
      arr.every(
        (u) =>
          u &&
          str(u.id) &&
          str(u.name) &&
          str(u.sprite) &&
          [
            "hp",
            "maxHp",
            "mp",
            "maxMp",
            "attack",
            "magic",
            "defense",
            "speed",
          ].every((k) => finite(u[k])) &&
          u.hp <= u.maxHp &&
          u.mp <= u.maxMp &&
          typeof u.guard === "boolean" &&
          [
            "guardPower",
            "penetration",
            "healing",
            "stun",
            "taunt",
            "burn",
            "burnDamage",
          ].every((k) => u[k] === undefined || finite(u[k])) &&
          (u.counter === undefined || typeof u.counter === "boolean") &&
          Array.isArray(u.abilities) &&
          u.abilities.every(
            (a: Record<string, unknown>) =>
              str(a.id) &&
              str(a.name) &&
              str(a.type) &&
              finite(a.cost) &&
              finite(a.power) &&
              (a.potency === undefined || finite(a.potency)),
          ),
      );
    return (
      str(b.encounterId) &&
      ENCOUNTERS.some((e) => e.id === b.encounterId) &&
      units(b.party) &&
      units(b.enemies) &&
      Number.isInteger(b.actor) &&
      b.actor >= 0 &&
      b.actor < b.party.length &&
      Number.isInteger(b.round) &&
      b.round >= 1 &&
      ["player", "won", "lost", "fled"].includes(b.phase) &&
      strings(b.log) &&
      inv(b.items) &&
      typeof b.claimed === "boolean"
    );
  } catch {
    return false;
  }
}

function validLegacy(p: NonNullable<Character["legacyProgress"]>) {
  return (
    !!p &&
    finite(p.adventurerXP) &&
    !!p.classes &&
    !!p.professions &&
    !!p.stats &&
    !!p.skillPoints &&
    [p.classes, p.professions, p.stats, p.skillPoints].every(
      (x) =>
        typeof x === "object" &&
        !Array.isArray(x) &&
        Object.values(x).every(finite),
    ) &&
    Object.keys(p.classes).every((id) => CLASSES.some((c) => c.id === id)) &&
    Object.keys(p.stats).every((a) =>
      ATTRIBUTES.includes(a as (typeof ATTRIBUTES)[number]),
    )
  );
}
