import {
  readWorkoutDraft,
  saveWorkoutDraft,
  clearWorkoutDraft,
  pruneWorkoutDrafts,
} from "./workout-drafts";
import { useEffect, useState } from "react";
import type { WorkoutPrescription, WorkoutLog } from "./training-prescriptions";
import { validWorkoutLog } from "./training-prescriptions";
import type { Character } from "./domain";
import { exerciseProgress } from "./training-regimen";
export default function WorkoutRecordForm({
  c,
  prescription: p,
  onSubmit,
  pending,
  receiptKey,
  ready = true,
}: {
  c: Character;
  prescription: WorkoutPrescription;
  onSubmit: (w: WorkoutLog) => Promise<boolean>;
  pending: boolean;
  receiptKey: string;
  ready?: boolean;
}) {
  const imperial = c.preferences?.units === "imperial",
    factor = imperial ? 2.2046226218 : 1;
  const draftKey = `guild.workout-draft.${c.id}.${receiptKey}.${imperial ? "imperial" : "metric"}`;
  const [submitting, setSubmitting] = useState(false),
    [draftError, setDraftError] = useState(false);
  const [rows, setRows] = useState(
    () =>
      readWorkoutDraft(draftKey, p) ||
      p.exercises.map((e) => {
        const last = exerciseProgress(c, p, e.id).latest;
        return {
          variation: last?.variation || e.name,
          reps: Array.from({ length: e.sets }, () => ""),
          load: last?.loadKg
            ? String(Math.round(last.loadKg * factor * 100) / 100)
            : "",
          rir: "",
        };
      }),
  );
  const [error, setError] = useState("");
  useEffect(() => {
    setDraftError(!saveWorkoutDraft(draftKey, p, rows));
    pruneWorkoutDrafts(`guild.workout-draft.${c.id}.`, draftKey);
  }, [draftKey, p, rows, c.id]);
  const change = (i: number, patch: Partial<(typeof rows)[number]>) =>
    setRows((r) => r.map((v, n) => (n === i ? { ...v, ...patch } : v)));
  return (
    <form
      className="workout-record"
      aria-label="Record workout"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!ready) {
          setError("Complete the class-focus checklist before submitting.");
          return;
        }
        const result: WorkoutLog = {
          prescription: p,
          exercises: rows.map((r, i) => ({
            id: p.exercises[i].id,
            variation: r.variation.trim(),
            reps: r.reps.map((n) => (n.trim() ? Number(n) : NaN)),
            rir: r.rir.trim() ? Number(r.rir) : NaN,
            ...(r.load.trim() ? { loadKg: Number(r.load) / factor } : {}),
          })),
        };
        if (!validWorkoutLog(result)) {
          setError(
            "Record each work set at or above the minimum, the exercise setup, and clean reps left (0–10). Loads must be positive when entered.",
          );
          return;
        }
        if (pending || submitting) return;
        setError("");
        setSubmitting(true);
        try {
          if (await onSubmit(result)) clearWorkoutDraft(draftKey);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <h3>Record work sets</h3>
      {p.exercises.map((e, i) => (
        <fieldset key={e.id} disabled={pending || submitting}>
          <legend>
            {i + 1}. {e.name}
          </legend>
          <label>
            Setup / variation
            <input
              maxLength={100}
              value={rows[i].variation}
              onChange={(ev) => change(i, { variation: ev.target.value })}
            />
          </label>
          {e.perSide && (
            <small>
              Reps on each side; enter the lower count if the sides differ.
            </small>
          )}
          <div className="workout-set-fields">
            {rows[i].reps.map((reps, n) => (
              <label key={n}>
                Set {n + 1}
                {e.perSide ? " · each side" : ""}
                <input
                  aria-label={`${e.name} set ${n + 1} reps`}
                  type="number"
                  inputMode="numeric"
                  min={e.min}
                  max={1000}
                  step="1"
                  value={reps}
                  onChange={(ev) =>
                    change(i, {
                      reps: rows[i].reps.map((v, j) =>
                        j === n ? ev.target.value : v,
                      ),
                    })
                  }
                />
              </label>
            ))}
          </div>
          {e.sets > 1 && (
            <button
              type="button"
              className="text-button"
              onClick={() =>
                change(i, { reps: rows[i].reps.map(() => String(e.max)) })
              }
            >
              All sets completed: {e.max} reps{e.perSide ? " each side" : ""}
            </button>
          )}
          <div className="workout-set-fields">
            {e.load && (
              <label>
                Load ({imperial ? "lb" : "kg"}, total moved)
                <input
                  aria-label={`${e.name} load`}
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="any"
                  value={rows[i].load}
                  onChange={(ev) => change(i, { load: ev.target.value })}
                />
              </label>
            )}
            <label>
              Clean reps left
              <select
                aria-label={`${e.name} clean reps left`}
                value={rows[i].rir}
                onChange={(ev) => change(i, { rir: ev.target.value })}
              >
                <option value="">Choose effort</option>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option value={n} key={n}>
                    {n}
                    {n === 0
                      ? " · no reps left"
                      : n === 10
                        ? " · 10 or more"
                        : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>
      ))}
      {draftError && (
        <p role="alert">
          This device could not save the unfinished workout. Keep this screen
          open until you submit.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <button
        className="button primary full"
        disabled={pending || submitting || !ready}
        type="submit"
      >
        Submit workout
      </button>
    </form>
  );
}
