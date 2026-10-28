import type { WorkoutPrescription } from "./training-prescriptions";
import { canonicalWorkout } from "./training-prescriptions";
export interface WorkoutDraftRow {
  variation: string;
  reps: string[];
  load: string;
  rir: string;
}
export function readWorkoutDraft(
  key: string,
  p: WorkoutPrescription,
): WorkoutDraftRow[] | undefined {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "null");
    if (
      !raw ||
      raw.version !== 1 ||
      raw.prescription !== canonicalWorkout(p) ||
      !Array.isArray(raw.rows) ||
      raw.rows.length !== p.exercises.length
    )
      return;
    if (
      raw.rows.every(
        (r: WorkoutDraftRow, i: number) =>
          r &&
          typeof r.variation === "string" &&
          r.variation.length <= 100 &&
          typeof r.load === "string" &&
          r.load.length <= 20 &&
          typeof r.rir === "string" &&
          r.rir.length <= 2 &&
          Array.isArray(r.reps) &&
          r.reps.length === p.exercises[i].sets &&
          r.reps.every((v) => typeof v === "string" && v.length <= 10),
      )
    )
      return raw.rows;
  } catch {
    /* A malformed optional draft cannot change character progress. */
  }
}
export function saveWorkoutDraft(
  key: string,
  p: WorkoutPrescription,
  rows: WorkoutDraftRow[],
): boolean {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        prescription: canonicalWorkout(p),
        rows,
        updated: Date.now(),
      }),
    );
    return true;
  } catch {
    return false;
  }
}
export function clearWorkoutDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* Submitted progress is already in the primary save. */
  }
}
export function pruneWorkoutDrafts(prefix: string, keep: string) {
  try {
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix) && k !== keep)
      .sort((a, b) => {
        try {
          return (
            (JSON.parse(localStorage.getItem(b) || "{}").updated || 0) -
            (JSON.parse(localStorage.getItem(a) || "{}").updated || 0)
          );
        } catch {
          return 0;
        }
      });
    for (const k of keys.slice(1)) localStorage.removeItem(k);
  } catch {
    /* Optional drafts never block a workout. */
  }
}
