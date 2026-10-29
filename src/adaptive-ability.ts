import { CAREER_RUBRICS, SPECIAL_PRACTICE } from "./ability-rubrics";
import { classSecondaryPractice } from "./class-practice";
import { CLASSES } from "./class-catalog";
import type { Character, Objective, Completion } from "./domain";
import { CAREER_GUIDES } from "./career-guides";
import type { RegimenRank } from "./training-prescriptions";
import { REGIMEN_RANKS } from "./training-prescriptions";
export interface PracticeEvidence {
  source: string;
  subject: string;
  level: RegimenRank;
  unfamiliar: boolean;
  independent: boolean;
  criteriaMet: number;
  criteriaTotal: number;
}
export interface AbilityCheck {
  id: string;
  at: string;
  key: string;
  protocol: string;
  subject: string;
  source: string;
  level: RegimenRank;
  value: number;
  total: number;
  unfamiliar: boolean;
  independent: boolean;
}
export const validPracticeEvidence = (x: unknown): x is PracticeEvidence => {
  const p = x as PracticeEvidence;
  return (
    !!p &&
    typeof p === "object" &&
    !Array.isArray(p) &&
    Object.keys(p).every((k) =>
      [
        "source",
        "subject",
        "level",
        "unfamiliar",
        "independent",
        "criteriaMet",
        "criteriaTotal",
      ].includes(k),
    ) &&
    typeof p.source === "string" &&
    p.source.trim().length >= 3 &&
    p.source.length <= 140 &&
    typeof p.subject === "string" &&
    p.subject.trim().length >= 2 &&
    p.subject.length <= 100 &&
    REGIMEN_RANKS.includes(p.level) &&
    typeof p.unfamiliar === "boolean" &&
    typeof p.independent === "boolean" &&
    Number.isInteger(p.criteriaMet) &&
    Number.isInteger(p.criteriaTotal) &&
    p.criteriaTotal >= 4 &&
    p.criteriaTotal <= 100 &&
    p.criteriaMet >= 0 &&
    p.criteriaMet <= p.criteriaTotal
  );
};
export function validAbilityCheck(x: unknown): x is AbilityCheck {
  const p = x as AbilityCheck;
  return (
    !!p &&
    typeof p.id === "string" &&
    p.id.length <= 80 &&
    Number.isFinite(Date.parse(p.at)) &&
    typeof p.key === "string" &&
    p.key.length > 0 &&
    p.key.length <= 300 &&
    p.protocol === "work-sample-v1" &&
    validPracticeEvidence({
      source: p.source,
      subject: p.subject,
      level: p.level,
      unfamiliar: p.unfamiliar,
      independent: p.independent,
      criteriaMet: p.value,
      criteriaTotal: p.total,
    })
  );
}
const stem = (family: string) =>
  family.replace(/-(?:daily|weekly|monthly|long)$/, "");
export function abilityKey(
  c: Character,
  o: Pick<
    Objective,
    "id" | "family" | "scope" | "stat" | "careerCategory" | "practice"
  >,
): string {
  const rawFamily = stem(
    o.practice?.family || o.family || o.id.replace(/-proficiency-[fedc]$/, ""),
  );
  const family = ["u-reading", "u-study", "extra-retrieval"].includes(rawFamily)
    ? "learning-retrieval"
    : ["u-mobility", "extra-joint-control"].includes(rawFamily)
      ? "mobility-control"
      : rawFamily;
  const base =
    o.scope === "class"
      ? `class:${c.activeClass}:${o.stat}`
      : o.scope === "profession"
        ? o.id.startsWith("vocation-")
          ? `vocation:${c.vocation}`
          : `career:${o.careerCategory || "general"}:${c.profession}`
        : "universal";
  return `${base}|${family}`;
}
export type AbilityDomain =
  | "strength"
  | "aerobic"
  | "coordination"
  | "learning"
  | "scripture"
  | "judgment"
  | "communication"
  | "career"
  | "recovery";
