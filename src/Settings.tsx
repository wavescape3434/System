import { useState } from "react";
import { Settings2, UserRound, Shield, Activity, Save } from "lucide-react";
import type { Character, Stats } from "./domain";
import { ATTRIBUTES, startingStats } from "./domain";
import { DEFAULT_PREFERENCES } from "./preferences";
import type { Preferences } from "./preferences";
import {
  EMPTY_ASSESSMENT,
  assessmentResults,
  assessmentErrors,
} from "./metrics";
import AssessmentForm from "./AssessmentForm";
import { Modal, Tag } from "./ui";
export default function Settings({
  c,
  update,
  onAccount,
  notify,
}: {
  c: Character;
  update: (c: Character) => boolean;
  onAccount: () => void;
  notify: (s: string) => void;
}) {
  const [tab, setTab] = useState("general"),
    [name, setName] = useState(c.name),
    [assessment, setAssessment] = useState(
      c.baseline.assessment || { ...EMPTY_ASSESSMENT },
    ),
    [confirm, setConfirm] = useState<Stats | null>(null);
  const p = { ...DEFAULT_PREFERENCES, ...c.preferences };
  const preference = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => update({ ...c, preferences: { ...p, [key]: value } });
  const saveAssessment = (rebase = false) => {
    const baseline = {
      ...c.baseline,
      mode:
        assessment.strengthTest === "weighted"
          ? ("weights" as const)
          : ("bodyweight" as const),
      assessment,
    };
    const result = startingStats(baseline);
    if (
      update({
        ...c,
        baseline,
        ...(rebase ? { baseStats: result } : {}),
        assessmentHistory: [
          ...(c.assessmentHistory || []),
          { at: new Date().toISOString(), assessment, stats: result },
        ],
      })
    ) {
      notify(
        rebase ? "Assessment baseline updated." : "Performance check saved.",
      );
      setConfirm(null);
    }
  };
  return (
    <div className="settings-page">
      <div className="tabs">
        <button
          className={tab === "general" ? "active" : ""}
          onClick={() => setTab("general")}
        >
          General
        </button>
        <button
          className={tab === "training" ? "active" : ""}
          onClick={() => setTab("training")}
        >
          Training
        </button>
        <button
          className={tab === "assessment" ? "active" : ""}
          onClick={() => setTab("assessment")}
        >
          Assessment
        </button>
        <button
          className={tab === "account" ? "active" : ""}
          onClick={() => setTab("account")}
        >
          Account & data
        </button>
      </div>
      {tab === "general" && (
        <div className="settings-grid">
          <section className="panel">
            <div className="section-heading">
              <h2>Profile</h2>
              <UserRound size={23} />
            </div>
            <label className="field">
              Adventurer name
              <input
                value={name}
                maxLength={32}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button
              className="button primary"
              disabled={!name.trim() || name.trim() === c.name}
              onClick={() => {
                if (update({ ...c, name: name.trim() }))
                  notify("Profile saved.");
              }}
            >
              <Save size={16} />
              Save profile
            </button>
          </section>
          <section className="panel">
            <div className="section-heading">
              <h2>Display</h2>
              <Settings2 size={23} />
            </div>
            <label className="field">
              Measurement units
              <select
                aria-label="Measurement units"
                value={p.units}
                onChange={(e) =>
                  preference("units", e.target.value as Preferences["units"])
                }
              >
                <option value="metric">Metric · kg, cm, metres</option>
                <option value="imperial">Imperial · lb, inches, yards</option>
              </select>
            </label>
            <label className="field">
              Text size
              <select
                aria-label="Text size"
                value={p.textSize}
                onChange={(e) =>
                  preference(
                    "textSize",
                    e.target.value as Preferences["textSize"],
                  )
                }
              >
                <option value="standard">Standard</option>
                <option value="large">Large</option>
              </select>
            </label>
            <label className="setting-toggle">
              <span>Reduce motion</span>
              <input
                type="checkbox"
                checked={p.reduceMotion}
                onChange={(e) => preference("reduceMotion", e.target.checked)}
              />
            </label>
            <label className="field">
              Open app to
              <select
                aria-label="Open app to"
                value={p.defaultPage}
                onChange={(e) =>
                  preference(
                    "defaultPage",
                    e.target.value as Preferences["defaultPage"],
                  )
                }
              >
                <option value="guild">Guild Card</option>
                <option value="objectives">Objectives</option>
                <option value="journey">Journey</option>
              </select>
            </label>
          </section>
        </div>
      )}
      {tab === "training" && (
        <section className="panel">
          <div className="section-heading">
            <h2>Training preferences</h2>
            <Activity size={23} />
          </div>
          <h3>Available equipment</h3>
          {(["bodyweight", "pullup-bar", "weights"] as const).map((id) => (
            <label className="setting-toggle" key={id}>
              <span>
                {id === "bodyweight"
                  ? "Bodyweight / household equipment"
                  : id === "pullup-bar"
                    ? "Pull-up bar"
                    : "Weights"}
              </span>
              <input
                type="checkbox"
                checked={p.equipment.includes(id)}
                disabled={id === "bodyweight"}
                onChange={(e) =>
                  preference(
                    "equipment",
                    e.target.checked
                      ? [...p.equipment, id]
                      : p.equipment.filter((x) => x !== id),
                  )
                }
              />
            </label>
          ))}
          <label className="setting-toggle">
            <span>Show requests with unmet requirements</span>
            <input
              type="checkbox"
              checked={p.showLockedRequests}
              onChange={(e) =>
                preference("showLockedRequests", e.target.checked)
              }
            />
          </label>
        </section>
      )}
      {tab === "assessment" && (
        <section className="panel assessment-settings">
          <h2>Performance check</h2>
          <AssessmentForm
            value={assessment}
            onChange={setAssessment}
            units={p.units}
          />
          <div className="account-actions">
            <button
              className="button primary"
              disabled={assessmentErrors(assessment).length > 0}
              onClick={() => saveAssessment()}
            >
              <Save size={16} />
              Save performance check
            </button>
            <button
              className="button secondary"
              disabled={assessmentErrors(assessment).length > 0}
              onClick={() =>
                setConfirm(startingStats({ ...c.baseline, assessment }))
              }
            >
              Recalibrate starting stats
            </button>
          </div>
          <details className="assessment-history">
            <summary>Saved checks · {c.assessmentHistory?.length || 0}</summary>
            {[...(c.assessmentHistory || [])].reverse().map((h, i) => (
              <div key={`${h.at}-${i}`}>
                <b>{new Date(h.at).toLocaleDateString()}</b>
                {assessmentResults(h.assessment)
                  .filter((r) => r.measured)
                  .map((r) => (
                    <span key={r.stat}>
                      {r.stat}: {r.raw}
                    </span>
                  ))}
              </div>
            ))}
          </details>
        </section>
      )}
      {tab === "account" && (
        <section className="panel">
          <div className="section-heading">
            <h2>Account & data</h2>
            <Shield size={23} />
          </div>
          <div className="settings-record">
            <span>Character ID</span>
            <code>{c.id}</code>
          </div>
          <div className="settings-record">
            <span>Saved requests</span>
            <b>{c.takenRequests?.length || 0}</b>
          </div>
          <div className="settings-record">
            <span>Completed requests</span>
            <b>{c.completions.length}</b>
          </div>
          <div className="settings-record">
            <span>Version</span>
            <Tag>1.4.0</Tag>
          </div>
          <button className="button primary" onClick={onAccount}>
            Account & backups
          </button>
        </section>
      )}
      {confirm && (
        <Modal
          title="Recalibrate starting stats?"
          onClose={() => setConfirm(null)}
        >
          <p>
            Updates the assessment baseline. Earned class, profession, and quest
            stat points are retained.
          </p>
          <div className="recalibration-preview">
            {ATTRIBUTES.map((a) => (
              <div key={a}>
                <b>{a}</b>
                <span>
                  {c.baseStats[a]} → {confirm[a]}
                </span>
              </div>
            ))}
          </div>
          <button
            className="button primary full"
            onClick={() => saveAssessment(true)}
          >
            Apply assessment baseline
          </button>
        </Modal>
      )}
    </div>
  );
}
