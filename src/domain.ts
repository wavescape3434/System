import { refineTrainingGuidance } from "./training-guidance";
import { progressionLedger } from "./progression-ledger";
import { validWorkoutPrescription } from "./training-prescriptions";
import { workoutSummary } from "./training-regimen";
import {
  calendarGoal,
  adventureConditionMet,
  adventureBonus,
} from "./calendar-goals";
import { extraObjectives, decorateRequest } from "./objective-catalog";
import { guildRankThreshold, oldGuildRankThreshold } from "./request-balance";
import { RANK_METALS } from "./rank-metals";
import { certifiedLevel } from "./exam-rules";
import type { ExamRecord } from "./exam-rules";
import { assessedStats } from "./metrics";
import type { Assessment } from "./metrics";
import type { Preferences } from "./preferences";
import { DEFAULT_PREFERENCES } from "./preferences";
import {
  rankedObjectives,
  entryTrial,
  taskRequirements,
} from "./training-tasks";
import { milestonePoints, TASK_GOLD } from "./task-ranks";
import type { TaskRank } from "./task-ranks";
import type { JourneyEvent } from "./journey-events";
import { levelFromXP, xpForLevel, statMilestones } from "./progression";
import { CAREER_CATEGORIES, VOCATIONS, careerCategory } from "./careers";
import { SKILLS } from "./skill-catalog";
import type { Skill } from "./skill-catalog";
import { professionGroup } from "./professions";
export const ATTRIBUTES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;
export type Attribute = (typeof ATTRIBUTES)[number];
export type Stats = Record<Attribute, number>;
export type Cadence = "daily" | "weekly" | "monthly";
export interface Baseline {
  assessment?: Assessment;
  mode: "bodyweight" | "weights";
  pushupStyle?: "floor" | "knee" | "incline" | "wall";
  pushups: number;
  squats: number;
  balance: number;
  walk: number;
  reading: number;
  reflection: number;
  connection: number;
  load: number;
  reps: number;
  bodyweight: number;
}
export const EMPTY_BASELINE: Baseline = {
  mode: "bodyweight",
  pushups: 0,
  squats: 0,
  balance: 0,
  walk: 0,
  reading: 0,
  reflection: 0,
  connection: 0,
  load: 0,
  reps: 0,
  bodyweight: 0,
};
import { CLASSES } from "./class-catalog";
import type { ClassPath } from "./class-catalog";
export { CLASSES } from "./class-catalog";
export type { ClassPath } from "./class-catalog";
export function subclassRequirements(
  c: Character,
  sub: ClassPath["subclasses"][number],
): string[] {
  const p = currentPath(c),
    missing: string[] = [];
  if (classLevel(c, p.id) < (sub.minClassLevel || 3))
    missing.push(`${p.name} level ${sub.minClassLevel || 3}`);
  for (const [a, n] of Object.entries(sub.requirements || {}))
    if (stats(c)[a as Attribute] < n!) missing.push(`${a} ${n}`);
  for (const id of sub.requiredSkills || [])
    if (!c.earnedSkills.includes(id))
      missing.push(`Skill: ${SKILLS.find((s) => s.id === id)?.name || id}`);
  return missing;
}
export function selectSubclass(c: Character, id: string | null): Character {
  if (id === null) return { ...c, subclass: null };
  const sub = currentPath(c).subclasses.find((s) => s.id === id);
  if (!sub || subclassRequirements(c, sub).length) return c;
  return { ...c, subclass: id };
}
export { PROFESSIONS } from "./professions";
export interface Objective {
  workout?: import("./training-prescriptions").WorkoutPrescription;
  gold?: number;
  trainingMix?: Partial<Record<Attribute, number>>;
  participants?: "solo" | "group";
  id: string;
  title: string;
  description: string;
  cadence: Cadence;
  stat: Attribute;
  xp: number;
  minutes: string;
  category: string;
  kind?: "fitness" | "class-trial";
  rank?: TaskRank;
  taskVersion?: 2;
  targetClass?: string;
  family?: string;
  equipment?: "bodyweight" | "pullup-bar" | "weights";
  cooldownHours?: number;
  minimumPullups?: number;
  minimumDays?: number;
  minimumSessions?: number;
  calendarBound?: boolean;
  preparationDays?: number;
  preparationSessions?: number;
  requestGroup?: string;
  groupTitle?: string;
  tags?: string[];
  adventureRequirement?: string;
  adventureBonus?: { contractId: string; xp: number; gold: number };
  persistent?: boolean;
  instanceId?: string;
  practice?: {
    family?: string;
    classId?: string;
    careerCategory?: string;
    minimumRank?: TaskRank;
    workoutOnly?: boolean;
  };
  once?: boolean;
  careerCategory?: string;
  checklist?: string[];
  scope?: "universal" | "class" | "subclass" | "profession";
  statReward?: { stat: Attribute; amount: number };
}
const CORE: Record<string, [string, string, string, string]> = {
  warrior: [
    "Strength session",
    "Perform a controlled strength session using wall, knee, or floor pushups, squats, or your usual weighted routine. Stop before form breaks.",
    "Three strength sessions",
    "Complete three strength sessions with recovery days. Record the exercises and repetitions.",
  ],
  ranger: [
    "Walk and mobility",
    "Take a comfortable walk and practice balance or mobility for 5 minutes.",
    "Explore a route",
    "Complete three walks and explore one new safe route.",
  ],
  scholar: [
    "Focused study",
    "Study for 20 minutes, then write three points from memory.",
    "Apply a concept",
    "Complete three study sessions and apply one concept to a small project.",
  ],
  bard: [
    "Conversation practice",
    "Have a conversation in which you ask questions and summarize what the other person says.",
    "Presentation practice",
    "Prepare and deliver a short presentation. Ask for one specific piece of feedback.",
  ],
  disciple: [
    "Bible study",
    "Read a Bible passage in context. Note its meaning and one practical application.",
    "Scripture and service",
    "Study a Bible chapter and complete one practical act of service.",
  ],
  sentinel: [
    "Conditioning session",
    "Complete a comfortable walk or low-impact conditioning session. Record duration.",
    "Conditioning plan",
    "Complete three conditioning sessions and review your recovery and sleep.",
  ],
  paladin: [
    "Strength and prayer",
    "Complete an appropriate strength session and set aside 5 minutes for Christian prayer.",
    "Training and service",
    "Complete three strength sessions and help someone with a practical need.",
  ],
  sage: [
    "Research and reflection",
    "Study a topic for 25 minutes. Record evidence, questions, and an explanation in your own words.",
    "Teach a topic",
    "Research a topic, check sources, and teach the main ideas to someone.",
  ],
  monk: [
    "Movement control",
    "Practice controlled bodyweight movement and mobility for 15 minutes.",
    "Bodyweight routine",
    "Complete three technique-focused bodyweight sessions. Review form and recovery.",
  ],
  rogue: [
    "Agility and planning",
    "Practice gentle coordination drills and solve a logic or route-planning problem.",
    "Precision practice",
    "Complete three coordination sessions and document one planning exercise.",
  ],
  artificer: [
    "Technical practice",
    "Build, configure, repair, or prototype something small. Document and test the result.",
    "Build a prototype",
    "Finish a small practical project with requirements and validation notes.",
  ],
  marshal: [
    "Leadership practice",
    "Plan a shared task, clarify responsibilities, or ask a teammate for specific feedback.",
    "Coordinate a project",
    "Organize a small shared project. Record the plan, decisions, and outcome.",
  ],
};
export interface TakenRequest extends Objective {
  trainingContext?: import("./training-prescriptions").TrainingPlan;
  takenAt: string;
  takenPeriod: string;
  classId: string;
  profession: string;
  vocationId?: string;
}
export interface Completion {
  workout?: import("./training-prescriptions").WorkoutPrescription;
  result?: import("./activity-results").ActivityResult;
  gold?: number;
  requestGroup?: string;
  bonusXP?: number;
  trainingMix?: Partial<Record<Attribute, number>>;
  participants?: "solo" | "group";
  rank?: TaskRank;
  taskVersion?: 2;
  family?: string;
  cooldownHours?: number;
  classCredits?: Record<string, number>;
  professionCredit?: { name: string; category: string; xp: number };
  vocationCredit?: { id: string; category: string; xp: number };
  trialClass?: string;
  cadence?: Cadence;
  id: string;
  period: string;
  at: string;
  xp: number;
  stat: Attribute;
  classId: string;
  title: string;
  profession?: string;
  scope?: "universal" | "class" | "subclass" | "profession";
  subclassId?: string;
  careerCategory?: string;
  vocationId?: string;
  statReward?: { stat: Attribute; amount: number };
}
export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  reference: string;
}
export interface JournalEntry {
  id: string;
  at: string;
  text: string;
}
export interface Character {
  trainingPlan?: import("./training-prescriptions").TrainingPlan;
  skillPlans?: import("./skill-plans").SkillPlans;
  version: 1;
  id: string;
  name: string;
  title: string;
  createdAt: string;
  baseline: Baseline;
  baseStats: Stats;
  activeClass: string;
  appearance?: string;
  subclass: string | null;
  profession: string;
  vocation?: string | null;
  unlockedClasses?: string[];
  progressionVersion?: 2;
  trainingVersion?: 3;
  examVersion?: 1;
  balanceVersion?: 1;
  calendarVersion?: 1;
  favoriteRequests?: string[];
  rankLegacyCredit?: number;
  exams?: ExamRecord[];
  examGrandfather?: {
    classes: Record<string, number>;
    professions: Record<string, number>;
  };
  assessmentFormsSeen?: string[];
  notificationsReadAt?: string;
  notificationReads?: string[];
  loginRewards?: { day: string; at: string; cycleDay: number }[];
  preferences?: Preferences;
  classEntries?: Record<string, { at: string; credit: number }>;
  trainingLegacy?: {
    count: number;
    classLevels: Record<string, number>;
    professionLevels: Record<string, number>;
    earnedStats: Stats;
  };
  assessmentHistory?: { at: string; assessment: Assessment; stats: Stats }[];
  legacyProgress?: {
    adventurerXP: number;
    classes: Record<string, number>;
    professions: Record<string, number>;
    stats: Partial<Stats>;
    skillPoints: Record<string, number>;
  };
  completions: Completion[];
  takenRequests?: TakenRequest[];
  journeyEvents?: JourneyEvent[];
  certificates: Certificate[];
  journal: JournalEntry[];
  relics: string[];
  earnedSkills: string[];
  milestones: Record<string, number[]>;
  startingRank?: "F" | "E" | "D";
  learnedSkills?: string[];
  skillPurchases?: { id: string; wallet: string; cost: number }[];
  campaign?: import("./rpg").Campaign;
  demo: boolean;
}
const clamp = (n: number, max: number) =>
  Math.max(0, Math.min(max, Number.isFinite(n) ? n : 0));
