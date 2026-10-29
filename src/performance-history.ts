import type { Character } from "./domain";
import type { Assessment } from "./metrics";
import { checkScore } from "./metrics";
import { FITNESS_PROTOCOLS } from "./exams";
export interface PerformanceSeries {
  id: string;
  title: string;
  unit: string;
  lower?: boolean;
  points: { key: string; at: string; label: string; value: number }[];
}
export function performanceHistory(
  c: Character,
  start: Date,
  now = new Date(),
): PerformanceSeries[] {
  const groups = new Map<string, PerformanceSeries>();
  const imperial = c.preferences?.units === "imperial";
  const add = (
    id: string,
    title: string,
    unit: string,
    at: string,
    value: number | null | undefined,
    key: string,
    lower = false,
  ) => {
    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(value) ||
      new Date(at) < start ||
      new Date(at) > now
    )
      return;
    const factor =
      imperial && unit === "kg"
        ? 2.2046226218
        : imperial && unit === "metres"
          ? 1.0936132983
          : 1;
    const group = groups.get(id) || {
      id,
      title,
      unit:
        imperial && unit === "kg"
          ? "lb"
          : imperial && unit === "metres"
            ? "yards"
            : unit,
      lower,
      points: [],
    };
    group.points.push({
      key,
      at,
      label: new Date(at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      value: Math.round(value * factor * 10) / 10,
    });
    groups.set(id, group);
  };
  const assessment = (a: Assessment, at: string, key: string) => {
    if (a.strengthTest === "pushups")
      add(
        `push-${a.pushupStyle}`,
        `${a.pushupStyle[0].toUpperCase() + a.pushupStyle.slice(1)} pushups`,
        "repetitions",
        at,
        a.pushups,
        key,
      );
    if (a.strengthTest === "grip")
      add("grip", "Maximum grip force", "kg", at, a.gripKg, key);
    if (a.strengthTest === "chair")
      add(
        a.chairAssisted ? "chair-assisted" : "chair",
        `${a.chairAssisted ? "Assisted" : "Unassisted"} chair stands in 30 seconds`,
        "repetitions",
        at,
        a.chairStands,
        key,
      );
    if (a.strengthTest === "weighted" && a.liftReps)
      add(
        `bench${a.liftReps}`,
        `Bench press · ${a.liftReps} repetitions`,
        "kg",
        at,
        a.liftKg,
        key,
      );
    add(
      "balance",
      "One-leg balance, eyes open",
      "seconds",
      at,
      a.balanceSeconds,
      key,
    );
    add(
      "walk6",
      "Distance walked in six minutes",
      "metres",
      at,
      a.walkMetres,
      key,
    );
    add(
      `mile-${a.mileMode || "walk"}`,
      `One-mile ${a.mileMode || "walk"} time`,
      "seconds",
      at,
      a.mileSeconds,
      key,
      true,
    );
    add(
      "pullups",
      "Maximum consecutive strict pullups",
      "repetitions",
      at,
      a.pullups,
      key,
    );
    for (const stat of ["INT", "WIS", "CHA"] as const) {
      const r = a.mental?.[stat];
      if (r?.formId)
        add(
          `${stat}-${r.formId.includes("-v3-") ? "v3" : "v2"}-c${r.challenge || 1}`,
          `${stat} game check · challenge ${r.challenge || 1}`,
          stat === "CHA" && r.formId.includes("-v3-")
            ? "self-review / 5"
            : "correct / 5",
          r.completedAt,
          checkScore(stat, r.answers, r.formId),
          `${key}-${stat}`,
        );
    }
  };
  if (c.assessmentHistory?.length)
    c.assessmentHistory.forEach((h, i) =>
      assessment(h.assessment, h.at, `assessment-${i}`),
    );
  else if (c.baseline.assessment)
    assessment(c.baseline.assessment, c.createdAt, "baseline");
  for (const e of c.exams || []) {
    if (e.status === "started") continue;
    const p = FITNESS_PROTOCOLS.find((p) => p.id === e.protocol);
    if (p) add(p.id, p.name, p.unit, e.at, e.value, e.id, p.lower);
    if (e.mental?.formId && ["INT", "WIS", "CHA"].includes(e.stat)) {
      const stat = e.stat as "INT" | "WIS" | "CHA";
      add(
        `${stat}-${e.mental.formId.includes("-v3-") ? "v3" : "v2"}-c${e.mental.challenge || 1}`,
        `${stat} game check · challenge ${e.mental.challenge || 1}`,
        stat === "CHA" && e.mental.formId.includes("-v3-")
          ? "self-review / 5"
          : "correct / 5",
        e.at,
        checkScore(stat, e.mental.answers, e.mental.formId),
        e.id,
      );
    }
  }
  return [...groups.values()].map((g) => ({
    ...g,
    points: g.points.sort((a, b) => Date.parse(a.at) - Date.parse(b.at)),
  }));
}
