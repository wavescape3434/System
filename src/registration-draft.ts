import type { Baseline } from "./domain";
import { CLASSES } from "./domain";
import { PROFESSIONS } from "./professions";
import { validAssessment } from "./metrics";
import { validMentalFormId } from "./exam-bank";
import { findAppearance } from "./appearance-catalog";
export const REGISTRATION_DRAFT_KEY = "the-guild.registration-draft.v1";
export interface RegistrationDraft {
  careerAbility?: string;
  careerTopic?: string;
  step: number;
  name: string;
  appearance?: string;
  baseline: Baseline;
  seenForms: string[];
  units: "metric" | "imperial";
  classId: string;
  profession: string;
}
export function loadRegistrationDraft(): RegistrationDraft | null {
  try {
    const d = JSON.parse(
      localStorage.getItem(REGISTRATION_DRAFT_KEY) || "null",
    );
    return d &&
      (d.careerAbility === undefined ||
        ["", "F", "E", "D", "C"].includes(d.careerAbility)) &&
      (d.careerTopic === undefined ||
        (typeof d.careerTopic === "string" && d.careerTopic.length <= 100)) &&
      [1, 2, 3].includes(d.step) &&
      typeof d.name === "string" &&
      d.name.length <= 32 &&
      d.baseline &&
      validAssessment(d.baseline.assessment) &&
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
      ].every((k) => Number.isFinite(d.baseline[k]) && d.baseline[k] >= 0) &&
      ["bodyweight", "weights"].includes(d.baseline.mode) &&
      ["metric", "imperial"].includes(d.units) &&
      CLASSES.some((c) => c.id === d.classId) &&
      PROFESSIONS.includes(d.profession) &&
      Array.isArray(d.seenForms) &&
      d.seenForms.every(validMentalFormId) &&
      (d.appearance === undefined || !!findAppearance(d.appearance))
      ? d
      : null;
  } catch {
    return null;
  }
}
export function saveRegistrationDraft(draft: RegistrationDraft) {
  try {
    localStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* Registration can continue without a draft. */
  }
}
export function clearRegistrationDraft() {
  try {
    localStorage.removeItem(REGISTRATION_DRAFT_KEY);
  } catch {
    /* Character progress has its own save. */
  }
}