// Guild scoring benchmarks, not population percentiles or clinical measurements.
export function startingStats(b: Baseline): Stats {
  if (b.assessment?.version === 2) return assessedStats(b.assessment);
  const str =
    b.mode === "weights"
      ? (b.bodyweight > 0
          ? clamp(b.load, 500) / Math.max(30, b.bodyweight)
          : 0) *
        (1 + clamp(b.reps, 30) / 30) *
        9
      : clamp(b.pushups, 120) *
        0.4 *
        { floor: 1, knee: 0.65, incline: 0.45, wall: 0.25 }[
          b.pushupStyle || "floor"
        ];
  return {
    STR: Math.round(3 + Math.min(27, str)),
    DEX: Math.round(3 + Math.min(27, clamp(b.balance, 180) * 0.15)),
    CON: Math.round(
      3 + Math.min(27, clamp(b.walk, 180) * 0.1 + clamp(b.squats, 120) * 0.12),
    ),
    INT: Math.round(3 + Math.min(27, clamp(b.reading, 1200) * 0.025)),
    WIS: Math.round(3 + clamp(b.reflection, 7) * 3),
    CHA: Math.round(3 + Math.min(27, clamp(b.connection, 30) * 0.9)),
  };
}
export function startingRankFor(s: Stats): "F" | "E" | "D" {
  const values = Object.values(s),
    average = values.reduce((a, b) => a + b, 0) / 6;
  // Game placement, not claimed population percentiles. The asymmetric route
  // accommodates short mental checks and the 45-second balance protocol.
  const mental = [s.INT, s.WIS, s.CHA];
  if (
    (average >= 25 && values.filter((n) => n >= 25).length >= 5) ||
    (average >= 18 &&
      s.STR >= 32 &&
      s.CON >= 14 &&
      s.DEX >= 13 &&
      mental.every((n) => n >= 14))
  )
    return "D";
  if (
    average >= 14 &&
    s.STR >= 22 &&
    s.CON >= 12 &&
    s.DEX >= 12 &&
    mental.filter((n) => n >= 12).length >= 2
  )
    return "E";
  if (
    average >= 18 &&
    values.filter((n) => n >= 22).length >= 3 &&
    [s.STR, s.DEX, s.CON].filter((n) => n >= 22).length >= 2
  )
    return "E";
  return "F";
}
export const totalXP = (c: Character) => progressionLedger(c).total;
export const level = (xp: number) => levelFromXP(xp, 250);
export const adventurerXP = (c: Character) =>
  totalXP(c) + (c.legacyProgress?.adventurerXP || 0);
const ownClassXP = (c: Character, id: string) =>
  progressionLedger(c).ownClasses.get(id) || 0;
export const classXP = (c: Character, id: string) =>
  (progressionLedger(c).classes.get(id) || 0) +
  (c.classEntries?.[id]?.credit || 0);
export const classTrainingLevel = (c: Character, id: string) => {
  const raw = levelFromXP(
    classXP(c, id) + (c.legacyProgress?.classes[id] || 0),
  );
  if (c.trainingVersion !== 3) return raw;
  const floor = c.trainingLegacy?.classLevels[id] || 1;
  const work = progressionLedger(c).classWork.get(id) || 0;
  return Math.min(raw, floor + work);
};
export const classLevel = (c: Character, id: string) =>
  certifiedLevel(c, "class", id, classTrainingLevel(c, id));
export function classProgress(c: Character, id: string) {
  const lv = classLevel(c, id),
    xp = classXP(c, id) + (c.legacyProgress?.classes[id] || 0);
  const start = xpForLevel(lv),
    next = xpForLevel(lv + 1),
    needed = next - start;
  return {
    current: Math.min(needed, Math.max(0, xp - start)),
    needed,
    waiting: xp >= next && c.trainingVersion === 3,
    examRequired:
      c.examVersion === 1 &&
      classTrainingLevel(c, id) >= lv + 1 &&
      (lv + 1) % 5 === 0,
    banked: Math.max(0, xp - next),
  };
}
export const professionXP = (c: Character, name = c.profession) =>
  progressionLedger(c).professions.get(name) || 0;
export const professionTrainingLevel = (c: Character, name = c.profession) => {
  const raw = levelFromXP(
    professionXP(c, name) + (c.legacyProgress?.professions[name] || 0),
  );
  if (c.trainingVersion !== 3) return raw;
  const floor = c.trainingLegacy?.professionLevels[name] || 1;
  const work = progressionLedger(c).professionWork.get(name) || 0;
  return Math.min(raw, floor + work);
};
export const professionLevel = (c: Character, name = c.profession) =>
  certifiedLevel(c, "profession", name, professionTrainingLevel(c, name));
export const subclassXP = (c: Character, id = c.subclass) =>
  c.completions
    .filter((x) => x.scope === "subclass" && x.subclassId === id)
    .reduce((n, x) => n + x.xp, 0);
export const subclassLevel = (c: Character, id = c.subclass) =>
  1 + Math.floor(subclassXP(c, id) / 100);
function legacyProfessionStat(name: string): Attribute {
  const code = professionGroup(name).code;
  return ["21", "23", "25", "41", "43"].includes(code)
    ? "CHA"
    : ["35", "39", "47", "49", "51"].includes(code)
      ? "DEX"
      : ["33", "37", "45", "53", "55"].includes(code)
        ? "CON"
        : "INT";
}
export const professionStat = (name: string): Attribute =>
  careerCategory(name).stat;
