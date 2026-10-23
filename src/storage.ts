import type { Character } from "./domain";
import { ATTRIBUTES, CLASSES, PROFESSIONS, SKILLS } from "./domain";
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
        path.subclasses.some((s) => s.id === c.subclass)) &&
      PROFESSIONS.includes(c.profession as (typeof PROFESSIONS)[number]) &&
      typeof c.demo === "boolean" &&
      !!c.baseStats &&
      ATTRIBUTES.every(
        (a) =>
          finite(c.baseStats[a]) && c.baseStats[a] >= 3 && c.baseStats[a] <= 18,
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
  return parsed;
}
export const saveCharacter = (c: Character) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
