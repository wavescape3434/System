import type { Objective } from "./domain";
import type { ResultDraft } from "./activity-results";
export default function ActivityResultForm({
  o,
  draft,
  onChange,
  imperial,
  error,
}: {
  o: Objective;
  draft: ResultDraft;
  onChange: (d: ResultDraft) => void;
  imperial: boolean;
  error?: string;
}) {
  const physical = ["STR", "DEX", "CON"].includes(o.stat);
  const number = (
    key: keyof ResultDraft,
    label: string,
    step = "any",
    min?: string,
  ) => (
    <label key={key}>
      {label}
      <input
        type="number"
        inputMode={step === "1" ? "numeric" : "decimal"}
        min={min || (step === "1" ? "1" : "0.01")}
        step={step}
        value={draft[key]}
        onChange={(e) => onChange({ ...draft, [key]: e.target.value })}
      />
    </label>
  );
  return (
    <section className="activity-results" aria-label="Activity results">
      <h3>
        Results <small>Optional</small>
      </h3>
      <div className="result-fields">
        {physical && (
          <>
            <label className="result-wide">
              Exercise / variation
              <input
                maxLength={80}
                placeholder="e.g. Floor pushups, incline pushups, cycling"
                value={draft.exercise}
                onChange={(e) =>
                  onChange({ ...draft, exercise: e.target.value })
                }
              />
            </label>
            {o.stat !== "CON" && (
              <>
                {number("sets", "Sets", "1")}
                {number("reps", "Reps per set (or total without sets)", "1")}
              </>
            )}
            {o.stat === "STR" &&
              number("loadKg", `Load (${imperial ? "lb" : "kg"})`)}
            {(o.stat === "CON" || /carry/i.test(o.title)) &&
              number("distanceKm", `Distance (${imperial ? "mi" : "km"})`)}
          </>
        )}
        {number("minutes", "Duration (minutes)")}
        {!physical && number("count", "Completed items / problems", "1")}
        {!physical && (
          <>
            <label className="result-wide">
              Topic / source
              <input
                value={draft.topic}
                maxLength={100}
                onChange={(e) => onChange({ ...draft, topic: e.target.value })}
                placeholder="e.g. CCNA · OSPF, chapter or skill"
              />
            </label>
            {number("attempted", "Checked questions attempted", "1")}
            {number("correct", "Correct answers", "1", "0")}
          </>
        )}
        <label className="result-wide">
          {physical ? "Result / technique note" : "Completed work / outcome"}
          <textarea
            rows={2}
            maxLength={280}
            placeholder={
              physical
                ? "Optional"
                : "e.g. Solved 12 subnetting problems; corrected two mistakes"
            }
            value={draft.output}
            onChange={(e) => onChange({ ...draft, output: e.target.value })}
          />
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