export function stats(c: Character): Stats {
  if (c.trainingVersion === 3) return trainingStats(c);
  const result = { ...c.baseStats };
  for (const p of CLASSES) {
    const milestones = statMilestones(classLevel(c, p.id));
    const balance: Record<string, number> = {};
    for (let i = 0; i < milestones; i++) {
      const id = Object.entries(p.mix).sort(
        ([a, wa], [b, wb]) =>
          (wb! * (i + 1)) / 100 -
          (balance[b] || 0) -
          ((wa! * (i + 1)) / 100 - (balance[a] || 0)),
      )[0][0];
      balance[id] = (balance[id] || 0) + 1;
      result[ARCHETYPE_STAT[id]]++;
    }
  }
  const professions = [
    ...new Set(
      c.completions
        .filter((o) => o.scope === "profession")
        .map((o) => o.profession)
        .filter((x): x is string => !!x),
    ),
  ];
  for (const name of professions)
    result[professionStat(name)] += statMilestones(professionLevel(c, name));
  for (const a of ATTRIBUTES) result[a] += c.legacyProgress?.stats[a] || 0;
  for (const o of c.completions)
    if (o.statReward) result[o.statReward.stat] += o.statReward.amount;
  return result;
}
function distributeStats(result: Stats, p: ClassPath, points: number) {
  const entries = Object.entries(p.mix).map(([id, weight]) => ({
    stat: ARCHETYPE_STAT[id],
    exact: (points * weight!) / 100,
  }));
  let left = points - entries.reduce((n, e) => n + Math.floor(e.exact), 0);
  for (const e of entries) result[e.stat] += Math.floor(e.exact);
  for (const e of entries.sort((a, b) => (b.exact % 1) - (a.exact % 1))) {
    if (left-- <= 0) break;
    result[e.stat]++;
  }
}
function trainingStats(c: Character): Stats {
  const result = { ...c.baseStats };
  for (const a of ATTRIBUTES)
    result[a] += c.trainingLegacy?.earnedStats[a] || 0;
  for (const p of CLASSES) {
    const previous = c.trainingLegacy?.classLevels[p.id] || 1;
    const growth =
      milestonePoints(classLevel(c, p.id)) - milestonePoints(previous);
    if (growth > 0) distributeStats(result, p, growth);
  }
  const names = new Set(
    c.completions
      .flatMap((o) => [o.profession, o.professionCredit?.name])
      .filter((s): s is string => !!s),
  );
  for (const name of names)
    result[professionStat(name)] += Math.max(
      0,
      milestonePoints(professionLevel(c, name)) -
        milestonePoints(c.trainingLegacy?.professionLevels[name] || 1),
    );
  for (const o of c.completions.slice(c.trainingLegacy?.count || 0))
    if (o.statReward) result[o.statReward.stat] += o.statReward.amount;
  return result;
}
export const classRank = (lv: number) =>
  lv >= 100
    ? "Mythic"
    : lv >= 60
      ? "Grandmaster"
      : lv >= 40
        ? "Master"
        : lv >= 25
          ? "Expert"
          : lv >= 15
            ? "Adept"
            : lv >= 5
              ? "Apprentice"
              : "Novice";
// Each promotion costs 2.5 times the previous, beginning at 2,500 XP.
export const RANKS = ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"].map(
  (name, i) => ({ name, metal: RANK_METALS[i], xp: guildRankThreshold(i) }),
);
export const rank = (xp: number) =>
  [...RANKS].reverse().find((r) => xp >= r.xp) || RANKS[0];
export const startingRankCredit = (c: Character) =>
  RANKS.find((r) => r.name === (c.startingRank || "F"))!.xp;
export const rankXP = (c: Character) =>
  totalXP(c) + startingRankCredit(c) + (c.rankLegacyCredit || 0);
export const characterRank = (c: Character) => rank(rankXP(c));
export function qualificationRequirements(
  p: ClassPath,
  s: Stats,
  xp: number,
  c?: Character,
): { label: string; met: boolean }[] {
  return [
    ...Object.entries(p.requirements).map(([a, n]) => ({
      label: `${a} ${n}`,
      met: s[a as Attribute] >= n!,
    })),
    ...(p.minXP ? [{ label: `${p.minXP} total XP`, met: xp >= p.minXP }] : []),
    ...(p.classRequirements || []).map((r) => ({
      label: `${CLASSES.find((p) => p.id === r.id)?.name} Lv. ${r.level}`,
      met: !!c && classLevel(c, r.id) >= r.level,
    })),
    ...(p.requiredSkills || []).map((id) => ({
      label: `Skill: ${SKILLS.find((s) => s.id === id)?.name || id}`,
      met: !!c && c.earnedSkills.includes(id),
    })),
    ...(p.professionCategories?.length
      ? [
          {
            label: `Profession: ${p.professionCategories.map((id) => CAREER_CATEGORIES.find((g) => g.id === id)?.name).join(" / ")}`,
            met:
              !!c &&
              p.professionCategories.includes(careerCategory(c.profession).id),
          },
        ]
      : []),
  ];
}
export function classRequirements(
  p: ClassPath,
  s: Stats,
  xp: number,
  c?: Character,
): { label: string; met: boolean }[] {
  const result = qualificationRequirements(p, s, xp, c);
  if (
    c?.trainingVersion === 3 &&
    !c.unlockedClasses?.includes(p.id) &&
    p.id !== c.activeClass
  )
    result.push({
      label: `${p.name} entry trial`,
      met: c.completions.some((o) => o.trialClass === p.id),
    });
  return result;
}
export function transferableXP(c: Character, id: string): number {
  const p = CLASSES.find((p) => p.id === id);
  if (!p) return 0;
  return Math.floor(
    c.completions
      .filter(
        (o) =>
          o.classId !== id &&
          (!o.scope || o.scope === "class" || o.scope === "universal"),
      )
      .reduce((sum, o) => sum + o.xp * objectiveRelevance(p, o) * 0.25, 0),
  );
}
function classRelevance(p: ClassPath, stat: Attribute) {
  return Object.entries(p.mix).reduce(
    (n, [id, weight]) => n + (ARCHETYPE_STAT[id] === stat ? weight! / 100 : 0),
    0,
  );
}
function objectiveRelevance(
  p: ClassPath,
  o: { stat: Attribute; trainingMix?: Partial<Record<Attribute, number>> },
) {
  return o.trainingMix
    ? Object.entries(o.trainingMix).reduce(
        (n, [stat, weight]) =>
          n + classRelevance(p, stat as Attribute) * weight!,
        0,
      )
    : classRelevance(p, o.stat);
}
export function classCreditRewards(
  c: Character,
  o: Objective,
  target: string,
): Record<string, number> {
  if (c.trainingVersion !== 3) return {};
  const credits: Record<string, number> = {};
  for (const id of c.unlockedClasses || [c.activeClass]) {
    const p = CLASSES.find((p) => p.id === id)!;
    const relevance = objectiveRelevance(p, o);
    if (!relevance || o.scope === "profession") continue;
    if (o.scope === "class" && id === target) continue;
    const value = Math.floor(o.xp * relevance * (id === target ? 0.5 : 0.25));
    if (value) credits[id] = value;
  }
  return credits;
}
export const available = (p: ClassPath, s: Stats, xp: number, c?: Character) =>
  !!c?.unlockedClasses?.includes(p.id) ||
  classRequirements(p, s, xp, c).every((r) => r.met);
const ARCHETYPE_STAT: Record<string, Attribute> = {
  fighter: "STR",
  guardian: "CON",
  ranger: "DEX",
  rogue: "DEX",
  mage: "INT",
  cleric: "WIS",
  bard: "CHA",
  artificer: "INT",
};
export function archetypeXP(c: Character, id: string) {
  return CLASSES.reduce(
    (sum, p) =>
      sum +
      ((c.trainingVersion === 3
        ? Math.min(
            classXP(c, p.id) + (c.legacyProgress?.classes[p.id] || 0),
            xpForLevel(classLevel(c, p.id) + 1) - 1,
          )
        : classXP(c, p.id) + (c.legacyProgress?.classes[p.id] || 0)) *
        (p.mix[id as keyof typeof p.mix] || 0)) /
        100,
    0,
  );
}
export const activeVocation = (c: Character) =>
  VOCATIONS.find((v) => v.id === c.vocation);
