import type { Character } from "./domain";
import { checkpointUnits } from "./task-ranks";
import { careerCategory, VOCATIONS } from "./careers";

type Rows = Character["completions"];
// Runtime histories are immutable. Array length also guards append-only fixtures.
const cache = new WeakMap<
  Rows,
  { length: number; offset: number; value: ReturnType<typeof buildLedger> }
>();
function buildLedger(rows: Rows, offset: number) {
  const value = {
    total: 0,
    gold: 0,
    universal: 0,
    combat: 0,
    classes: new Map<string, number>(),
    ownClasses: new Map<string, number>(),
    professions: new Map<string, number>(),
    careers: new Map<string, number>(),
    vocations: new Map<string, number>(),
    classWork: new Map<string, number>(),
    professionWork: new Map<string, number>(),
  };
  const add = (
    map: Map<string, number>,
    id: string | undefined,
    xp: number,
  ) => {
    if (id) map.set(id, (map.get(id) || 0) + xp);
  };
  rows.forEach((o, index) => {
    value.total += o.xp;
    value.gold += o.gold || 0;
    if (!o.scope || o.scope === "class" || o.scope === "subclass") {
      add(value.classes, o.classId, o.xp);
      add(value.ownClasses, o.classId, o.xp);
      value.combat += o.xp;
    }
    for (const [id, xp] of Object.entries(o.classCredits || {}))
      add(value.classes, id, xp);
    if (o.scope === "universal") {
      value.universal += o.xp;
      value.combat += o.classCredits?.[o.classId] || 0;
    }
    if (o.scope === "profession") {
      add(value.professions, o.profession, o.xp);
      const category =
        o.careerCategory ||
        (o.id.startsWith("network-")
          ? "technology"
          : o.id.startsWith("analysis-")
            ? "business"
            : careerCategory(o.profession || "Undecided").id);
      add(value.careers, category, o.xp);
      if (
        VOCATIONS.some(
          (v) => v.id === o.vocationId && v.category === o.careerCategory,
        )
      )
        add(value.vocations, o.vocationId, o.xp);
    }
    if (o.professionCredit) {
      add(value.professions, o.professionCredit.name, o.professionCredit.xp);
      add(value.careers, o.professionCredit.category, o.professionCredit.xp);
    }
    if (o.vocationCredit) {
      add(value.vocations, o.vocationCredit.id, o.vocationCredit.xp);
      if (o.professionCredit?.category !== o.vocationCredit.category)
        add(value.careers, o.vocationCredit.category, o.vocationCredit.xp);
    }
    if (index >= offset) {
      if (o.scope === "class" && !o.trialClass)
        add(value.classWork, o.classId, checkpointUnits(o.rank));
      if (o.scope === "profession")
        add(value.professionWork, o.profession, checkpointUnits(o.rank));
    }
  });
  return value;
}
export function progressionLedger(c: Character) {
  const rows = c.completions,
    offset = c.trainingLegacy?.count || 0,
    saved = cache.get(rows);
  if (saved && saved.length === rows.length && saved.offset === offset)
    return saved.value;
  const value = buildLedger(rows, offset);
  cache.set(rows, { length: rows.length, offset, value });
  return value;
}

export function progressionChanged(a: Character | null, b: Character) {
  return (
    !a ||
    a.id !== b.id ||
    a.completions !== b.completions ||
    a.exams !== b.exams ||
    a.certificates !== b.certificates ||
    a.baseStats !== b.baseStats ||
    a.classEntries !== b.classEntries ||
    a.legacyProgress !== b.legacyProgress ||
    a.trainingLegacy !== b.trainingLegacy ||
    a.examGrandfather !== b.examGrandfather ||
    a.activeClass !== b.activeClass ||
    a.profession !== b.profession ||
    a.vocation !== b.vocation ||
    a.subclass !== b.subclass ||
    a.unlockedClasses !== b.unlockedClasses ||
    a.earnedSkills !== b.earnedSkills
  );
}