export function abilityDomain(
  o: Pick<Objective, "id" | "family" | "stat" | "scope" | "title" | "workout">,
): AbilityDomain {
  if (o.scope === "profession") return "career";
  const path =
    o.scope === "class"
      ? CLASSES.find((p) => o.id.startsWith(p.id + "-"))
      : undefined;
  const text = `${o.id} ${o.family || ""} ${o.title} ${path?.goal || ""}`;
  if (/sleep|meal|nutrition|hydration|prayer/i.test(text)) return "recovery";
  if (o.workout || o.stat === "STR") return "strength";
  if (o.stat === "CON") return "aerobic";
  if (o.stat === "DEX") return "coordination";
  if (o.stat === "CHA") return "communication";
  if (o.stat === "WIS")
    return path?.mix.cleric ||
      /scripture|bible|chapter|context|disciple|cleric|faith/i.test(text)
      ? "scripture"
      : "judgment";
  return "learning";
}
export interface AbilityBrief {
  domain: AbilityDomain;
  task: string;
  criteria: [string, string, string, string];
  next: string;
}
const briefCache = new Map<string, AbilityBrief>();
export function abilityBrief(o: Objective, level: RegimenRank): AbilityBrief {
  const key = JSON.stringify([
    o.id,
    o.family,
    o.scope,
    o.stat,
    o.careerCategory,
    o.title,
    !!o.workout,
    level,
  ]);
  const previous = briefCache.get(key);
  if (previous) return previous;
  const brief = buildAbilityBrief(o, level);
  // Recovery routines use their current authored description rather than a graded brief.
  if (brief.domain !== "recovery") {
    if (briefCache.size >= 2048) briefCache.clear();
    briefCache.set(key, brief);
  }
  return brief;
}
function buildAbilityBrief(o: Objective, level: RegimenRank): AbilityBrief {
  const domain = abilityDomain(o),
    index = REGIMEN_RANKS.indexOf(level);
  let task: string, criteria: [string, string, string, string], next: string;
  if (domain === "career") {
    const guides =
      CAREER_GUIDES[o.careerCategory || "general"] || CAREER_GUIDES.general;
    const familyTask =
      o.id.startsWith("career-") ||
      o.id.startsWith("network-") ||
      o.id.startsWith("analysis-")
        ? o.title
        : guides[[0, 2, 5, 9][index]];
    task = `${familyTask} ${["Use one worked example, then reproduce its essential step without copying.", "Complete a familiar case independently and check the actual output.", "Complete an unfamiliar standard case and test both the normal result and an edge case.", "Complete an unfamiliar case with two declared constraints, compare two approaches, and test the proposed result."][index]}`;
    criteria =
      CAREER_RUBRICS[o.careerCategory || "general"] || CAREER_RUBRICS.general;
    next =
      "Move to a harder case in the same professional competency or source. Keep a separate baseline for a new competency.";
  } else if (domain === "learning") {
    task = [
      "Choose a named subject/source. Study one example, close it, then reproduce the key idea and solve one similar question.",
      "Answer four familiar questions without notes, check each against the same source, and retry the errors.",
      "Answer five previously unseen standard questions, including one application. Check the answer key and explain each correction.",
      "Solve an unfamiliar application that combines two concepts. Test a counterexample, compare an alternative method and explain why the answer holds.",
    ][index];
    if (/language/i.test(`${o.id} ${o.family}`))
      task +=
        " Use the specific language and source level: include listening comprehension and an original sentence, not vocabulary recognition alone.";
    if (/writing/i.test(`${o.id} ${o.family}`))
      task +=
        " Produce an original explanation, retain the draft, and verify its factual claims against sources.";
    criteria = [
      "Recall the relevant idea without notes",
      "Apply it to the requested example",
      "Check the result against a named source",
      "Explain and correct errors rather than memorizing the key",
    ];
    next =
      "Use the next difficulty or unit in the same source, then test transfer to unfamiliar questions. Easy familiar recall alone does not advance placement.";
  } else if (domain === "scripture") {
    task = [
      "Read a short Bible passage in its surrounding chapter. Close it and state the speaker, audience and main point.",
      "Outline a paragraph without notes, reopen it, and correct missing or unsupported claims.",
      "Compare two interpretations of a passage using the surrounding chapter and a named commentary. Support your conclusion with the text.",
      "Analyze a difficult passage in its literary context. Address the strongest alternative interpretation and identify an application to check later.",
    ][index];
    criteria = [
      "Identify speaker, audience and literary context",
      "Support claims with the actual passage",
      "Distinguish textual meaning from personal application",
      "Correct an unsupported assumption",
    ];
    next =
      "Increase interpretive complexity and the quality of supporting evidence, not merely the number of verses read.";
  } else if (domain === "communication") {
    task = [
      "Record a 60-second explanation, replay it and revise one unclear sentence.",
      "Explain a familiar subject to a beginner in two minutes, define jargon, and record a clearer second version.",
      "Summarize an unfamiliar two-minute recording from one listen. Check the source for omissions and invented details, then revise.",
      "Give two five-minute explanations of the same difficult subject for different audiences. Address a plausible objection and revise the weakest section.",
    ][index];
    criteria = [
      "State the main point clearly",
      "Preserve accurate supporting information",
      "Match the listener's assumed knowledge",
      "Verify understanding or improve a specific weakness on replay",
    ];
    next =
      "Add unfamiliar content, audience constraints or a real listener's teach-back. Speaking longer alone does not demonstrate improvement.";
  } else if (domain === "judgment") {
    task = [
      "Record one checkable prediction, its evidence and your confidence before seeing the outcome.",
      "Compare two explanations of one decision, separate observations from assumptions and state what would change your mind.",
      "Review five dated predictions in the same subject. Compare confidence with outcomes and identify a repeated error.",
      "Analyze an unfamiliar uncertain decision using base rates, two plausible explanations, consequences and a disconfirming test. Record the forecast before checking the outcome.",
    ][index];
    criteria = [
      "Separate observations from assumptions",
      "Consider a plausible alternative",
      "State uncertainty before knowing the result",
      "Use the later evidence to correct a decision rule",
    ];
    next =
      "Use a harder decision with observable feedback. Do not equate confidence, hindsight or time spent reflecting with better judgment.";
  } else if (domain === "coordination") {
    task = [
      "Use one slow, supported movement pattern and record correct placements and errors at a fixed setup.",
      "Repeat a familiar pattern in three controlled rounds, keeping target size, support and spacing unchanged.",
      "Perform an unfamiliar three-part pattern and record accuracy over three equal rounds. Correct the weakest transition.",
      "Link several patterns under a declared precision constraint. Compare accuracy before and after a technique correction at the same speed.",
    ][index];
    criteria = [
      "Use the same targets, spacing and support",
      "Count correct placements separately from errors",
      "Keep control rather than chasing speed",
      "Retain a repeatable comparison and one correction",
    ];
    next =
      "Reduce assistance or add one pattern only after accuracy is stable. A fast mile does not establish hand coordination.";
  } else if (domain === "aerobic") {
    const name = `${o.id} ${o.family || ""}`;
    task = /run/.test(name)
      ? [
          "Walk easily for five minutes, then try four rounds of 20 seconds of controlled jogging and 70 seconds walking. Finish with easy walking.",
          "Warm up with five minutes walking. Complete six rounds of one minute jogging and two minutes walking; cool down for five minutes.",
          "After warming up, complete twenty minutes of continuous comfortable jogging if already prepared for it; otherwise retain run/walk intervals and record the actual split.",
          "Complete five kilometres at a sustainable pace after a progressive running buildup. Keep a warm-up, cool-down and recovery day.",
        ][index]
      : /stairs/.test(name)
        ? `Complete ${["one familiar flight", "five minutes", "ten minutes", "twenty minutes"][index]} of controlled stair walking with a handrail and recovery breaks as needed.`
        : `Complete ${[5, 15, 30, 45][index]} minutes of ${/cycl/.test(name) ? "cycling" : "walking"} at a conversational effort, plus an easy warm-up and cool-down. Record actual duration, distance when known, and effort.`;
    task +=
      " Keep the same activity and setup for comparisons; a fast short route is not proof of longer-session tolerance.";
    criteria = [
      "Complete the stated activity and duration",
      "Keep a repeatable route or machine setup",
      "Record conversational effort or the actual effort scale",
      "Retain recovery and stop if the planned effort cannot be sustained",
    ];
    next =
      "Increase duration gradually within the same activity, then review pace or intervals. Walking, running, cycling and stair work have separate records.";
  } else if (domain === "strength") {
    const name = `${o.id} ${o.family || ""}`;
    task = /core/.test(name)
      ? [
          "Perform one set of five short-reach dead bugs per side with a still trunk.",
          "Perform two sets of six controlled dead bugs or bird dogs per side.",
          "Perform two sets of eight long-reach dead bugs per side; keep the trunk still.",
          "Perform three sets of eight slow long-reach dead bugs per side with a two-second pause.",
        ][index]
      : /hinge/.test(name)
        ? [
            "Perform one set of five controlled glute bridges.",
            "Perform two sets of eight glute bridges with a two-second top pause.",
            "Perform two sets of six staggered-stance bridges per side.",
            "Perform three sets of six to ten controlled single-leg bridges per side.",
          ][index]
        : /legs|squat/.test(name)
          ? [
              "Perform one set of five chair sit-to-stands, using hand assistance if needed.",
              "Perform two sets of eight controlled bodyweight squats.",
              "Perform two sets of six supported split squats per side.",
              "Perform three sets of six to ten supported split squats per side with a three-second lowering phase.",
            ][index]
          : /pull|row/.test(name)
            ? [
                "Use a secure bar and stable foot support, or a familiar row setup. Perform one set of five assisted, controlled pulling repetitions.",
                "Perform two sets of four to six assisted pulls at a fixed assistance or row load.",
                "Perform three sets of three to six controlled strict pulls if prepared, or a measured row at a challenging familiar load.",
                "Perform three sets of six to ten pulling repetitions using a measured load or slow-tempo strict technique suited to current capacity.",
              ][index]
            : /carry/.test(name)
              ? `Complete ${["three 15-second", "three 20-second", "four 30-second", "four 40-second"][index]} loaded carries on a clear flat route. Record load and distance; stop before posture or grip fails.`
              : /push/.test(name)
                ? [
                    "Perform one set of five wall pushups.",
                    "Perform two sets of six incline pushups on a stable surface.",
                    "Perform two sets of six to ten controlled floor pushups.",
                    "Perform three sets of six to twelve harder pushups with a slow lowering phase or low feet elevation.",
                  ][index]
                : `Complete ${[1, 2, 2, 3][index]} work sets of six to twelve reps for each familiar squat, push, pull, hip-hinge and core movement. Calibrate each variation or load separately.`;
    task +=
      " Rest 90–120 seconds between ordinary sets and about 2–3 minutes for demanding pulls. Keep roughly two clean repetitions possible; reduce difficulty if minimum clean reps cannot be completed. Record the actual setup and every set.";
    criteria = [
      "Use a consistent movement and range",
      "Complete the required work sets",
      "Record external load or assistance when used",
      "Keep about two clean reps in reserve during ordinary work",
    ];
    next =
      "After two comparable top-range sessions, add a small load or a harder variation and rebuild reps. Evaluate pushing, pulling, legs, hips and core separately.";
  } else {
    task = o.description;
    criteria = [
      "Complete the chosen routine",
      "Record what was actually done",
      "Check whether it served the intended need",
      "Keep the routine sustainable",
    ];
    next =
      "Maintain the useful dose. Sleep, prayer, meals and recovery do not need endless escalation.";
  }
  const family = (o.family || "").replace(/^extra-/, "");
  if (SPECIAL_PRACTICE[family]) task = SPECIAL_PRACTICE[family][index];
  const path =
    o.scope === "class"
      ? CLASSES.find((p) => o.id.startsWith(p.id + "-"))
      : undefined;
  if (
    path &&
    Object.entries(path.mix).sort((a, b) => b[1]! - a[1]!)[0]?.[0] ===
      "artificer"
  ) {
    task = [
      "Reproduce one safe worked build or simulation, then test its expected output.",
      "Build a familiar small item or system independently and test one normal case.",
      "Build or repair an unfamiliar safe sample; test a normal case and an edge case, then correct a fault.",
      "Integrate two components under declared constraints, reproduce a failure and verify a documented correction.",
    ][index];
    criteria = CAREER_RUBRICS.technology;
  }
  if (path) {
    const secondary = classSecondaryPractice(path);
    if (secondary) task += ` Class focus: ${secondary}`;
  }
  return { domain, task, criteria, next };
}
const localDay = (at: string) => new Date(at).toDateString();
const normalize = (s: string) => s.trim().toLowerCase();
const indexes = new WeakMap<
  Character,
  {
    completions: Character["completions"];
    checks: Character["abilityChecks"];
    count: number;
    checkCount: number;
    data: Map<string, AbilityCheck[]>;
  }