export const vocationXP = (c: Character, id = c.vocation) =>
  id ? progressionLedger(c).vocations.get(id) || 0 : 0;
export const vocationLevel = (c: Character, id = c.vocation) =>
  levelFromXP(vocationXP(c, id));
export function careerXP(c: Character, id: string) {
  return progressionLedger(c).careers.get(id) || 0;
}
export const currentPath = (c: Character) =>
  CLASSES.find((p) => p.id === c.activeClass)!;
export function legacyObjectives(c: Character): Objective[] {
  const p = currentPath(c),
    core =
      CORE[p.id] ||
      CORE[
        (
          {
            fighter: "warrior",
            guardian: "sentinel",
            ranger: "ranger",
            rogue: "rogue",
            mage: "scholar",
            cleric: "disciple",
            bard: "bard",
            artificer: "artificer",
          } as Record<string, string>
        )[Object.entries(p.mix).sort((a, b) => b[1]! - a[1]!)[0][0]]
      ];
  const result: Objective[] = [
    {
      id: `${p.id}-daily`,
      title: core[0],
      description: core[1],
      cadence: "daily",
      stat: p.stat,
      xp: 30,
      minutes: "15–20 min",
      category: p.name,
      kind: ["STR", "CON", "DEX"].includes(p.stat) ? "fitness" : undefined,
    },
    {
      id: "reflection-daily",
      title: "Prayer and reflection",
      description:
        "Pause, pray, and write down one thing you are grateful for and one way you can show up better today.",
      cadence: "daily",
      stat: "WIS",
      xp: 20,
      minutes: "5 min",
      category: "Heart",
    },
    {
      id: "profession-daily",
      title:
        c.profession === "Analyst"
          ? "Targeted job application"
          : "Profession practice",
      description:
        c.profession === "Analyst"
          ? "Tailor and submit one application, improve a portfolio work sample, or contact a professional connection."
          : `Spend 20 focused minutes developing your ${c.profession.toLowerCase()} practice. Record what you learned.`,
      cadence: "daily",
      stat: "INT",
      xp: 30,
      minutes: "20 min",
      category: c.profession,
    },
    {
      id: "network-daily",
      title: "Networking study",
      description:
        "Study one CCNA topic or complete a small networking lab. Explain the result in your own words.",
      cadence: "daily",
      stat: "INT",
      xp: 25,
      minutes: "20 min",
      category: "Networking",
    },
    {
      id: `${p.id}-weekly`,
      title: core[2],
      description: core[3],
      cadence: "weekly",
      stat: p.stat,
      xp: 120,
      minutes: "This week",
      category: p.name,
    },
    {
      id: "network-weekly",
      title: "Three networking labs",
      description:
        "Complete three networking labs covering switching, routing, or subnetting. Save your notes and configurations.",
      cadence: "weekly",
      stat: "INT",
      xp: 100,
      minutes: "3 sessions",
      category: "Networking",
    },
    {
      id: `${p.id}-monthly`,
      title: "Monthly training plan",
      description: `Build a sustainable month of ${p.name.toLowerCase()} practice. Complete each milestone before claiming the adventure.`,
      cadence: "monthly",
      stat: p.stat,
      xp: 400,
      minutes: "This month",
      category: p.name,
      checklist: [
        "Complete 12 practice sessions",
        "Reflect on what improved",
        "Set a sustainable next goal",
      ],
    },
    {
      id: "service-monthly",
      title: "Community service project",
      description:
        "Turn Christian faith into practical love. Complete each milestone at your own pace this month.",
      cadence: "monthly",
      stat: "WIS",
      xp: 300,
      minutes: "This month",
      category: "Service",
      checklist: [
        "Identify a practical need",
        "Offer your time or resources",
        "Reflect and pray for the people you served",
      ],
    },
  ];
  const secondary = Object.entries(p.mix).sort((a, b) => b[1]! - a[1]!)[1];
  if (secondary) {
    const source = (
      {
        fighter: "warrior",
        guardian: "sentinel",
        ranger: "ranger",
        rogue: "rogue",
        mage: "scholar",
        cleric: "disciple",
        bard: "bard",
        artificer: "artificer",
      } as Record<string, string>
    )[secondary[0]];
    result.push({
      id: `${p.id}-secondary-daily`,
      title: CORE[source][0],
      description: CORE[source][1],
      cadence: "daily",
      stat: ARCHETYPE_STAT[secondary[0]],
      xp: 25,
      minutes: "15–20 min",
      category: p.name,
      scope: "class",
    });
  }
  const group = professionGroup(c.profession);
  const extra: [string, string, string, Cadence, Attribute, number, string][] =
    [
      [
        "reading-daily",
        "Reading and recall",
        "Read for 15 minutes. Write a summary without looking at the source.",
        "daily",
        "INT",
        20,
        "15 min",
      ],
      [
        "mobility-daily",
        "Mobility practice",
        "Practice gentle, controlled mobility appropriate to your ability.",
        "daily",
        "DEX",
        20,
        "10 min",
      ],
      [
        "connection-daily",
        "Contact someone",
        "Contact a friend, family member, or professional connection and listen to their response.",
        "daily",
        "CHA",
        20,
        "10 min",
      ],
      [
        "service-daily",
        "Practical service",
        "Complete one useful action for another person without expecting a reward.",
        "daily",
        "WIS",
        20,
        "10–20 min",
      ],
      [
        "profession-portfolio-daily",
        "Profession learning",
        group.practice,
        "daily",
        "INT",
        25,
        "20 min",
      ],
      [
        "profession-weekly",
        "Profession project",
        group.project,
        "weekly",
        "INT",
        100,
        "1–2 hours",
      ],
      [
        "profession-application-weekly",
        "Career review",
        "Review three relevant job descriptions. Identify recurring requirements and update one résumé section or skill goal.",
        "weekly",
        "CHA",
        80,
        "45 min",
      ],
      [
        "network-subnet-daily",
        "Subnetting practice",
        "Solve five IPv4 subnetting exercises. Check network, broadcast, and usable address ranges.",
        "daily",
        "INT",
        25,
        "15 min",
      ],
      [
        "network-switch-daily",
        "Switching lab",
        "Configure or simulate VLANs or trunking. Test connectivity and save the configuration.",
        "daily",
        "INT",
        30,
        "25 min",
      ],
      [
        "network-route-daily",
        "Routing lab",
        "Configure or simulate a route. Check the routing table and explain the packet path.",
        "daily",
        "INT",
        30,
        "25 min",
      ],
      [
        "network-lab-weekly",
        "Document a network lab",
        "Build a lab combining addressing, switching, and routing. Save a topology and test results.",
        "weekly",
        "INT",
        100,
        "60 min",
      ],
      [
        "analysis-spreadsheet-daily",
        "Spreadsheet practice",
        "Clean a dataset, write formulas, and check results against a small manual sample.",
        "daily",
        "INT",
        25,
        "20 min",
      ],
      [
        "analysis-sql-daily",
        "SQL practice",
        "Write and test queries using filters, joins, aggregation, or window functions. Explain each result.",
        "daily",
        "INT",
        25,
        "20 min",
      ],
      [
        "analysis-chart-daily",
        "Chart and explanation",
        "Create a chart from a dataset. State the question, conclusion, and limitations.",
        "daily",
        "INT",
        25,
        "20 min",
      ],
      [
        "faith-weekly",
        "Bible chapter review",
        "Read a Bible chapter, note the context, and explain its main teaching and application.",
        "weekly",
        "WIS",
        80,
        "30 min",
      ],
      [
        "profession-monthly",
        "Portfolio project",
        group.project + " Save the finished work and a short review.",
        "monthly",
        "INT",
        350,
        "4 sessions",
      ],
      [
        `${p.id}-technique-daily`,
        `${p.name} technique`,
        core[1] +
          " Spend 10 minutes focusing on technique or reviewing what you learned.",
        "daily",
        p.stat,
        20,
        "10 min",
      ],
      [
        `${p.id}-review-weekly`,
        `${p.name} progress review`,
        "Review your practice log. Identify one improvement, one difficulty, and your next training goal.",
        "weekly",
        p.stat,
        80,
        "20 min",
      ],
      [
        "study-monthly",
        "Complete a learning project",
        "Finish a course unit, technical project, or reading plan. Produce a summary and a practical example.",
        "monthly",
        "INT",
        300,
        "4 sessions",
      ],
    ];
  for (const [id, title, description, cadence, stat, xp, minutes] of extra)
    result.push({
      id,
      title,
      description,
      cadence,
      stat,
      xp,
      minutes,
      category: id.startsWith("profession-")
        ? c.profession
        : id.startsWith("network-")
          ? "Networking"
          : id.startsWith("analysis-")
            ? "Data Analysis"
            : id.startsWith(p.id)
              ? p.name
              : "Universal",
      checklist:
        cadence === "monthly"
          ? [
              "Complete the planned work",
              "Save evidence or notes",
              "Review the result",
            ]
          : undefined,
    });
  const vocation = activeVocation(c);
  if (vocation) {
    result.push({
      id: `vocation-${vocation.id}-daily`,
      title: `${vocation.name} practice`,
      description: vocation.practice,
      cadence: "daily",
      stat: CAREER_CATEGORIES.find((g) => g.id === vocation.category)!.stat,
      xp: 30,
      minutes: "20 min",
      category: vocation.name,
      scope: "profession",
      careerCategory: vocation.category,
    });
    result.push({
      id: `vocation-${vocation.id}-weekly`,
      title: `${vocation.name} field assignment`,
      description: `Complete three focused practice sessions. ${vocation.project}`,
      cadence: "weekly",
      stat: CAREER_CATEGORIES.find((g) => g.id === vocation.category)!.stat,
      xp: 100,
      minutes: "3 sessions",
      category: vocation.name,
      scope: "profession",
      careerCategory: vocation.category,
    });
    result.push({
      id: `vocation-${vocation.id}-monthly`,
      title: `${vocation.name} portfolio commission`,
      description: vocation.project,
      cadence: "monthly",
      stat: CAREER_CATEGORIES.find((g) => g.id === vocation.category)!.stat,
      xp: 350,
      minutes: "4 sessions",
      category: vocation.name,
      scope: "profession",
      careerCategory: vocation.category,
      checklist: [
        "Define the project and acceptance criteria",
        "Complete and validate the work",
        "Save evidence and review the result",
      ],
    });
  }
  for (const o of result) {
    o.scope ??=
      o.id.startsWith("profession-") ||
      o.id.startsWith("network-") ||
      o.id.startsWith("analysis-")
        ? "profession"
        : o.category === p.name
          ? "class"
          : "universal";
    if (o.scope === "profession")
      o.careerCategory ??= o.id.startsWith("network-")
        ? "technology"
        : o.id.startsWith("analysis-")
          ? "business"
          : careerCategory(c.profession).id;
    if (o.id === `${p.id}-monthly`) o.statReward = { stat: p.stat, amount: 1 };
    if (o.id === "profession-monthly")
      o.statReward = { stat: professionStat(c.profession), amount: 1 };
    if (o.id === `${p.id}-review-weekly`)
      o.statReward = { stat: "WIS", amount: 1 };
  }
  // Technical requests follow the selected vocation instead of appearing for every profession.
  const technical =
    vocation?.id === "networking" ||
    careerCategory(c.profession).id === "technology";
  const analytical =
    vocation?.id === "analysis" ||
    vocation?.id === "business-analysis" ||
    careerCategory(c.profession).id === "business";
  const visible = result.filter(
    (o) =>
      (!o.id.startsWith("network-") || technical) &&
      (!o.id.startsWith("analysis-") || analytical),
  );
  return visible;
}
export function objectives(c: Character): Objective[] {
  const legacy = legacyObjectives(c);
  if (c.trainingVersion !== 3) return legacy;
  const tasks = rankedObjectives(c, legacy),
    attributes = stats(c),
    xp = totalXP(c);
  for (const p of CLASSES)
    if (
      !c.unlockedClasses?.includes(p.id) &&
      qualificationRequirements(p, attributes, xp, c).every((r) => r.met)
    ) {
      const trial = entryTrial(c, p.id);
      if (trial) tasks.push(trial);
    }
  return [...tasks, ...(c.calendarVersion === 1 ? extraObjectives(c) : [])].map(
    (raw) => {
      const o = decorateRequest(calendarGoal(c, refineTrainingGuidance(raw)));
      const taken = c.takenRequests?.find((r) => r.id === o.id);
      return o.persistent && taken
        ? { ...o, instanceId: taken.takenPeriod }
        : o;
    },
  );
}
export const objectivePeriod = (o: Objective, now = new Date()) =>
  o.calendarBound
    ? period(o.cadence, now)
    : o.once
      ? "once"
      : o.instanceId || period(o.cadence, now);
