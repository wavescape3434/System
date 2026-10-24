import { validWorld } from "./world-state";
import { PLACES } from "./world-catalog";
import { validMentalFormId } from "./exam-bank";
import { validExam } from "./exams";
import { TASK_RANKS } from "./task-ranks";
import { validAssessment } from "./metrics";
import { VOCATIONS, CAREER_CATEGORIES } from "./careers";
import { ENCOUNTERS, COMPANIONS, EQUIPMENT } from "./rpg";
import type { Character } from "./domain";
import {
  ATTRIBUTES,
  CLASSES,
  PROFESSIONS,
  SKILLS,
  upgradeProgression,
  resolveTakenRequest,
  objectivePeriod,
  upgradeTraining,
  upgradeExams,
  upgradeBalance,
  upgradeCalendar,
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
      (c.trainingVersion === undefined || c.trainingVersion === 3) &&
      (c.examVersion === undefined || c.examVersion === 1) &&
      (c.balanceVersion === undefined || c.balanceVersion === 1) &&
      (c.calendarVersion === undefined || c.calendarVersion === 1) &&
      (c.favoriteRequests === undefined ||
        (Array.isArray(c.favoriteRequests) &&
          c.favoriteRequests.length <= 500 &&
          c.favoriteRequests.every(str))) &&
      (c.rankLegacyCredit === undefined || finite(c.rankLegacyCredit)) &&
      (c.assessmentFormsSeen === undefined ||
        (Array.isArray(c.assessmentFormsSeen) &&
          c.assessmentFormsSeen.every(validMentalFormId))) &&
      (c.notificationsReadAt === undefined || date(c.notificationsReadAt)) &&
      (c.notificationReads === undefined ||
        (Array.isArray(c.notificationReads) &&
          c.notificationReads.length <= 500 &&
          c.notificationReads.every(str))) &&
      (c.exams === undefined ||
        (Array.isArray(c.exams) &&
          new Set(c.exams.map((e) => e.id)).size === c.exams.length &&
          c.exams.every(
            (e) =>
              validExam(e) &&
              (e.scope === "class"
                ? CLASSES.some((p) => p.id === e.owner && p.stat === e.stat)
                : PROFESSIONS.some((p) => p === e.owner)),
          ))) &&
      (c.examGrandfather === undefined ||
        (!!c.examGrandfather &&
          !!c.examGrandfather.classes &&
          !!c.examGrandfather.professions &&
          Object.entries(c.examGrandfather.classes).every(
            ([id, n]) =>
              CLASSES.some((p) => p.id === id) && Number.isInteger(n) && n >= 1,
          ) &&
          Object.entries(c.examGrandfather.professions).every(
            ([name, n]) =>
              PROFESSIONS.some((p) => p === name) &&
              Number.isInteger(n) &&
              n >= 1,
          ))) &&
      (c.baseline?.assessment === undefined ||
        validAssessment(c.baseline.assessment)) &&
      (c.assessmentHistory === undefined ||
        (Array.isArray(c.assessmentHistory) &&
          c.assessmentHistory.every(
            (h) =>
              date(h.at) &&
              validAssessment(h.assessment) &&
              ATTRIBUTES.every((a) => finite(h.stats?.[a]) && h.stats[a] >= 1),
          ))) &&
      (c.preferences === undefined || validPreferences(c.preferences)) &&
      (c.classEntries === undefined ||
        (!!c.classEntries &&
          typeof c.classEntries === "object" &&
          Object.entries(c.classEntries).every(
            ([id, e]) =>
              CLASSES.some((p) => p.id === id) &&
              date(e.at) &&
              finite(e.credit),
          ))) &&
      (c.trainingLegacy === undefined ||
        (validTrainingLegacy(c.trainingLegacy) &&
          c.trainingLegacy.count <= c.completions.length)) &&
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
      (c.takenRequests === undefined ||
        (Array.isArray(c.takenRequests) &&
          new Set(c.takenRequests.map((r) => r.id)).size ===
            c.takenRequests.length &&
          c.takenRequests.every(
            (r) =>
              date(r.takenAt) &&
              str(r.takenPeriod) &&
              r.takenPeriod === objectivePeriod(r, new Date(r.takenAt)) &&
              (r.persistent === undefined ||
                r.persistent === false ||
                (r.persistent === true &&
                  r.cadence === "monthly" &&
                  r.taskVersion === 2 &&
                  r.instanceId === r.takenPeriod)) &&
              (r.instanceId === undefined ||
                (r.persistent === true &&
                  r.cadence === "monthly" &&
                  r.instanceId === r.takenPeriod)) &&
              str(r.title) &&
              str(r.category) &&
              ["daily", "weekly", "monthly"].includes(r.cadence) &&
              CLASSES.some((p) => p.id === r.classId) &&
              PROFESSIONS.includes(r.profession) &&
              (r.vocationId === undefined ||
                VOCATIONS.some((v) => v.id === r.vocationId)) &&
              !!resolveTakenRequest(c, r),
          ))) &&
      (c.journeyEvents === undefined ||
        (Array.isArray(c.journeyEvents) &&
          c.journeyEvents.every(
            (e) =>
              str(e.id) &&
              date(e.at) &&
              [
                "class",
                "profession",
                "vocation",
                "skill",
                "unlock",
                "level",
                "rank",
                "stat",
                "adventure",
                "companion",
                "equipment",
                "request",
              ].includes(e.kind) &&
              str(e.title) &&
              e.title.length <= 250 &&
              (e.detail === undefined ||
                (str(e.detail) && e.detail.length <= 1000)) &&
              (e.amount === undefined || finite(e.amount)) &&
              (e.subject === undefined || str(e.subject)),
          ))) &&
      !!c.baseStats &&
      ATTRIBUTES.every((a) => finite(c.baseStats[a]) && c.baseStats[a] >= 1) &&
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
          (o.cadence === undefined ||
            ["daily", "weekly", "monthly"].includes(o.cadence)) &&
          str(o.id) &&
          str(o.title) &&
          str(o.period) &&
          date(o.at) &&
          finite(o.xp) &&
          o.xp <= 180000 &&
          (o.requestGroup === undefined || str(o.requestGroup)) &&
          (o.bonusXP === undefined ||
            (finite(o.bonusXP) && o.bonusXP <= o.xp)) &&
          (o.gold === undefined ||
            (finite(o.gold) && Number.isInteger(o.gold) && o.gold <= 36000)) &&
          (o.participants === undefined ||
            ["solo", "group"].includes(o.participants)) &&
          (o.trainingMix === undefined ||
            (typeof o.trainingMix === "object" &&
              Object.entries(o.trainingMix).every(
                ([a, n]) =>
                  ATTRIBUTES.some((s) => s === a) && finite(n) && n! <= 1,
              ) &&
              Math.abs(
                Object.values(o.trainingMix).reduce((n, v) => n + v!, 0) - 1,
              ) < 0.001)) &&
          (o.rank === undefined || TASK_RANKS.includes(o.rank)) &&
          (o.classCredits === undefined ||
            (typeof o.classCredits === "object" &&
              Object.entries(o.classCredits).every(
                ([id, xp]) =>
                  CLASSES.some((p) => p.id === id) && finite(xp) && xp <= o.xp,
              ))) &&
          (o.professionCredit === undefined ||
            (str(o.professionCredit.name) &&
              CAREER_CATEGORIES.some(
                (g) => g.id === o.professionCredit!.category,
              ) &&
              finite(o.professionCredit.xp) &&
              o.professionCredit.xp <= o.xp)) &&
          (o.vocationCredit === undefined ||
            (VOCATIONS.some(
              (v) =>
                v.id === o.vocationCredit!.id &&
                v.category === o.vocationCredit!.category,
            ) &&
              finite(o.vocationCredit.xp) &&
              o.vocationCredit.xp <= o.xp)) &&
          (o.trialClass === undefined ||
            CLASSES.some((p) => p.id === o.trialClass)) &&
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
              o.statReward.amount <= 6)) &&
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
  return upgradeCalendar(
    upgradeBalance(upgradeExams(upgradeTraining(upgradeProgression(parsed)))),
  );
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
      (c.world !== undefined && !validWorld(c.world)) ||
      !strings(c.cleared) ||
      !finite(c.gold) ||
      (c.trainingGoldAccrued !== undefined && !finite(c.trainingGoldAccrued)) ||
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
      (b.source === undefined ||
        (PLACES.some((p) => p.id === b.source!.placeId) &&
          ["stage", "wild", "roaming-boss", "ambush"].includes(
            b.source.kind,
          ))) &&
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

function validPreferences(p: NonNullable<Character["preferences"]>) {
  return (
    !!p &&
    ["metric", "imperial"].includes(p.units) &&
    ["standard", "large"].includes(p.textSize) &&
    typeof p.reduceMotion === "boolean" &&
    typeof p.showLockedRequests === "boolean" &&
    ["guild", "objectives", "journey"].includes(p.defaultPage) &&
    Array.isArray(p.equipment) &&
    p.equipment.every((s) =>
      ["bodyweight", "pullup-bar", "weights", "gym"].includes(s),
    )
  );
}
function validTrainingLegacy(p: NonNullable<Character["trainingLegacy"]>) {
  return (
    !!p &&
    Number.isInteger(p.count) &&
    p.count >= 0 &&
    !!p.earnedStats &&
    ATTRIBUTES.every((a) => finite(p.earnedStats[a])) &&
    !!p.classLevels &&
    Object.entries(p.classLevels).every(
      ([id, lv]) =>
        CLASSES.some((p) => p.id === id) && Number.isInteger(lv) && lv >= 1,
    ) &&
    !!p.professionLevels &&
    Object.values(p.professionLevels).every(
      (lv) => Number.isInteger(lv) && lv >= 1,
    )
  );
}