>();
function abilitySampleIndex(c: Character) {
  const cached = indexes.get(c);
  if (
    cached &&
    cached.completions === c.completions &&
    cached.checks === c.abilityChecks &&
    cached.count === c.completions.length &&
    cached.checkCount === (c.abilityChecks?.length || 0)
  )
    return cached.data;
  const data = new Map<string, AbilityCheck[]>();
  const add = (p: AbilityCheck) => {
    const list = data.get(p.key);
    if (list) list.push(p);
    else data.set(p.key, [p]);
  };
  for (const p of c.abilityChecks || []) add(p);
  for (const r of c.completions) {
    const p = r.result?.practice;
    if (!p) continue;
    const key = abilityKey(
      {
        ...c,
        activeClass: r.classId,
        profession: r.profession || c.profession,
        vocation: r.vocationId || null,
      },
      {
        id: r.id,
        family: r.family,
        scope: r.scope,
        stat: r.stat,
        careerCategory: r.careerCategory,
      },
    );
    add({
      id: `${r.id}:${r.period}`,
      at: r.at,
      key,
      protocol: "work-sample-v1",
      subject: p.subject,
      source: p.source,
      level: p.level,
      value:
        r.result!.correct !== undefined && r.result!.attempted
          ? r.result!.correct
          : p.criteriaMet,
      total: r.result!.attempted || p.criteriaTotal,
      unfamiliar: p.unfamiliar,
      independent: p.independent,
    });
  }
  for (const records of data.values())
    records.reverse().sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  indexes.set(c, {
    completions: c.completions,
    checks: c.abilityChecks,
    count: c.completions.length,
    checkCount: c.abilityChecks?.length || 0,
    data,
  });
  return data;
}
export function abilityRecommendation(
  c: Character,
  o: Objective,
  subject?: string,
  now = new Date(),
) {
  if (!c.abilityChecks?.length && !c.completions.length) return undefined;
  const key = abilityKey(c, o);
  const samples = (abilitySampleIndex(c).get(key) || []).filter(
    (p) =>
      (!subject || normalize(p.subject) === normalize(subject)) &&
      Date.parse(p.at) <= now.getTime() &&
      now.getTime() - Date.parse(p.at) <= 90 * 86400000,
  );
  const latest = samples[0];
  if (!latest) return undefined;
  const cohort: AbilityCheck[] = [];
  for (const p of samples) {
    if (
      normalize(p.subject) !== normalize(latest.subject) ||
      p.protocol !== latest.protocol
    )
      continue;
    if (
      p.level !== latest.level ||
      normalize(p.source) !== normalize(latest.source)
    )
      break;
    cohort.push(p);
  }
  const uniqueDays = new Map<string, AbilityCheck>();
  for (const p of cohort)
    if (!uniqueDays.has(localDay(p.at))) uniqueDays.set(localDay(p.at), p);
  const days = [...uniqueDays.values()].slice(0, 2);
  const ratio = (p: AbilityCheck) => p.value / p.total;
  const mastered =
    days.length === 2 &&
    days.every(
      (p) =>
        p.independent &&
        (["strength", "aerobic", "coordination"].includes(abilityDomain(o)) ||
          p.unfamiliar) &&
        ratio(p) >= 0.85,
    );
  const struggling = days.length === 2 && days.every((p) => ratio(p) < 0.6);
  const index = REGIMEN_RANKS.indexOf(latest.level);
  const initialTooHard =
    ratio(latest) < 0.6 ||
    (index >= 1 && !latest.independent) ||
    (index >= 2 &&
      !["strength", "aerobic", "coordination"].includes(abilityDomain(o)) &&
      !latest.unfamiliar);
  const level =
    REGIMEN_RANKS[
      Math.max(
        0,
        Math.min(
          3,
          index + (mastered ? 1 : struggling || initialTooHard ? -1 : 0),
        ),
      )
    ];
  return {
    level,
    latest,
    mastered,
    struggling,
    samples: samples.length,
    reason: mastered
      ? latest.level === "C"
        ? "Mastered current daily tier; use a harder source level or a prepared project."
        : "Two comparable independent checks met the standard; next tier suggested."
      : struggling
        ? "Two comparable checks were below target; prerequisite practice suggested."
        : initialTooHard
          ? "Latest check needs a prerequisite or more independent work; try a lower-tier sample."
          : "Latest activity-specific check sets the starting tier.",
  };
}
export function recordAbilityCheck(
  c: Character,
  o: Objective,
  sample: PracticeEvidence,
  now = new Date(),
): Character {
  if (!validPracticeEvidence(sample) || abilityDomain(o) === "recovery")
    return c;
  const check: AbilityCheck = {
    id: crypto.randomUUID(),
    at: now.toISOString(),
    key: abilityKey(c, o),
    protocol: "work-sample-v1",
    subject: sample.subject.trim(),
    source: sample.source.trim(),
    level: sample.level,
    value: sample.criteriaMet,
    total: sample.criteriaTotal,
    unfamiliar: sample.unfamiliar,
    independent: sample.independent,
  };
  const next = { ...c, abilityChecks: [...(c.abilityChecks || []), check] };
  const level = abilityRecommendation(next, o, check.subject, now)!.level;
  return {
    ...next,
    proficiencies: {
      ...c.proficiencies,
      [check.key]: {
        rank: level,
        topic: check.subject,
        criterion: `Compare the same activity against ${check.source}`,
        reviewedAt: now.toISOString(),
      },
    },
  };
}
// For physical output with no comparable quality record, time/reps alone never auto-promote.
export function comparableTraining(
  c: Character,
  id: string,
  environment: string,
  session?: "A" | "B",
) {
  const now = Date.now();
  const records = c.completions
    .filter(
      (r) =>
        r.workout?.environment === environment &&
        (!session || r.workout.session === session) &&
        r.result?.workout?.exercises.some((e) => e.id === id) &&
        Date.parse(r.at) <= now &&
        now - Date.parse(r.at) <= 90 * 86400000,
    )
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const name = records[0]?.workout?.exercises.find((e) => e.id === id)?.name;
  return records
    .filter((r) => r.workout?.exercises.find((e) => e.id === id)?.name === name)
    .slice(0, 2);
}
export function physicalActivityRank(
  c: Character,
  o: Objective,
): RegimenRank | undefined {
  const family = o.practice?.family || o.family || "";
  const a =
    [...(c.assessmentHistory || [])].sort(
      (a, b) => Date.parse(b.at) - Date.parse(a.at),
    )[0]?.assessment || c.baseline.assessment;
  if (family === "u-pull" && a?.pullups != null)
    return a.pullups >= 10
      ? "C"
      : a.pullups >= 4
        ? "D"
        : a.pullups >= 1
          ? "E"
          : "F";
  if (
    (family === "u-legs" || family === "u-squat") &&
    a?.strengthTest === "chair" &&
    a.chairStands != null
  )
    return !a.chairAssisted && a.chairStands >= 25
      ? "D"
      : !a.chairAssisted && a.chairStands >= 15
        ? "E"
        : "F";
  if (family === "u-balance" && a?.balanceSeconds != null)
    return a.balanceSeconds >= 30 ? "D" : a.balanceSeconds >= 10 ? "E" : "F";
  // Only measured completed duration in the same activity establishes session tolerance.
  const samples = c.completions
    .filter(
      (r) =>
        r.family === family &&
        r.result?.minutes &&
        ["CON", "DEX"].includes(r.stat),
    )
    .slice(-3);
  if (samples.length && abilityDomain(o) === "aerobic") {
    const minutes = Math.min(...samples.map((r) => r.result!.minutes!));
    if (family === "u-run")
      return samples.length >= 2 &&
        samples.every((r) => (r.result?.distanceKm || 0) >= 5)
        ? "C"
        : minutes >= 20
          ? "D"
          : "E";
    return minutes >= 45
      ? "C"
      : minutes >= 30
        ? "D"
        : minutes >= 15
          ? "E"
          : "F";
  }
  return undefined;
}
export function completionSubject(r: Completion) {
  return r.result?.practice?.subject || r.result?.topic;
}