export { taskRequirements };
export function period(cadence: Cadence, date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (cadence === "weekly") d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const year = d.getFullYear(),
    month = String(d.getMonth() + 1).padStart(2, "0"),
    day = String(d.getDate()).padStart(2, "0");
  return cadence === "monthly" ? `${year}-${month}` : `${year}-${month}-${day}`;
}
export const isComplete = (c: Character, o: Objective, now = new Date()) =>
  c.completions.some(
    (x) =>
      (x.id === o.id ||
        (!!o.requestGroup && x.requestGroup === o.requestGroup)) &&
      ((o.once && x.id === o.id) ||
        (o.calendarBound
          ? period(o.cadence, new Date(x.at)) === period(o.cadence, now)
          : x.period === objectivePeriod(o, now))),
  );
export function complete(
  c: Character,
  o: Objective,
  now = new Date(),
): Character {
  // Use the stored request context, never reward values supplied by a button caller.
  const taken = c.takenRequests?.find(
    (x) =>
      x.id === o.id &&
      ((x.calendarBound
        ? x.takenPeriod === period(x.cadence, now)
        : x.persistent) ||
        x.takenPeriod === objectivePeriod(x, now)),
  );
  let actual = taken
    ? resolveTakenRequest(c, taken)
    : objectives(c).find((x) => x.id === o.id);
  if (!actual || isComplete(c, actual, now)) return c;
  if (
    actual.adventureRequirement &&
    !adventureConditionMet(c, actual.adventureRequirement, actual.cadence, now)
  )
    return c;
  const bonus = adventureBonus(c, actual, now);
  if (bonus)
    actual = {
      ...actual,
      xp: actual.xp + bonus.xp,
      gold: (actual.gold || 0) + bonus.gold,
    };
  if (actual.taskVersion === 2 && taskRequirements(c, actual, now).length)
    return c;
  const checked =
    c.milestones[`${actual.id}:${objectivePeriod(actual, now)}`] || [];
  if (
    actual.checklist &&
    !actual.checklist.every((_, i) => checked.includes(i))
  )
    return c;
  return {
    ...c,
    ...(actual.targetClass
      ? {
          classEntries: {
            ...(c.classEntries || {}),
            [actual.targetClass]: {
              at: now.toISOString(),
              credit: transferableXP(c, actual.targetClass),
            },
          },
        }
      : {}),
    completions: [
      ...c.completions,
      {
        id: actual.id,
        period: objectivePeriod(actual, now),
        at: now.toISOString(),
        xp: actual.xp,
        ...(actual.requestGroup ? { requestGroup: actual.requestGroup } : {}),
        ...(bonus ? { bonusXP: bonus.xp } : {}),
        ...(c.examVersion === 1
          ? {
              gold:
                actual.gold ??
                (actual.rank
                  ? TASK_GOLD[actual.rank]
                  : Math.max(1, Math.round(actual.xp / 5))),
            }
          : {}),
        ...(actual.trainingMix ? { trainingMix: actual.trainingMix } : {}),
        ...(actual.participants ? { participants: actual.participants } : {}),
        stat: actual.stat,
        classId: actual.targetClass || taken?.classId || c.activeClass,
        title: actual.title,
        cadence: actual.cadence,
        ...(actual.workout ? { workout: actual.workout } : {}),
        profession: taken?.profession || c.profession,
        scope: actual.scope,
        ...(actual.taskVersion === 2
          ? {
              taskVersion: 2 as const,
              rank: actual.rank,
              family: actual.family,
              cooldownHours: actual.cooldownHours,
              classCredits: classCreditRewards(
                c,
                actual,
                actual.targetClass || taken?.classId || c.activeClass,
              ),
            }
          : {}),
        ...(actual.targetClass ? { trialClass: actual.targetClass } : {}),
        ...universalCareerCredits(
          c,
          actual,
          taken?.profession || c.profession,
          taken ? taken.vocationId : c.vocation,
        ),
        ...(actual.scope === "subclass" && c.subclass
          ? { subclassId: c.subclass }
          : {}),
        ...(actual.statReward ? { statReward: actual.statReward } : {}),
        ...(actual.careerCategory
          ? {
              careerCategory: actual.careerCategory,
              vocationId: taken?.vocationId || c.vocation || undefined,
            }
          : {}),
      },
    ],
  };
}
export function universalCareerCredits(
  c: Character,
  o: Objective,
  role = c.profession,
  vocationId = c.vocation,
): Pick<Completion, "professionCredit" | "vocationCredit"> {
  if (o.taskVersion !== 2 || o.scope !== "universal") return {};
  const related = (category: string) => {
    const group = CAREER_CATEGORIES.find((g) => g.id === category)!;
    return (
      (o.trainingMix ? !!o.trainingMix[group.stat] : o.stat === group.stat) ||
      (["STR", "DEX", "CON"].includes(o.stat) &&
        [
          "trades",
          "logistics",
          "agriculture",
          "public-safety",
          "hospitality",
          "manufacturing",
        ].includes(category))
    );
  };
  const category = careerCategory(role).id,
    vocation = VOCATIONS.find((v) => v.id === vocationId);
  const xp = Math.floor(o.xp * 0.25);
  const weighted = (category: string) =>
    o.trainingMix
      ? Math.floor(
          xp *
            (o.trainingMix[
              CAREER_CATEGORIES.find((g) => g.id === category)!.stat
            ] || 0),
        )
      : xp;
  return {
    ...(related(category)
      ? { professionCredit: { name: role, category, xp: weighted(category) } }
      : {}),
    ...(vocation && related(vocation.category)
      ? {
          vocationCredit: {
            id: vocation.id,
            category: vocation.category,
            xp: weighted(vocation.category),
          },
        }
      : {}),
  };
}
export function isTaken(c: Character, o: Objective, now = new Date()): boolean {
  return !!c.takenRequests?.some(
    (r) =>
      r.id === o.id &&
      ((r.calendarBound
        ? r.takenPeriod === period(r.cadence, now)
        : r.persistent) ||
        r.takenPeriod === objectivePeriod(o, now)),
  );
}
export function takeRequest(
  c: Character,
  id: string,
  now = new Date(),
): Character {
  const o = objectives(c).find((o) => o.id === id);
  if (!o) return c;
  if (isTaken(c, o, now) && !isComplete(c, o, now)) return c;
  if (
    o.requestGroup &&
    c.takenRequests?.some(
      (r) =>
        r.id !== id &&
        r.requestGroup === o.requestGroup &&
        r.takenPeriod === objectivePeriod(o, now),
    )
  )
    return c;
  if (isComplete(c, o, now) && !o.persistent) return c;
  if (o.taskVersion === 2 && taskRequirements(c, o, now, "accept").length)
    return c;
  const instanceId = o.persistent
    ? `adventure-${crypto.randomUUID()}`
    : undefined;
  return {
    ...c,
    takenRequests: [
      ...(c.takenRequests || []).filter((r) => r.id !== id),
      {
        ...o,
        ...(c.trainingPlan ? { trainingContext: { ...c.trainingPlan } } : {}),
        takenAt: now.toISOString(),
        ...(instanceId ? { instanceId } : {}),
        takenPeriod: instanceId || objectivePeriod(o, now),
        classId: c.activeClass,
        profession: c.profession,
        ...(c.vocation ? { vocationId: c.vocation } : {}),
      },
    ],
  };
}
export const releaseRequest = (c: Character, id: string): Character => ({
  ...c,
  takenRequests: (c.takenRequests || []).filter((r) => r.id !== id),
});
export function resolveTakenRequest(
  c: Character,
  r: TakenRequest,
): Objective | undefined {
  const context = {
    ...c,
    activeClass: r.classId,
    profession: r.profession,
    vocation: r.vocationId || null,
    trainingPlan: r.trainingContext,
  };
  const resolved =
    r.kind === "class-trial" && r.targetClass
      ? entryTrial(context, r.targetClass)
      : (r.taskVersion === 2
          ? objectives(context)
          : legacyObjectives(context)
        ).find((o) => o.id === r.id);
  if (r.workout) {
    if (
      !resolved?.workout ||
      !validWorkoutPrescription(r.workout) ||
      resolved.rank !== r.workout.rank ||
      (r.id.startsWith("regimen-") &&
        resolved.workout.session !== r.workout.session)
    )
      return;
    return {
      ...resolved,
      workout: r.workout,
      equipment: r.workout.environment === "home" ? "bodyweight" : "weights",
      description:
        workoutSummary(r.workout) +
        (resolved.scope === "class"
          ? ` Complete the class focus: ${currentPath(context).goal}`
          : ""),
    };
  }
  return resolved;
}
export const takenObjectives = (c: Character, now = new Date()): Objective[] =>
  (c.takenRequests || [])
    .filter((r) =>
      r.calendarBound
        ? r.takenPeriod === period(r.cadence, now)
        : r.persistent || r.takenPeriod === objectivePeriod(r, now),
    )
    .flatMap((r) => {
      const o = resolveTakenRequest(c, r);
      return o ? [o] : [];
    });
