import type { Character, Objective } from "./domain";
import type { RegimenRank } from "./training-prescriptions";
import { REGIMEN_RANKS } from "./training-prescriptions";
import { latestPush } from "./training-regimen";
import {
  abilityKey,
  abilityRecommendation,
  abilityBrief,
  physicalActivityRank,
} from "./adaptive-ability";
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
export function activeProficiency(c: Character, o: Objective) {
  if (!c.proficiencies) return undefined;
  const exact = c.proficiencies?.[abilityKey(c, o)];
  if (exact) return exact;
  const main =
    o.scope === "universal" ||
    o.id.replace(/-proficiency-[fedc]$/, "") === "profession-daily" ||
    o.id.replace(/-proficiency-[fedc]$/, "") === `${c.activeClass}-daily` ||
    o.id.replace(/-proficiency-[fedc]$/, "") === `vocation-${c.vocation}-daily`;
  return main ? c.proficiencies?.[proficiencyKey(c, o)] : undefined;
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
  const profile = activeProficiency(c, first);
  const measured = abilityRecommendation(c, first, profile?.topic);
  let target =
    measured?.level || profile?.rank || physicalActivityRank(c, first);
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
  if (!target) return variants[0];
  const distance = (o: Objective) =>
    Math.abs(
      ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"].indexOf(o.rank || "F") -
        REGIMEN_RANKS.indexOf(target!),
    );
  return (
    variants.find((o) => o.rank === target) ||
    variants.reduce(
      (best, o) => (distance(o) < distance(best) ? o : best),
      first,
    )
  );
}
export function proficiencyFeedback(c: Character, o: Objective) {
  const p = activeProficiency(c, o);
  const adaptive = abilityRecommendation(c, o, p?.topic);
  if (adaptive)
    return `${adaptive.level} suggested · ${adaptive.latest.subject} · ${adaptive.reason}`;
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
  if (o.cadence !== "daily") {
    if (!c.proficiencies && !c.abilityChecks?.length && !c.completions.length)
      return o;
    const profile = activeProficiency(c, o),
      recommendation = abilityRecommendation(c, o, profile?.topic);
    const subject = profile?.topic || recommendation?.latest.subject;
    if (!subject || o.kind === "class-trial") return o;
    const brief = abilityBrief(
      o,
      recommendation?.level || profile?.rank || "F",
    );
    if (brief.domain === "recovery") return o;
    return {
      ...o,
      description: `${o.description} Preparation subject: ${subject}. Review actual work against: ${brief.criteria.join("; ")}. ${brief.next} The request's stated calendar, practice-day and achievement requirements still apply.`,
      tags: [...(o.tags || []), subject],
    };
  }
  if (
    o.cadence !== "daily" ||
    o.workout ||
    o.kind === "class-trial" ||
    o.id.includes("technique-daily")
  )
    return o;
  const profile = activeProficiency(c, o);
  const recommendation = abilityRecommendation(c, o, profile?.topic);
  const rank = (
    o.rank && REGIMEN_RANKS.includes(o.rank as RegimenRank) ? o.rank : "F"
  ) as RegimenRank;
  const brief = abilityBrief(o, rank);
  if (brief.domain === "recovery") return o;
  const subject = profile?.topic || recommendation?.latest.subject;
  if (["strength", "aerobic"].includes(brief.domain) && o.scope !== "class")
    return { ...o, description: `${o.description} ${brief.next}` };
  return {
    ...o,
    description: `${brief.task}${subject ? ` Subject: ${subject}.` : ""} Success criteria: ${brief.criteria.join("; ")}.${profile ? ` Comparison source/criterion: ${profile.criterion}.` : ""} ${brief.next}`,
    tags: [...(o.tags || []), ...(subject ? [subject] : [])],
  };
}
