import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Assessment } from "./metrics";
import {
  METRIC_SOURCES,
  assessmentResults,
  MIND_CHECKS,
  checkScore,
  assessmentErrors,
} from "./metrics";
import { Icon, Tag } from "./ui";
export default function AssessmentForm({
  value,
  onChange,
  units = "metric",
}: {
  value: Assessment;
  onChange: (a: Assessment) => void;
  units?: "metric" | "imperial";
}) {
  const [tab, setTab] = useState("physical");
  const field = (
    key: Exclude<
      keyof Assessment,
      | "version"
      | "sex"
      | "strengthTest"
      | "pushupStyle"
      | "mental"
      | "chairAssisted"
    >,
    label: string,
    unit: string,
    factor = 1,
  ) => (
    <MetricInput
      key={`${key}-${units}`}
      label={label}
      unit={unit}
      value={(value[key] ?? null) as number | null}
      factor={factor}
      onChange={(n) => onChange({ ...value, [key]: n })}
    />
  );
  const imperial = units === "imperial";
  return (
    <div className="assessment-v2">
      {assessmentErrors(value).length > 0 && (
        <div role="alert" className="notice">
          {assessmentErrors(value).join(" · ")}
        </div>
      )}
      <div className="assessment-tabs">
        {[
          ["physical", "Body"],
          ["INT", "INT"],
          ["WIS", "WIS"],
          ["CHA", "CHA"],
          ["results", "Results"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
            {["INT", "WIS", "CHA"].includes(id) &&
            value.mental?.[id as "INT" | "WIS" | "CHA"]
              ? " ✓"
              : ""}
          </button>
        ))}
      </div>
      {tab === "physical" && (
        <>
          <div className="assessment-grid">
            {field("age", "Age", "years")}
            <label className="assessment-field">
              <span>Reference group</span>
              <select
                value={value.sex}
                onChange={(e) =>
                  onChange({
                    ...value,
                    sex: e.target.value as Assessment["sex"],
                  })
                }
              >
                <option value="unspecified">Not selected</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            {field(
              "heightCm",
              "Height",
              imperial ? "in" : "cm",
              imperial ? 1 / 2.54 : 1,
            )}
            {field(
              "massKg",
              "Body mass",
              imperial ? "lb" : "kg",
              imperial ? 2.2046226218 : 1,
            )}
          </div>
          <label className="field">
            Strength assessment
            <select
              aria-label="Strength assessment"
              value={value.strengthTest}
              onChange={(e) =>
                onChange({
                  ...value,
                  strengthTest: e.target.value as Assessment["strengthTest"],
                })
              }
            >
              <option value="pushups">Bodyweight · Pushups</option>
              <option value="chair">Bodyweight · 30-second chair stand</option>
              <option value="weighted">With weights · Bench press set</option>
              <option value="grip">With equipment · Grip dynamometer</option>
            </select>
          </label>
          {value.strengthTest === "pushups" && (
            <>
              <label className="field">
                Pushup variation
                <select
                  value={value.pushupStyle}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      pushupStyle: e.target.value as Assessment["pushupStyle"],
                    })
                  }
                >
                  <option value="floor">Floor</option>
                  <option value="knee">Knee</option>
                  <option value="incline">Incline</option>
                  <option value="wall">Wall</option>
                </select>
              </label>
              {field("pushups", "Controlled pushups", "repetitions")}
            </>
          )}
          {value.strengthTest === "grip" && (
            <>
              {field(
                "gripKg",
                "Maximum grip strength",
                imperial ? "lb" : "kg",
                imperial ? 2.2046226218 : 1,
              )}
              <details className="assessment-protocol">
                <summary>Grip protocol</summary>
                <p>
                  Use a calibrated hand dynamometer. Take three efforts per hand
                  with rest, using the same posture and handle setting; record
                  the highest force in kg. Use the same device and protocol for
                  later checks.
                </p>
              </details>
            </>
          )}
          {value.strengthTest === "pushups" && (
            <details className="assessment-protocol">
              <summary>Pushup protocol</summary>
              <p>
                Use the same variation and range of motion each time. Count
                controlled repetitions until you need to rest or your form
                changes. Pushups measure muscular endurance; wall, incline,
                knee, and floor counts have separate provisional references.
              </p>
            </details>
          )}
          {value.strengthTest === "chair" && (
            <>
              {field(
                "chairStands",
                "Chair stands in 30 seconds",
                "repetitions",
              )}
              <label className="setting-toggle">
                <span>Used arms or assistance</span>
                <input
                  type="checkbox"
                  checked={!!value.chairAssisted}
                  onChange={(e) =>
                    onChange({ ...value, chairAssisted: e.target.checked })
                  }
                />
              </label>
              <details className="assessment-protocol">
                <summary>Test protocol</summary>
                <p>
                  Use a stable armless chair, 45 cm high, against a wall. Keep
                  arms crossed and feet flat. Stand fully and sit under control
                  for 30 seconds. For the young-adult reference, take a short
                  practice, then two trials with 60 seconds rest; enter their
                  mean count. Assisted stands use a provisional reference.
                </p>
              </details>
            </>
          )}
          {value.strengthTest === "weighted" && (
            <div className="assessment-grid">
              {field(
                "liftKg",
                "Bench press load",
                imperial ? "lb" : "kg",
                imperial ? 2.2046226218 : 1,
              )}
              {field("liftReps", "Repetitions in the set", "reps")}
              <p className="assessment-inline-data">
                Use a recent controlled set of 4–10 repetitions. The result is
                an estimate, not a required maximum attempt.
              </p>
            </div>
          )}
          <div className="assessment-grid">
            {field("balanceSeconds", "One-leg balance, eyes open", "seconds")}
            {field(
              "walkMetres",
              "Distance walked in 6 minutes",
              imperial ? "yards" : "metres",
              imperial ? 1.0936132983 : 1,
            )}
            {field("pullups", "Recent strict pullups", "repetitions")}
          </div>
          <details className="assessment-protocol">
            <summary>Balance & walking protocols</summary>
            <p>
              Balance: keep eyes open, hands on hips, and lift one foot near
              stable support. Use the best of three attempts, stopping each at
              45 seconds. Walking: use a flat measured course and walk for six
              minutes. Record distance, not how long you usually walk. Use the
              same course and method for later checks.
            </p>
          </details>
        </>
      )}
      {(["INT", "WIS", "CHA"] as const).map(
        (stat) =>
          tab === stat && (
            <MindCheck
              key={stat}
              stat={stat}
              saved={value.mental?.[stat]}
              onFinish={(answers) =>
                onChange({
                  ...value,
                  mental: {
                    ...value.mental,
                    [stat]: { answers, completedAt: new Date().toISOString() },
                  },
                })
              }
            />
          ),
      )}
      {tab === "results" && (
        <div className="assessment-results">
          {assessmentResults(value).map((r) => (
            <section key={r.stat}>
              <Icon name={r.stat} />
              <div>
                <b>{r.stat}</b>
                <p>{r.raw}</p>
                <small>{r.reference}</small>
                {r.source && (
                  <a
                    className="metric-source"
                    target="_blank"
                    rel="noreferrer"
                    href={METRIC_SOURCES.find((s) => s.id === r.source)?.url}
                  >
                    Source <ExternalLink size={11} />
                  </a>
                )}
                <Tag tone={r.evidence === "published" ? "green" : "neutral"}>
                  {!r.measured
                    ? "Unassessed"
                    : r.evidence === "published"
                      ? "Published reference"
                      : "Provisional reference"}
                </Tag>
              </div>
              <strong>{r.value}</strong>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
function MetricInput({
  label,
  unit,
  value,
  onChange,
  factor = 1,
}: {
  label: string;
  unit: string;
  value: number | null;
  onChange: (n: number | null) => void;
  factor?: number;
}) {
  const [draft, setDraft] = useState(
    value === null ? "" : String(Math.round(value * factor * 10) / 10),
  );
  return (
    <label className="assessment-field">
      <span>
        {label} ({unit})
      </span>
      <input
        type="number"
        min="0"
        step="any"
        inputMode="decimal"
        placeholder="Not assessed"
        value={draft}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          if (raw === "") onChange(null);
          else if (Number.isFinite(Number(raw)) && Number(raw) >= 0)
            onChange(Number(raw) / factor);
        }}
        onBlur={() => {
          if (
            draft !== "" &&
            (!Number.isFinite(Number(draft)) || Number(draft) < 0)
          ) {
            setDraft("");
            onChange(null);
          }
        }}
      />
    </label>
  );
}
function MindCheck({
  stat,
  saved,
  onFinish,
}: {
  stat: "INT" | "WIS" | "CHA";
  saved?: { answers: number[]; completedAt: string };
  onFinish: (answers: number[]) => void;
}) {
  const check = MIND_CHECKS[stat],
    [stage, setStage] = useState<"lesson" | "questions" | "result">(
      saved ? "result" : "lesson",
    ),
    [answers, setAnswers] = useState<number[]>(saved?.answers || []),
    [index, setIndex] = useState(0);
  if (stage === "lesson")
    return (
      <section className="mind-check">
        <h3>{check.name}</h3>
        <Tag>5 questions · 2–4 minutes</Tag>
        <p className="mind-lesson">{check.lesson}</p>
        <button
          className="button primary full"
          onClick={() => setStage("questions")}
        >
          Start {stat} check
        </button>
      </section>
    );
  if (stage === "result")
    return (
      <section className="mind-check">
        <h3>
          {check.name} · {checkScore(stat, answers)}/5
        </h3>
        <div className="check-review">
          {check.questions.map((q, i) => (
            <details key={q.prompt}>
              <summary>
                {answers[i] === q.answer ? "✓" : "○"} {q.prompt}
              </summary>
              <p>{q.explanation}</p>
            </details>
          ))}
        </div>
        <button
          className="button secondary full"
          onClick={() => {
            setAnswers([]);
            setIndex(0);
            setStage("lesson");
          }}
        >
          Review & retake {stat}
        </button>
      </section>
    );
  const q = check.questions[index];
  return (
    <section className="mind-check">
      <span className="eyebrow">
        {stat} · QUESTION {index + 1} / 5
      </span>
      <h3>{q.prompt}</h3>
      <div className="check-options">
        {q.options.map((option, i) => (
          <button
            className={answers[index] === i ? "selected" : ""}
            key={option}
            onClick={() => {
              const next = [...answers];
              next[index] = i;
              setAnswers(next);
            }}
          >
            {option}
          </button>
        ))}
      </div>
      <button
        className="button primary full"
        disabled={answers[index] === undefined}
        onClick={() => {
          if (index < 4) setIndex(index + 1);
          else {
            onFinish(answers);
            setStage("result");
          }
        }}
      >
        {index < 4 ? "Next question" : `Finish ${stat} check`}
      </button>
    </section>
  );
}
