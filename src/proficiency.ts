import type { Character, Objective } from "./domain";
import type { RegimenRank } from "./training-prescriptions";
import { REGIMEN_RANKS } from "./training-prescriptions";
import { CAREER_GUIDES } from "./career-guides";
import { CLASSES } from "./class-catalog";
import { VOCATIONS } from "./careers";
import { latestPush } from "./training-regimen";
export interface Proficiency {
  rank: RegimenRank;
  topic: string;
  criterion: string;
  reviewedAt: string;
}
export const validProficiencies = (
  input: unknown,
): input is Record<string, Proficiency> =>
  !!input &&
  typeof input === "object" &&
  !Array.isArray(input) &&
  Object.entries(input).length <= 200 &&
  Object.entries(input).every(
    ([key, p]) =>
      key.length > 0 &&
      key.length <= 180 &&
      !!p &&
      REGIMEN_RANKS.includes(p.rank) &&
      typeof p.topic === "string" &&
      p.topic.trim().length >= 2 &&
      p.topic.length <= 100 &&
      typeof p.criterion === "string" &&
      p.criterion.trim().length >= 8 &&
      p.criterion.length <= 280 &&
      Number.isFinite(Date.parse(p.reviewedAt)),
  );
export function proficiencyKey(c: Character, o: Objective): string {
  if (o.scope === "profession")
    return o.id.startsWith("vocation-")
      ? `vocation:${c.vocation}`
      : `career:${o.careerCategory || "general"}:${c.profession}`;
  if (o.scope === "class") return `class:${c.activeClass}:${o.stat}`;
  return `activity:${o.family || o.requestGroup || o.id}`;
}
export const PROFICIENCY_LEVELS = {
  F: "New · follow an example, then repeat one small part unaided",
  E: "Foundation · complete familiar work unaided; correct errors with a guide",
  D: "Independent · solve unfamiliar standard work and verify the result",
  C: "Challenging · handle constraints, transfer the skill and defend decisions",
};
export function recommendedRequest(
  c: Character,
  variants: Objective[],
): Objective {
  const first = variants[0];
  if (!first) return first;
  let target = c.proficiencies?.[proficiencyKey(c, first)]?.rank;
  const a = c.assessmentHistory?.at(-1)?.assessment || c.baseline.assessment;
  const pushing = latestPush(c);
  if (!target && first.family === "u-push" && pushing) {
    const n = pushing.count;
    target =
      pushing.style === "floor"
        ? n >= 30
          ? "C"
          : n >= 8
            ? "D"
            : n >= 1
              ? "E"
              : "F"
        : pushing.style === "wall" && n < 20
          ? "F"
          : "E";
  }
  if (!target && first.workout)
    target =
      c.trainingPlan?.rank ||
      (a?.strengthTest === "pushups" &&
      a.pushupStyle === "floor" &&
      (a.pushups || 0) >= 12
        ? "E"
        : "F");
  if (!target && first.family === "u-walk" && a?.mileSeconds) target = "E";
  // Unknown ability stays visible as uncalibrated. Never infer real proficiency from RPG stats.
  if (!target) return variants.find((o) => o.rank === "D") || first;
  return (
    variants.find((o) => o.rank === target) ||
    variants.reduce(
      (best, o) =>
        Math.abs(
          REGIMEN_RANKS.indexOf(o.rank as RegimenRank) -
            REGIMEN_RANKS.indexOf(target!),
        ) <
        Math.abs(
          REGIMEN_RANKS.indexOf(best.rank as RegimenRank) -
            REGIMEN_RANKS.indexOf(target!),
        )
          ? o
          : best,
      first,
    )
  );
}
export function proficiencyFeedback(c: Character, o: Objective) {
  const key = proficiencyKey(c, o),
    p = c.proficiencies?.[key];
  if (!p) return "Set a subject and starting difficulty in Ability settings.";
  const last = c.completions
    .filter(
      (r) =>
        r.result?.topic?.trim().toLowerCase() ===
          p.topic.trim().toLowerCase() &&
        r.result?.attempted &&
        r.result.correct != null &&
        r.rank === p.rank &&
        (o.scope === "class"
          ? r.classId === c.activeClass && r.scope === "class"
          : o.scope === "profession"
            ? r.careerCategory === o.careerCategory &&
              r.profession === c.profession &&
              (o.id.startsWith("vocation-")
                ? r.id.startsWith("vocation-") && r.vocationId === c.vocation
                : !r.id.startsWith("vocation-"))
            : r.family === o.family),
    )
    .slice(-2);
  if (
    last.length !== 2 ||
    new Set(last.map((r) => new Date(r.at).toDateString())).size !== 2
  )
    return "Use two separate-day checks on the same subject and comparable question source before reviewing difficulty.";
  const ratios = last.map((r) => r.result!.correct! / r.result!.attempted!);
  return ratios.every((r) => r >= 0.85)
    ? "Two checks reached 85%+. Review a harder set of unfamiliar problems; raise difficulty only if its criterion is met."
    : ratios.every((r) => r < 0.6)
      ? "Both checks were below 60%. Use a simpler prerequisite or a smaller practice block, then check again."
      : "Keep the difficulty. Correct errors, then retry comparable material on a later day.";
}
export function applyProficiency(o: Objective, c: Character): Objective {
  const p = c.proficiencies?.[proficiencyKey(c, o)];
  if (
    o.cadence !== "daily" ||
    o.workout ||
    o.id.includes("technique-daily") ||
    o.kind === "class-trial" ||
    (o.scope === "universal" && !p)
  )
    return o;
  if (!(["INT", "WIS", "CHA"].includes(o.stat) || o.scope === "profession"))
    return p
      ? {
          ...o,
          description: `${o.description} Setup: ${p.topic}. Success criterion: ${p.criterion}.`,
        }
      : o;
  const steps: Record<RegimenRank, string> = {
    F: "Study one worked example for 3 minutes. Close it and reproduce one essential step; check and correct the result. Spend 5–10 minutes total.",
    E: "Work for 15 minutes on three familiar examples without copying a solution. Check each against a reliable answer key or rubric, correct errors, and retry one later.",
    D: "Spend 25 minutes on at least three unfamiliar standard problems or one equivalent work sample. Explain the method, check the outcome, and redo the weakest part without notes.",
    C: "Spend 35–45 minutes on an unfamiliar case with two real constraints (for example incomplete information and a time or resource limit). Compare two approaches, test the result, and defend the trade-off against the declared rubric.",
  };
  const rank = (o.rank || p?.rank || "D") as RegimenRank;
  if (o.stat === "CHA" && o.scope !== "profession") {
    const work = {
      F: "Record a 60-second explanation and identify one unclear sentence.",
      E: "Record a two-minute explanation for a beginner; replace jargon, add a concrete example and record the revised version.",
      D: "Listen once to an unfamiliar two-minute explanation, summarize it aloud, check the source, and re-record after correcting missing or invented details.",
      C: "Prepare a five-minute explanation of an unfamiliar topic for two different audiences. Record both, compare clarity, structure, accuracy and audience fit, and rework the weakest minute.",
    };
    return {
      ...o,
      description: `${work[rank]} Subject: ${p?.topic || "choose a specific topic"}. Success criterion: ${p?.criterion || "main point first, accurate supporting detail, usable next step, and a reviewed revision"}. Keep both attempts and review one measurable change.`,
    };
  }
  if (o.stat === "WIS" && o.scope !== "profession") {
    const faith = /bible|scripture|disciple|cleric|prayer/i.test(
      `${o.id} ${o.description}`,
    );
    const work = faith
      ? {
          F: "Read a short Bible passage in its chapter context. State the speaker, audience and main point; check against the text.",
          E: "Outline a complete Bible paragraph without notes, then verify its context and correct unsupported assumptions.",
          D: "Compare two interpretations of a Bible passage using the surrounding chapter and a reliable commentary. Separate textual evidence from application.",
          C: "Study a difficult Bible passage in its full literary context. Compare two supported interpretations, examine the strongest objection to your conclusion, and record one application to review later.",
        }
      : {
          F: "Record one prediction with its reason and a checkable outcome date.",
          E: "For one decision, separate observed facts from assumptions and state your confidence before checking the outcome.",
          D: "Review five dated predictions on one subject. Compare confidence with outcomes, identify one recurring error, and change a decision rule.",
          C: "Analyze an unfamiliar uncertain decision using two plausible explanations, relevant base rates, consequences and a disconfirming test. Record your forecast before seeing the result, then schedule a review.",
        };
    return {
      ...o,
      description: `${work[rank]} Subject: ${p?.topic || "choose a specific subject"}. Success criterion: ${p?.criterion || "state evidence, uncertainty, one correction and a later check"}.`,
    };
  }
  const guide =
    o.scope === "profession" && o.careerCategory
      ? CAREER_GUIDES[o.careerCategory]
      : undefined;
  const goal =
    o.scope === "class"
      ? CLASSES.find((x) => x.id === c.activeClass)?.goal
      : undefined;
  const assignment = guide ? guide[{ F: 0, E: 2, D: 5, C: 9 }[rank]] : goal;
  const vocation = o.id.startsWith("vocation-")
    ? VOCATIONS.find((v) => v.id === c.vocation)
    : undefined;
  const introduction = vocation
    ? `Focus: ${vocation.practice} ${assignment || ""}`
    : assignment
      ? `Focus: ${assignment}`
      : o.description;
  return {
    ...o,
    description: `${introduction}\nSubject: ${p?.topic || "choose a specific subject in Ability settings"}. ${steps[rank] || steps.D} Success criterion: ${p?.criterion || "declare an answer key or performance rubric before starting"}. Record the source/version, difficulty and actual outcome; a familiar easy set does not demonstrate the next tier.`,
    tags: [...(o.tags || []), ...(p ? [p.topic] : [])],
  };
}