export const suggestedObjectives = (c: Character, now = new Date()) =>
  objectives(c).filter(
    (o) =>
      (!isTaken(c, o, now) || (o.persistent && isComplete(c, o, now))) &&
      (!isComplete(c, o, now) || o.persistent) &&
      (c.takenRequests?.some((r) => r.id === o.id) ||
        c.completions.some((r) => r.id === o.id)),
  );
export function completeTaken(
  c: Character,
  o: Objective,
  now = new Date(),
): Character {
  return isTaken(c, o, now) ? complete(c, o, now) : c;
}
export function switchClass(c: Character, id: string): Character {
  const p = CLASSES.find((x) => x.id === id);
  if (!p || !available(p, stats(c), totalXP(c), c)) return c;
  return {
    ...c,
    activeClass: id,
    // Legacy combat specializations remain archived; vocation is independent.
    subclass: c.subclass,
    unlockedClasses: [
      ...new Set([...(c.unlockedClasses || []), c.activeClass, id]),
    ],
  };
}
export function createCharacter(
  name: string,
  baseline: Baseline,
  activeClass: string,
  profession: string,
  demo = false,
): Character {
  const baseStats = startingStats(baseline),
    selected = CLASSES.find((x) => x.id === activeClass);
  return {
    version: 1,
    id: crypto.randomUUID(),
    name: name.trim().slice(0, 32) || "Adventurer",
    title: "Guild member",
    createdAt: new Date().toISOString(),
    baseline,
    baseStats,
    activeClass:
      selected && available(selected, baseStats, 0) ? selected.id : "disciple",
    subclass: null,
    profession,
    vocation: null,
    progressionVersion: 2,
    unlockedClasses:
      selected && available(selected, baseStats, 0)
        ? [selected.id]
        : ["disciple"],
    completions: [],
    certificates: [],
    journal: [],
    relics: [],
    earnedSkills: [],
    milestones: {},
    startingRank: startingRankFor(baseStats),
    ...(baseline.assessment
      ? {
          preferences: {
            ...DEFAULT_PREFERENCES,
            equipment:
              baseline.assessment.strengthTest === "weighted"
                ? ["bodyweight", "weights"]
                : ["bodyweight"],
          },
          trainingVersion: 3 as const,
          examVersion: 1 as const,
          balanceVersion: 1 as const,
          calendarVersion: 1 as const,
          classEntries: {
            [selected && available(selected, baseStats, 0)
              ? selected.id
              : "disciple"]: { at: new Date().toISOString(), credit: 0 },
          },
          assessmentHistory: [
            {
              at: new Date().toISOString(),
              assessment: baseline.assessment,
              stats: baseStats,
            },
          ],
        }
      : {}),
    learnedSkills: [],
    skillPurchases: [],
    demo,
  };
}
export function legacyDemoCharacter(): Character {
  const c = createCharacter(
    "Rowan",
    {
      ...EMPTY_BASELINE,
      pushups: 24,
      squats: 30,
      balance: 30,
      walk: 30,
      reading: 40,
      reflection: 4,
      connection: 3,
    },
    "warrior",
    "Analyst",
    true,
  );
  c.title = "Registered adventurer";
  c.vocation = "networking";
  return c;
}
export function demoCharacter(): Character {
  const c = legacyDemoCharacter();
  return {
    ...c,
    trainingVersion: 3,
    examVersion: 1,
    balanceVersion: 1,
    calendarVersion: 1,
    classEntries: { warrior: { at: c.createdAt, credit: 0 } },
    baseline: {
      ...c.baseline,
      assessment: {
        version: 2,
        age: 35,
        sex: "male",
        strengthTest: "pushups",
        pushupStyle: "floor",
        pushups: 20,
        chairStands: null,
        balanceSeconds: 30,
        walkMetres: 550,
        heightCm: 175,
        massKg: 75,
        liftKg: null,
        liftReps: null,
        pullups: 0,
      },
    },
    baseStats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
    unlockedClasses: ["warrior"],
  };
}
export function upgradeCalendar(c: Character): Character {
  if (c.calendarVersion === 1) return c;
  const next = { ...c, calendarVersion: 1 as const };
  const milestones = { ...c.milestones };
  const catalogs = new Map<string, Map<string, Objective>>();
  const completions = c.completions.map((x) => {
    const key = `${x.classId}|${x.profession || c.profession}|${x.vocationId || ""}`;
    if (!catalogs.has(key))
      catalogs.set(
        key,
        new Map(
          objectives({
            ...next,
            activeClass: x.classId,
            profession: x.profession || c.profession,
            vocation: x.vocationId || null,
          }).map((o) => [o.id, o]),
        ),
      );
    const o = catalogs.get(key)!.get(x.id);
    return o ? { ...x, requestGroup: o.requestGroup } : x;
  });
  const takenRequests = (c.takenRequests || []).map((r) => {
    if (r.taskVersion !== 2) return r;
    const o = resolveTakenRequest(next, r);
    if (!o) return r;
    const key = o.calendarBound
      ? period(o.cadence, new Date(r.takenAt))
      : r.takenPeriod;
    const old = `${r.id}:${r.takenPeriod}`,
      fresh = `${r.id}:${key}`;
    if (milestones[old] && !milestones[fresh])
      milestones[fresh] = milestones[old];
    return {
      ...r,
      ...o,
      takenPeriod: key,
      takenAt: r.takenAt,
      classId: r.classId,
      profession: r.profession,
      vocationId: r.vocationId,
    };
  });
  return { ...next, takenRequests, milestones, completions };
}
export function upgradeBalance(c: Character): Character {
  if (c.balanceVersion === 1) return c;
  const start = RANKS.findIndex((r) => r.name === (c.startingRank || "F"));
  const oldXP = totalXP(c) + oldGuildRankThreshold(Math.max(0, start));
  let index = RANKS.length - 1;
  while (index > 0 && oldXP < oldGuildRankThreshold(index)) index--;
  const fraction =
    index === RANKS.length - 1
      ? 0
      : (oldXP - oldGuildRankThreshold(index)) /
        (oldGuildRankThreshold(index + 1) - oldGuildRankThreshold(index));
  const retained =
    guildRankThreshold(index) +
    Math.floor(
      fraction * (guildRankThreshold(index + 1) - guildRankThreshold(index)),
    );
  const milestones = { ...c.milestones };
  const requests = (c.takenRequests || []).map((r) => {
    if (r.taskVersion !== 2) return r;
    const shaped = resolveTakenRequest(c, r);
    if (!shaped) return r;
    const persistent = shaped.cadence === "monthly" && !shaped.once;
    const nextPeriod = persistent
      ? r.takenPeriod
      : objectivePeriod(
          { ...shaped, instanceId: undefined },
          new Date(r.takenAt),
        );
    const oldKey = `${r.id}:${r.takenPeriod}`,
      newKey = `${r.id}:${nextPeriod}`;
    if (milestones[oldKey] && !milestones[newKey])
      milestones[newKey] = milestones[oldKey];
    return {
      ...r,
      ...shaped,
      persistent,
      instanceId: persistent ? nextPeriod : undefined,
      takenAt: r.takenAt,
      takenPeriod: nextPeriod,
      classId: r.classId,
      profession: r.profession,
      vocationId: r.vocationId,
    };
  });
  return {
    ...c,
    balanceVersion: 1,
    rankLegacyCredit: Math.max(
      0,
      retained - totalXP(c) - startingRankCredit(c),
    ),
    takenRequests: requests,
    milestones,
  };
}
export function upgradeExams(c: Character): Character {
  if (c.examVersion === 1) return c;
  const roles = [
    ...new Set(
      c.completions.map((o) => o.profession).filter((n): n is string => !!n),
    ),
  ];
  return {
    ...c,
    examVersion: 1,
    notificationsReadAt: new Date().toISOString(),
    exams: [],
    examGrandfather: {
      classes: Object.fromEntries(
        CLASSES.map((p) => [p.id, classLevel(c, p.id)]),
      ),
      professions: Object.fromEntries(
        roles.map((name) => [name, professionLevel(c, name)]),
      ),
    },
  };
}
export function upgradeTraining(c: Character): Character {
  if (c.trainingVersion === 3) return c;
  const before = stats(c),
    earnedStats = { ...before };
  for (const a of ATTRIBUTES) earnedStats[a] -= c.baseStats[a];
  const classLevels = Object.fromEntries(
    CLASSES.map((p) => [p.id, classLevel(c, p.id)]),
  );
  const names = [
    ...new Set(
      c.completions.map((o) => o.profession).filter((v): v is string => !!v),
    ),
  ];
  return {
    ...c,
    trainingVersion: 3,
    trainingLegacy: {
      count: c.completions.length,
      classLevels,
      professionLevels: Object.fromEntries(
        names.map((name) => [name, professionLevel(c, name)]),
      ),
      earnedStats,
    },
    unlockedClasses: [
      ...new Set([
        ...(c.unlockedClasses || []),
        c.activeClass,
        ...CLASSES.filter((p) => ownClassXP(c, p.id) > 0).map((p) => p.id),
      ]),
    ],
  };
}
export function activity(c: Character, days = 7, now = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days + i + 1);
    const key = period("daily", d);
    return {
      key,
      label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      count: c.completions.filter(
        (x) => period("daily", new Date(x.at)) === key,
      ).length,
    };
  });
}
export { SKILLS } from "./skill-catalog";
export type { Skill } from "./skill-catalog";
export const hasSkill = (c: Character, s: Skill) =>
  c.earnedSkills.includes(s.id);
