import type { Character, Skill } from "./domain";
import { CLASSES, ARCHETYPES } from "./class-catalog";
import { SKILLS } from "./skill-catalog";
import { CAREER_CATEGORIES, careerCategory } from "./careers";
import { skillStyle } from "./skill-atlas";
export type TreeCategory = "class" | "profession" | "universal";
export interface PlanLocation {
  category: TreeCategory;
  branch: string;
}
export interface SkillPlans {
  version: 1;
  goals: Record<string, string>;
  locations: Record<string, PlanLocation>;
  views: Record<string, { style: string; listMode: boolean }>;
}
const empty = (): SkillPlans => ({
  version: 1,
  goals: {},
  locations: {},
  views: {},
});
export function skillTreeKey(s: Skill): string {
  return s.category === "universal"
    ? "universal"
    : s.category === "class"
      ? s.archetype
        ? `class:${s.archetype}`
        : `focus:${s.owner}`
      : `profession:${s.owner}`;
}
const trees = new Set(SKILLS.filter((s) => !s.legacy).map(skillTreeKey));
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
function validLocation(classId: string, value: unknown): value is PlanLocation {
  const p = CLASSES.find((p) => p.id === classId),
    v = value as PlanLocation;
  return (
    !!p &&
    !!v &&
    typeof v.branch === "string" &&
    ["class", "universal", "profession"].includes(v.category) &&
    (v.branch === "current" ||
      (v.category === "class"
        ? v.branch === "focus" ||
          ARCHETYPES.some((a) => a.id === v.branch) ||
          (v.branch.startsWith("focus:") &&
            CLASSES.some((other) => other.id === v.branch.slice(6)))
        : v.category === "profession" &&
          [
            "networking",
            "analysis",
            ...CAREER_CATEGORIES.map((g) => g.id),
          ].includes(v.branch)))
  );
}
export function validSkillPlans(value: unknown): value is SkillPlans {
  if (
    !record(value) ||
    value.version !== 1 ||
    !record(value.goals) ||
    !record(value.locations) ||
    !record(value.views)
  )
    return false;
  return (
    Object.entries(value.goals).every(([key, id]) => {
      const s = SKILLS.find(
        (s) =>
          s.id === id && !s.legacy && !s.automatic && s.id !== "universal-root",
      );
      return !!s && skillTreeKey(s) === key;
    }) &&
    Object.entries(value.locations).every(([id, location]) =>
      validLocation(id, location),
    ) &&
    Object.entries(value.views).every(([key, v]) => {
      if (
        !trees.has(key) ||
        !record(v) ||
        typeof v.listMode !== "boolean" ||
        typeof v.style !== "string"
      )
        return false;
      const list = SKILLS.filter((s) => !s.legacy && skillTreeKey(s) === key);
      return (
        v.style === "all" || list.some((s) => skillStyle(s, list) === v.style)
      );
    })
  );
}
export function planLocation(c: Character): PlanLocation {
  return (
    c.skillPlans?.locations[c.activeClass] || {
      category: "class",
      branch: "current",
    }
  );
}
export function activeTreeKey(
  c: Character,
  location = planLocation(c),
): string {
  if (location.category === "universal") return "universal";
  if (location.category === "profession")
    return `profession:${location.branch === "current" ? careerCategory(c.profession).id : location.branch}`;
  const p = CLASSES.find((p) => p.id === c.activeClass)!;
  return location.branch.startsWith("focus:")
    ? location.branch
    : location.branch === "focus"
      ? `focus:${p.id}`
      : `class:${location.branch === "current" ? Object.entries(p.mix).sort((a, b) => b[1]! - a[1]!)[0][0] : location.branch}`;
}
export function setPlanGoal(c: Character, key: string, id: string): Character {
  const s = SKILLS.find((s) => s.id === id);
  if (
    !trees.has(key) ||
    (id &&
      (!s ||
        s.legacy ||
        s.automatic ||
        s.id === "universal-root" ||
        skillTreeKey(s) !== key))
  )
    return c;
  const plan = c.skillPlans || empty();
  if ((plan.goals[key] || "") === id) return c;
  const goals = { ...plan.goals };
  if (id) goals[key] = id;
  else delete goals[key];
  return { ...c, skillPlans: { ...plan, goals } };
}
export function setPlanLocation(
  c: Character,
  location: PlanLocation,
): Character {
  if (!validLocation(c.activeClass, location)) return c;
  const plan = c.skillPlans || empty();
  return {
    ...c,
    skillPlans: {
      ...plan,
      locations: { ...plan.locations, [c.activeClass]: location },
    },
  };
}
export function setPlanView(
  c: Character,
  key: string,
  patch: Partial<{ style: string; listMode: boolean }>,
): Character {
  const plan = c.skillPlans || empty(),
    next = {
      ...plan,
      views: {
        ...plan.views,
        [key]: {
          ...(plan.views[key] || { style: "all", listMode: false }),
          ...patch,
        },
      },
    };
  return validSkillPlans(next) ? { ...c, skillPlans: next } : c;
}
export function migrateSkillPlans(
  c: Character,
  source?: Pick<Storage, "getItem">,
): Character {
  if (c.skillPlans) return c;
  let next = { ...c, skillPlans: empty() };
  try {
    const storage = source || globalThis.sessionStorage;
    for (const p of [
      ...CLASSES.filter((p) => p.id !== c.activeClass),
      CLASSES.find((p) => p.id === c.activeClass)!,
    ]) {
      const base = `guild.view.${c.id}.${p.id}.tree`,
        read = (key: string) => {
          try {
            return JSON.parse(storage.getItem(`${base}.${key}`) || "null");
          } catch {
            return null;
          }
        };
      const id = read("goal"),
        s = SKILLS.find((s) => s.id === id);
      if (s) next = setPlanGoal(next, skillTreeKey(s), s.id) as typeof next;
      const category = read("category"),
        branch = read("branch") || "current";
      if (validLocation(p.id, { category, branch }))
        next.skillPlans.locations[p.id] = { category, branch };
      const listMode = read("list");
      if (typeof listMode === "boolean") {
        const context = { ...next, activeClass: p.id };
        next = setPlanView(next, activeTreeKey(context), {
          listMode,
        }) as typeof next;
      }
    }
  } catch {
    /* Invalid or unavailable old session data never blocks a character save. */
  }
  return next;
}
