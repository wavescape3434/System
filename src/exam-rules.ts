import type { Character, Attribute } from "./domain";
import type { MentalResult } from "./exam-bank";
export type ExamScope = "class" | "profession";
export interface ExamRecord {
  id: string;
  scope: ExamScope;
  owner: string;
  milestone: number;
  stat: Attribute;
  at: string;
  status: "started" | "baseline" | "failed" | "passed";
  protocol?: string;
  value?: number;
  baseline?: number;
  mental?: MentalResult;
  note?: string;
  formId?: string;
}
export function certifiedLevel(
  c: Character,
  scope: ExamScope,
  owner: string,
  candidate: number,
): number {
  if (c.examVersion !== 1) return candidate;
  const floor =
    (scope === "class"
      ? c.examGrandfather?.classes[owner]
      : c.examGrandfather?.professions[owner]) || 1;
  const passed = new Set(
    (c.exams || [])
      .filter(
        (e) => e.scope === scope && e.owner === owner && e.status === "passed",
      )
      .map((e) => e.milestone),
  );
  let next = (Math.floor(floor / 5) + 1) * 5;
  while (next <= candidate) {
    if (!passed.has(next)) return next - 1;
    next += 5;
  }
  return candidate;
}
export function nextExamLevel(
  c: Character,
  scope: ExamScope,
  owner: string,
): number {
  const floor =
    (scope === "class"
      ? c.examGrandfather?.classes[owner]
      : c.examGrandfather?.professions[owner]) || 1;
  const passed = new Set(
    (c.exams || [])
      .filter(
        (e) => e.scope === scope && e.owner === owner && e.status === "passed",
      )
      .map((e) => e.milestone),
  );
  let next = (Math.floor(floor / 5) + 1) * 5;
  while (passed.has(next)) next += 5;
  return next;
}
export const physicalPass = (value: number, baseline: number, lower = false) =>
  Number.isFinite(value) &&
  value > 0 &&
  (lower
    ? value <= baseline * 0.95
    : value >= Math.max(baseline * 1.05, baseline + 1));
export function mentalPass(
  current: MentalResult,
  previous: MentalResult | undefined,
  score: (r: MentalResult) => number,
): boolean {
  if (!previous) return false;
  const now = score(current),
    before = score(previous);
  if (now < 4) return false;
  if (now > before) return true;
  return (
    !!current.durationMs &&
    !!previous.durationMs &&
    now >= before &&
    current.durationMs <= previous.durationMs * 0.95
  );
}