export function skillWallet(c: Character, s?: Skill): string {
  if (!s || s.category === "universal") return "universal";
  if (s.category === "class" || s.category === "subclass") return "combat";
  const category =
    s.owner === "networking"
      ? "technology"
      : s.owner === "analysis"
        ? "business"
        : CAREER_CATEGORIES.some((g) => g.id === s.owner)
          ? s.owner!
          : careerCategory(c.profession).id;
  return `profession:${category}`;
}
export function walletXP(c: Character, wallet: string): number {
  if (wallet === "combat") return progressionLedger(c).combat;
  if (wallet.startsWith("class:")) return classXP(c, wallet.slice(6));
  if (wallet.startsWith("subclass:")) return subclassXP(c, wallet.slice(9));
  if (wallet.startsWith("profession:")) return careerXP(c, wallet.slice(11));
  return progressionLedger(c).universal;
}
export const walletLevel = (c: Character, wallet: string) =>
  wallet === "universal"
    ? level(adventurerXP(c))
    : wallet === "combat"
      ? classLevel(c, c.activeClass)
      : levelFromXP(walletXP(c, wallet));
export const skillPointsEarned = (c: Character, wallet = "universal") =>
  Math.floor(walletXP(c, wallet) / 100) +
  (c.legacyProgress?.skillPoints[wallet] || 0);
