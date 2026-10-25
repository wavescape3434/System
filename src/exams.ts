import type { Character, Attribute } from "./domain";
import {
  CLASSES,
  classTrainingLevel,
  professionTrainingLevel,
  professionStat,
} from "./domain";
import { checkScore } from "./metrics";
import type { Assessment } from "./metrics";
import type { MentalResult, MentalStat, MentalForm } from "./exam-bank";
import { validMentalFormId } from "./exam-bank";
import { nextExamLevel, physicalPass, mentalPass } from "./exam-rules";
import type { ExamRecord, ExamScope, ExamRoute } from "./exam-rules";
export interface ExamTarget {
  scope: ExamScope;
  owner: string;
  name: string;
  stat: Attribute;
  milestone: number;
  ready: boolean;
}
export interface FitnessProtocol {
  id: string;
  stat: Attribute;
  name: string;
  unit: string;
  lower?: boolean;
  max?: number;
  equipment?: "weights" | "pullup-bar";
  instructions: string;
  initial: (a: Assessment) => number | null;
}
export const FITNESS_PROTOCOLS: FitnessProtocol[] = [
  ...(["floor", "incline", "knee", "wall"] as const).map((style) => ({
    id: `push-${style}`,
    stat: "STR" as const,
    name: `Maximum consecutive ${style} pushups`,
    unit: "repetitions",
    instructions:
      "Use the same variation, surface height, range of motion, and stopping rule. Count clean consecutive repetitions until rest or form changes.",
    initial: (a: Assessment) =>
      a.strengthTest === "pushups" && a.pushupStyle === style
        ? a.pushups
        : null,
  })),
  {
    id: "chair",
    stat: "STR",
    name: "Unassisted chair stands in 30 seconds",
    unit: "repetitions",
    instructions:
      "Use the same stable 45 cm chair, arms crossed, two trials with 60 seconds rest; enter the mean.",
    initial: (a) =>
      a.strengthTest === "chair" && !a.chairAssisted ? a.chairStands : null,
  },
  {
    id: "grip",
    stat: "STR",
    name: "Maximum grip force",
    unit: "kg",
    instructions:
      "Use the same calibrated dynamometer, posture, handle setting, and rest. Record the best of three efforts per hand.",
    initial: (a) => (a.strengthTest === "grip" ? (a.gripKg ?? null) : null),
  },
  {
    id: "bench8",
    stat: "STR",
    name: "Bench press load for eight controlled repetitions",
    unit: "kg",
    equipment: "weights",
    instructions:
      "Use the same bench technique and eight clean repetitions in a recent challenging set. Record the load, not a maximal single attempt.",
    initial: (a) =>
      a.strengthTest === "weighted" && a.liftReps === 8 ? a.liftKg : null,
  },
  {
    id: "pullups",
    stat: "STR",
    name: "Maximum consecutive strict pullups",
    unit: "repetitions",
    equipment: "pullup-bar",
    instructions:
      "Use the same full controlled range from a hang, with no kipping. Stop at rest or a change in technique.",
    initial: (a) => a.pullups,
  },
  {
    id: "balance",
    stat: "DEX",
    name: "One-leg balance, eyes open",
    unit: "seconds",
    max: 45,
    instructions:
      "Use the same leg and footwear near stable support, hands on hips. Best of three attempts; stop at 45 seconds. At the ceiling, use an alternate test.",
    initial: (a) => a.balanceSeconds,
  },
  {
    id: "target-taps",
    stat: "DEX",
    name: "Accurate alternating target taps in 30 seconds",
    unit: "correct taps",
    instructions:
      "Seated at a table, place two targets 30 cm apart. Alternate one fingertip between them for 30 seconds. Count only touches inside a target; keep target size and setup unchanged.",
    initial: () => null,
  },
  {
    id: "line-steps",
    stat: "DEX",
    name: "Controlled alternating line steps in 60 seconds",
    unit: "correct steps",
    instructions:
      "Use two floor lines 20 cm apart beside stable support. Alternate controlled steps between them for 60 seconds; count only correctly placed steps. Keep the setup unchanged.",
    initial: () => null,
  },
  {
    id: "walk6",
    stat: "CON",
    name: "Distance walked in six minutes",
    unit: "metres",
    instructions:
      "Use the same flat measured course, turn points, and walking protocol. Record the total distance after six minutes.",
    initial: (a) => a.walkMetres,
  },
  {
    id: "walk12",
    stat: "CON",
    name: "Distance walked in twelve minutes",
    unit: "metres",
    instructions:
      "Use the same flat course and walking protocol. Record the distance after twelve minutes; compare only against another twelve-minute check.",
    initial: () => null,
  },
  {
    id: "route1km",
    stat: "CON",
    name: "Time to walk the same 1 km route",
    unit: "seconds",
    lower: true,
    instructions:
      "Walk the same measured one-kilometre route under similar conditions. Enter total elapsed seconds, including turns. A lower time is better.",
    initial: () => null,
  },
];
export function examTargets(c: Character): ExamTarget[] {
  const classes = CLASSES.filter((p) =>
    (c.unlockedClasses || [c.activeClass]).includes(p.id),
  ).map((p) => {
    const milestone = nextExamLevel(c, "class", p.id);
    return {
      scope: "class" as const,
      owner: p.id,
      name: p.name,
      stat: p.stat,
      milestone,
      ready: classTrainingLevel(c, p.id) >= milestone,
    };
  });
  const roles = [
    ...new Set([
      c.profession,
      ...c.completions
        .filter((o) => o.scope === "profession")
        .map((o) => o.profession)
        .filter((s): s is string => !!s),
    ]),
  ];
  return [
    ...classes,
    ...roles.map((name) => {
      const milestone = nextExamLevel(c, "profession", name);
      return {
        scope: "profession" as const,
        owner: name,
        name,
        stat: professionStat(name),
        milestone,
        ready: professionTrainingLevel(c, name) >= milestone,
      };
    }),
  ];
}
export const usedExamForms = (c: Character) => [
  ...(c.assessmentFormsSeen || []),
  ...(c.exams || []).flatMap((e) =>
    e.formId ? [e.formId] : e.mental?.formId ? [e.mental.formId] : [],
  ),
  ...(c.assessmentHistory || []).flatMap((h) =>
    Object.values(h.assessment.mental || {}).flatMap((m) =>
      m?.formId ? [m.formId] : [],
    ),
  ),
  ...Object.values(c.baseline.assessment?.mental || {}).flatMap((m) =>
    m?.formId ? [m.formId] : [],
  ),
];
function ownerRecords(c: Character, t: ExamTarget) {
  return (c.exams || []).filter(
    (e) => e.scope === t.scope && e.owner === t.owner,
  );
}
export function masteryStandard(
  c: Character,
  t: ExamTarget,
  protocol?: string,
) {
  const records = ownerRecords(c, t).filter(
    (e) =>
      e.status === "passed" &&
      e.milestone < t.milestone &&
      (protocol
        ? e.protocol === protocol && e.value !== undefined
        : !!e.mental),
  );
  const improvements = new Set(
    records.filter((e) => e.route !== "mastery").map((e) => e.milestone),
  ).size;
  const lower = FITNESS_PROTOCOLS.find((p) => p.id === protocol)?.lower;
  const values = records.map((e) =>
    protocol
      ? e.value!
      : checkScore(t.stat as MentalStat, e.mental!.answers, e.mental!.formId),
  );
  return {
    eligible: improvements >= 2,
    improvements,
    value: values.length
      ? lower
        ? Math.min(...values)
        : Math.max(...values)
      : 0,
    challenge: Math.max(1, ...records.map((e) => e.mental?.challenge || 1)),
    at: records
      .map((e) => e.at)
      .sort()
      .at(-1),
  };
}
export function previousFitness(
  c: Character,
  t: ExamTarget,
  protocol: FitnessProtocol,
): { value: number; at: string } | undefined {
  const records = ownerRecords(c, t).filter(
    (e) => e.protocol === protocol.id && e.value !== undefined,
  );
  const old =
    [...records].reverse().find((e) => e.status === "passed") ||
    records.find((e) => e.status === "baseline");
  if (old) return { value: old.value!, at: old.at };
  for (const record of c.assessmentHistory || []) {
    const value = protocol.initial(record.assessment);
    if (value !== null) return { value, at: record.at };
  }
  const value = c.baseline.assessment
    ? protocol.initial(c.baseline.assessment)
    : null;
  return value !== null ? { value, at: c.createdAt } : undefined;
}
export function previousMental(
  c: Character,
  t: ExamTarget,
): MentalResult | undefined {
  const records = ownerRecords(c, t).filter((e) => e.mental);
  return (
    [...records].reverse().find((e) => e.status === "passed")?.mental ||
    records.find((e) => e.status === "baseline")?.mental ||
    c.assessmentHistory?.find(
      (h) => h.assessment.mental?.[t.stat as MentalStat],
    )?.assessment.mental?.[t.stat as MentalStat] ||
    c.baseline.assessment?.mental?.[t.stat as MentalStat]
  );
}
const anotherDay = (at: string, now: Date) =>
  new Date(at).toDateString() !== now.toDateString() && new Date(at) < now;
