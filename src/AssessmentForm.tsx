import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Assessment } from "./metrics";
import {
  METRIC_SOURCES,
  displayAssessmentResults,
  assessmentErrors,
} from "./metrics";
import { Icon, Tag } from "./ui";
import MentalCheck from "./MentalCheck";
export default function AssessmentForm({
  value,
  onChange,
  units = "imperial",
  onUnitsChange,
  onFormStart,
  usedForms = [],
  onComplete,
  completeLabel = "Finish assessment",
  onStageChange,
}: {
  value: Assessment;
  onChange: (a: Assessment) => void;
  units?: "metric" | "imperial";
  onUnitsChange?: (units: "metric" | "imperial") => void;
  usedForms?: string[];
  onFormStart?: (id: string) => void;
  onComplete?: () => void;
  completeLabel?: string;
  onStageChange?: (stage: string) => void;
}) {
  const [mindBusy, setMindBusy] = useState(false),
    [seenForms, setSeenForms] = useState<string[]>([]);
  const [tab, setTabState] = useState("physical"),
    [localUnits, setLocalUnits] = useState(units);
  const setTab = (stage: string) => {
    setMindBusy(false);
    setTabState(stage);
    onStageChange?.(stage);
  };
  const field = (
    key: Exclude<
      keyof Assessment,
      | "version"
      | "sex"
      | "strengthTest"
      | "pushupStyle"
      | "mental"
      | "chairAssisted"
      | "mileMode"
    >,
    label: string,
    unit: string,
    factor = 1,
  ) => (
    <MetricInput
      key={`${key}-${localUnits}`}
      label={label}
      unit={unit}
      value={(value[key] ?? null) as number | null}
      factor={factor}
      onChange={(n) => onChange({ ...value, [key]: n })}
    />
  );
  const imperial = localUnits === "imperial";
  return (
    <div className="assessment-v2">
      {assessmentErrors(value).length > 0 && (
        <div role="alert" className="notice">
          {assessmentErrors(value).join(" · ")}
        </div>
      )}
      <label className="assessment-units">
        Measurement units
        <select
          aria-label="Assessment units"
          value={localUnits}
          onChange={(e) => {
            const u = e.target.value as "metric" | "imperial";
            setLocalUnits(u);
            onUnitsChange?.(u);
          }}
        >
          <option value="metric">Metric · cm, kg, metres</option>
          <option value="imperial">Imperial · ft & in, lb, miles</option>
        </select>
      </label>
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
            {imperial ? (
              <HeightInput
                key="imperial-height"
                value={value.heightCm}
                onChange={(heightCm) => onChange({ ...value, heightCm })}
              />
            ) : (
              field("heightCm", "Height", "cm")
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
              {field("pushups", "Maximum consecutive pushups", "repetitions")}
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
            <MileTime
              value={value.mileSeconds ?? null}
              onChange={(mileSeconds) => onChange({ ...value, mileSeconds })}
            />
            <label className="assessment-field">
              Mile method
              <select
                value={value.mileMode || "walk"}
                onChange={(e) =>
                  onChange({
                    ...value,
                    mileMode: e.target.value as "walk" | "run",
                  })
                }
              >
                <option value="walk">Walk</option>
                <option value="run">Run / run-walk</option>
              </select>
            </label>
            {field(
              "pullups",
              "Maximum consecutive strict pullups",
              "repetitions",
            )}
          </div>
          <details className="assessment-protocol">
            <summary>Balance & mile protocols</summary>
            <p>
              Balance: keep eyes open, hands on hips, and lift one foot near
              stable support. Use the best of three attempts, stopping each at
              45 seconds. Mile: time one measured mile (1.609 km) on a flat
              route or track. Enter minutes and seconds, including any walking
              breaks. Use the same route and method for later checks. Leave it
              blank if you do not have a recent result; you do not need an
              all-out attempt.
            </p>
          </details>
          <details className="assessment-protocol">
            <summary>Alternative: six-minute walk</summary>
            {field(
              "walkMetres",
              "Distance walked in 6 minutes",
              imperial ? "yards" : "metres",
              imperial ? 1.0936132983 : 1,
            )}
            <p>
              Optional measured-course protocol. Existing six-minute results
              remain separate from mile times. A mile result takes priority when
              both are entered.
            </p>
          </details>
        </>
      )}
      {(["INT", "WIS", "CHA"] as const).map(
        (stat) =>
          tab === stat && (
            <MentalCheck
              key={stat}
              stat={stat}
              saved={value.mental?.[stat]}
              usedForms={[...usedForms, ...seenForms]}
              onStart={(form) => {
                setMindBusy(true);
                setSeenForms([...seenForms, form.id]);
                onFormStart?.(form.id);
              }}
              onFinish={(result) => {
                setMindBusy(false);
                onChange({
                  ...value,
                  mental: { ...value.mental, [stat]: result },
                });
              }}
            />
          ),
      )}
      {tab === "results" && (
        <div className="assessment-results">
          {displayAssessmentResults(value, localUnits).map((r) => (
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
      {!mindBusy &&
        (tab !== "results" ? (
          <button
            className="button primary full assessment-next"
            disabled={tab === "physical" && assessmentErrors(value).length > 0}
            onClick={() =>
              setTab(
                (
                  {
                    physical: "INT",
                    INT: "WIS",
                    WIS: "CHA",
                    CHA: "results",
                  } as Record<string, string>
                )[tab],
              )
            }
          >
            {tab === "physical"
              ? "Next: INT check"
              : tab === "INT"
                ? "Next: WIS check"
                : tab === "WIS"
                  ? "Next: CHA check"
                  : "View assessment results"}
          </button>
        ) : (
          onComplete && (
            <button
              className="button primary full assessment-next"
              disabled={assessmentErrors(value).length > 0}
              onClick={onComplete}
            >
              {completeLabel}
            </button>
          )
        ))}
    </div>
  );
}
function MileTime({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  const [minutes, setMinutes] = useState(
    value == null ? "" : String(Math.floor(value / 60)),
  );
  const [seconds, setSeconds] = useState(
    value == null ? "" : String(value % 60),
  );
  const change = (m: string, s: string) => {
    setMinutes(m);
    setSeconds(s);
    onChange(
      m === "" && s === ""
        ? null
        : !Number.isInteger(Number(m || 0)) ||
            !Number.isInteger(Number(s || 0)) ||
            Number(s || 0) < 0 ||
            Number(s || 0) > 59
          ? NaN
          : Number(m || 0) * 60 + Number(s || 0),
    );
  };
  return (
    <fieldset className="mile-time">
      <legend>Time for one mile (1.609 km)</legend>
      <label>
        Minutes
        <input
          aria-label="Mile minutes"
          type="number"
          min="0"
          max="180"
          step="1"
          value={minutes}
          placeholder="Minutes"
          onChange={(e) => change(e.target.value, seconds)}
        />
      </label>
      <label>
        Seconds
        <input
          aria-label="Mile seconds"
          type="number"
          min="0"
          max="59"
          step="1"
          value={seconds}
          placeholder="Seconds"
          onChange={(e) => change(minutes, e.target.value)}
        />
      </label>
    </fieldset>
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
function HeightInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  const total = value === null ? null : Math.round((value / 2.54) * 10) / 10;
  const [feet, setFeet] = useState(
      total === null ? "" : String(Math.floor(total / 12)),
    ),
    [inches, setInches] = useState(
      total === null ? "" : String(Math.round((total % 12) * 10) / 10),
    );
  const change = (f: string, i: string) => {
    onChange(
      f === "" && i === ""
        ? null
        : ((Number(f) || 0) * 12 + (Number(i) || 0)) * 2.54,
    );
  };
  return (
    <div className="height-pair">
      <label className="assessment-field">
        <span>Height (feet)</span>
        <input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          placeholder="ft"
          value={feet}
          onChange={(e) => {
            setFeet(e.target.value);
            change(e.target.value, inches);
          }}
        />
      </label>
      <label className="assessment-field">
        <span>Height (inches)</span>
        <input
          type="number"
          min="0"
          max="11.9"
          step="0.1"
          inputMode="decimal"
          placeholder="in"
          value={inches}
          onChange={(e) => {
            setInches(e.target.value);
            change(feet, e.target.value);
          }}
          onBlur={() => {
            if (Number(inches) >= 12) {
              const f = String(
                  (Number(feet) || 0) + Math.floor(Number(inches) / 12),
                ),
                i = String(Number(inches) % 12);
              setFeet(f);
              setInches(i);
              change(f, i);
            }
          }}
        />
      </label>
    </div>
  );
}