const migratedWallet = (wallet: string) =>
  wallet.startsWith("class:") || wallet.startsWith("subclass:")
    ? "combat"
    : wallet.startsWith("profession:") &&
        !CAREER_CATEGORIES.some((g) => `profession:${g.id}` === wallet)
      ? `profession:${careerCategory(wallet.slice(11)).id}`
      : wallet;
export const skillPointsAvailable = (c: Character, wallet = "universal") =>
  Math.max(
    0,
    skillPointsEarned(c, wallet) -
      (c.skillPurchases || [])
        .filter((p) => migratedWallet(p.wallet) === wallet)
        .reduce((n, p) => n + p.cost, 0),
  );
export function skillTier(s: Skill): number {
  return (
    s.requiredLevel ??
    (
      { V: 40, IV: 25, III: 15, II: 5, "4": 15, "3": 10, "2": 5 } as Record<
        string,
        number
      >
    )[s.tier] ??
    1
  );
}
export function skillRequirements(c: Character, s: Skill): string[] {
  const missing: string[] = [];
  if (s.current(c) < s.target)
    missing.push(`${s.proof} (${s.current(c)}/${s.target})`);
  if (s.automatic) return missing;
  for (const id of s.parents) {
    const parent = SKILLS.find((x) => x.id === id);
    if (parent && !hasSkill(c, parent)) missing.push(`Learn ${parent.name}`);
  }
  if (
    s.anyParents?.length &&
    !s.anyParents.some((id) => c.earnedSkills.includes(id))
  )
    missing.push(
      `Learn one of: ${s.anyParents.map((id) => SKILLS.find((p) => p.id === id)?.name || id).join(" / ")}`,
    );
  const wallet = skillWallet(c, s),
    lv = s.archetype
      ? levelFromXP(archetypeXP(c, s.archetype))
      : s.category === "class" && s.owner
        ? classLevel(c, s.owner)
        : walletLevel(c, wallet);
  if (lv < skillTier(s))
    missing.push(
      `${s.archetype ? "Archetype" : s.category === "class" ? "Class" : s.category === "profession" ? "Career tree" : "Adventurer"} level ${skillTier(s)} (current ${lv})`,
    );
  if (
    s.category === "class" &&
    (s.archetype
      ? !currentPath(c).mix[s.archetype as keyof ClassPath["mix"]]
      : s.owner !== c.activeClass)
  )
    missing.push(
      `Active class must train ${s.archetype || CLASSES.find((p) => p.id === s.owner)?.name || s.owner}`,
    );
  if (s.category === "profession") {
    const category = wallet.slice(11);
    if (
      careerCategory(c.profession).id !== category &&
      activeVocation(c)?.category !== category
    )
      missing.push(
        `Select a profession or vocation in ${CAREER_CATEGORIES.find((g) => g.id === category)?.name || category}`,
      );
  }
  if (skillPointsAvailable(c, wallet) < s.cost)
    missing.push(
      `Need ${s.cost} ${wallet === "combat" ? "combat" : wallet.split(":")[0]} skill points`,
    );
  return missing;
}
export function learnSkill(c: Character, id: string): Character {
  const s = SKILLS.find((x) => x.id === id);
  if (!s || hasSkill(c, s) || s.automatic || skillRequirements(c, s).length)
    return c;
  return {
    ...c,
    earnedSkills: [...c.earnedSkills, id],
    learnedSkills: [...(c.learnedSkills || []), id],
    skillPurchases: [
      ...(c.skillPurchases || []),
      { id, wallet: skillWallet(c, s), cost: s.cost },
    ],
  };
}
export function awardSkills(input: Character): Character {
  const upgraded = upgradeProgression(input);
  const c: Character = {
    ...upgraded,
    earnedSkills: [
      ...new Set([
        ...upgraded.earnedSkills,
        "universal-root",
        ...SKILLS.filter(
          (s) => s.automatic && s.current(upgraded) >= s.target,
        ).map((s) => s.id),
      ]),
    ],
  };
  const attributes = stats(c),
    xp = totalXP(c);
  return {
    ...c,
    unlockedClasses: [
      ...new Set([
        ...(c.unlockedClasses || []),
        c.activeClass,
        ...CLASSES.filter((p) =>
          classRequirements(p, attributes, xp, c).every((r) => r.met),
        ).map((p) => p.id),
      ]),
    ],
  };
}

/** Preserve previously earned levels, attributes, purchases and XP when upgrading a v1.1 save. */
export function upgradeProgression(c: Character): Character {
  if (c.progressionVersion === 2) return c;
  const classes: Record<string, number> = {},
    professions: Record<string, number> = {};
  const oldStats = { ...c.baseStats };
  for (const p of CLASSES) {
    const xp = classXP(c, p.id),
      lv = 1 + Math.floor(xp / 100);
    classes[p.id] = Math.max(0, xpForLevel(lv) - xp);
    oldStats[p.stat] += lv - 1;
  }
  for (const name of new Set(
    c.completions
      .filter((o) => o.scope === "profession")
      .map((o) => o.profession)
      .filter((x): x is string => !!x),
  )) {
    const xp = professionXP(c, name),
      lv = 1 + Math.floor(xp / 100);
    professions[name] = Math.max(0, xpForLevel(lv) - xp);
    oldStats[legacyProfessionStat(name)] += lv - 1;
  }
  for (const o of c.completions)
    if (o.statReward) oldStats[o.statReward.stat] += o.statReward.amount;
  const next: Character = {
    ...c,
    progressionVersion: 2,
    vocation:
      c.vocation ??
      (c.completions.some((o) => o.id.startsWith("network-"))
        ? "networking"
        : null),
    legacyProgress: {
      adventurerXP: Math.max(
        0,
        xpForLevel(1 + Math.floor(totalXP(c) / 250), 250) - totalXP(c),
      ),
      classes,
      professions,
      stats: {},
      skillPoints: {},
    },
  };
  const recalculated = stats(next);
  for (const a of ATTRIBUTES)
    next.legacyProgress!.stats[a] = Math.max(0, oldStats[a] - recalculated[a]);
  // Honored balances let existing purchases remain paid for after the rebalance.
  const legacyEarned: Record<string, number> = {};
  const wallets = new Set([
    "universal",
    ...CLASSES.map((p) => `class:${p.id}`),
    ...CLASSES.flatMap((p) => p.subclasses.map((s) => `subclass:${s.id}`)),
    ...c.completions
      .filter((o) => o.profession)
      .map((o) => `profession:${o.profession}`),
  ]);
  for (const wallet of wallets) {
    const xp =
      wallet === "universal"
        ? walletXP(c, wallet)
        : wallet.startsWith("class:")
          ? classXP(c, wallet.slice(6))
          : wallet.startsWith("subclass:")
            ? subclassXP(c, wallet.slice(9))
            : professionXP(c, wallet.slice(11));
    const lv =
      wallet === "universal"
        ? 1 + Math.floor(totalXP(c) / 250)
        : 1 + Math.floor(xp / 100);
    const key = migratedWallet(wallet);
    legacyEarned[key] =
      (legacyEarned[key] || 0) + Math.floor(xp / 25) + 2 * (lv - 1);
  }
  for (const [wallet, earned] of Object.entries(legacyEarned))
    next.legacyProgress!.skillPoints[wallet] = Math.max(
      0,
      earned - Math.floor(walletXP(next, wallet) / 100),
    );
  return next;
}