export function beginExam(
  c: Character,
  t: ExamTarget,
  form: MentalForm,
  now = new Date(),
): Character {
  const actual = examTargets(c).find(
    (x) =>
      x.scope === t.scope &&
      x.owner === t.owner &&
      x.milestone === t.milestone &&
      x.ready,
  );
  if (
    !actual ||
    form.stat !== actual.stat ||
    usedExamForms(c).includes(form.id)
  )
    return c;
  return {
    ...c,
    exams: [
      ...(c.exams || []),
      {
        id: crypto.randomUUID(),
        scope: t.scope,
        owner: t.owner,
        milestone: t.milestone,
        stat: t.stat,
        at: now.toISOString(),
        status: "started",
        formId: form.id,
      },
    ],
  };
}
export function workProtocolId(stat: Attribute, note: string) {
  let hash = 2166136261;
  for (const letter of note.trim())
    hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619);
  return `work-${stat}-${(hash >>> 0).toString(16)}`;
}
export function submitFitnessExam(
  c: Character,
  t: ExamTarget,
  protocolId: string,
  value: number,
  note: string,
  now = new Date(),
  route: ExamRoute = "improvement",
): Character {
  const actual = examTargets(c).find(
      (x) =>
        x.scope === t.scope &&
        x.owner === t.owner &&
        x.milestone === t.milestone &&
        x.ready,
    ),
    p = FITNESS_PROTOCOLS.find((p) => p.id === protocolId && p.stat === t.stat);
  const workSample =
    protocolId === workProtocolId(t.stat, note) &&
    ["INT", "WIS", "CHA"].includes(t.stat);
  if (
    !actual ||
    (!p && !workSample) ||
    !Number.isFinite(value) ||
    value < 0 ||
    (p?.max && value > p.max) ||
    (p &&
      ["repetitions", "correct taps", "correct steps"].includes(p.unit) &&
      p.id !== "chair" &&
      !Number.isInteger(value)) ||
    (!p && note.trim().length < 12)
  )
    return c;
  const measure = p || { id: protocolId, initial: () => null };
  const mastery = masteryStandard(c, t, protocolId);
  if (route === "mastery" && !mastery.eligible) return c;
  const before = p
    ? previousFitness(c, t, p)
    : [...ownerRecords(c, t)]
        .reverse()
        .find((e) => e.protocol === protocolId && e.status === "passed") ||
      ownerRecords(c, t).find(
        (e) => e.protocol === protocolId && e.status === "baseline",
      );
  if (workSample && before && "note" in before && before.note !== note.trim())
    return c;
  const status = !before
    ? "baseline"
    : route === "mastery"
      ? mastery.at &&
        anotherDay(mastery.at, now) &&
        value > 0 &&
        (p?.lower ? value <= mastery.value : value >= mastery.value)
        ? "passed"
        : "failed"
      : anotherDay(before.at, now) &&
          physicalPass(value, before.value!, p?.lower)
        ? "passed"
        : "failed";
  return {
    ...c,
    exams: [
      ...(c.exams || []),
      {
        id: crypto.randomUUID(),
        scope: t.scope,
        owner: t.owner,
        milestone: t.milestone,
        stat: t.stat,
        at: now.toISOString(),
        protocol: measure.id,
        value,
        baseline: before?.value,
        note: note.trim(),
        status,
        route,
      },
    ],
  };
}
export function submitMentalExam(
  c: Character,
  t: ExamTarget,
  result: MentalResult,
  now = new Date(),
  route: ExamRoute = "improvement",
): Character {
  const actual = examTargets(c).find(
    (x) =>
      x.scope === t.scope &&
      x.owner === t.owner &&
      x.milestone === t.milestone &&
      x.ready,
  );
  const started = [...(c.exams || [])]
    .reverse()
    .find(
      (e) =>
        e.scope === t.scope &&
        e.owner === t.owner &&
        e.milestone === t.milestone &&
        e.status === "started" &&
        e.formId === result.formId,
    );
  if (
    !actual ||
    !started ||
    result.answers.length !== 5 ||
    !result.answers.every((n) => Number.isInteger(n) && n >= 0 && n < 4) ||
    !validMentalFormId(result.formId)
  )
    return c;
  const previous = previousMental(c, t),
    score = (r: MentalResult) =>
      checkScore(t.stat as MentalStat, r.answers, r.formId);
  const mastery = masteryStandard(c, t);
  if (route === "mastery" && !mastery.eligible) return c;
  const status = !previous
    ? "baseline"
    : route === "mastery"
      ? mastery.at &&
        anotherDay(mastery.at, now) &&
        score(result) >= Math.max(4, mastery.value) &&
        (result.challenge || 1) >= mastery.challenge
        ? "passed"
        : "failed"
      : anotherDay(previous.completedAt, now) &&
          mentalPass(result, previous, score)
        ? "passed"
        : "failed";
  return {
    ...c,
    exams: (c.exams || []).map((e) =>
      e.id === started.id
        ? { ...e, status, route, mental: result, at: now.toISOString() }
        : e,
    ),
  };
}
export function validExam(e: ExamRecord): boolean {
  return (
    !!e &&
    typeof e.id === "string" &&
    ["class", "profession"].includes(e.scope) &&
    typeof e.owner === "string" &&
    Number.isInteger(e.milestone) &&
    e.milestone >= 5 &&
    e.milestone % 5 === 0 &&
    ["STR", "DEX", "CON", "INT", "WIS", "CHA"].includes(e.stat) &&
    Number.isFinite(Date.parse(e.at)) &&
    ["started", "baseline", "failed", "passed"].includes(e.status) &&
    (e.route === undefined || ["improvement", "mastery"].includes(e.route)) &&
    (e.status === "started"
      ? validMentalFormId(e.formId)
      : !!e.mental ||
        (e.value !== undefined && typeof e.protocol === "string")) &&
    (e.formId === undefined ||
      (validMentalFormId(e.formId) &&
        e.formId.startsWith(e.stat.toLowerCase() + "-"))) &&
    (e.value === undefined || (Number.isFinite(e.value) && e.value >= 0)) &&
    (e.baseline === undefined ||
      (Number.isFinite(e.baseline) && e.baseline >= 0)) &&
    (e.note === undefined || typeof e.note === "string") &&
    (e.mental === undefined ||
      (validMentalFormId(e.mental.formId) &&
        e.mental.answers.length === 5 &&
        e.mental.answers.every((n) => Number.isInteger(n) && n >= 0 && n < 4) &&
        Number.isFinite(Date.parse(e.mental.completedAt)) &&
        (e.mental.durationMs === undefined ||
          (Number.isFinite(e.mental.durationMs) &&
            e.mental.durationMs >= 1000))))
  );
}
