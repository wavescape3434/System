import { useState } from "react";
import type { Character } from "./domain";
import { careerCategory, VOCATIONS, CAREER_CATEGORIES } from "./careers";
import {
  CAREER_UTILITIES,
  hasCareerUtility,
  careerWork,
  workRecordText,
} from "./career-payoffs";
import { exportData } from "./file-export";
export default function CareerWorkRecord({
  c,
  onFieldwork,
}: {
  c: Character;
  onFieldwork?: (id: string) => void;
}) {
  const [all, setAll] = useState(false),
    [error, setError] = useState(""),
    [allTools, setAllTools] = useState(false);
  const category = careerCategory(c.profession),
    work = careerWork(c),
    list = work.filter((o) => all || o.category === category.id),
    vocation = VOCATIONS.find((v) => v.id === c.vocation);
  return (
    <section className="panel career-work-record">
      <div className="section-heading">
        <h3>Career work record</h3>
        <button
          className="button secondary"
          disabled={!work.length}
          onClick={async () => {
            try {
              await exportData(
                workRecordText(c),
                "guild-career-work.txt",
                "Career work record",
              );
              setError("");
            } catch {
              setError("Work record could not be exported.");
            }
          }}
        >
          Export work record
        </button>
      </div>
      <div className="tabs">
        <button className={!all ? "active" : ""} onClick={() => setAll(false)}>
          Current discipline
        </button>
        <button className={all ? "active" : ""} onClick={() => setAll(true)}>
          All disciplines
        </button>
      </div>
      <details>
        <summary>Next work sample · {vocation?.name || category.name}</summary>
        <p>{vocation?.project || category.project}</p>
      </details>
      {error && <p role="alert">{error}</p>}
      {list.length ? (
        <div className="career-record-list">
          {list.slice(0, 20).map((o) => (
            <article key={o.key}>
              <small>
                {new Date(o.at).toLocaleDateString()} · {o.profession}
                {o.vocation ? ` → ${o.vocation}` : ""}
              </small>
              <h4>{o.title}</h4>
              <p>{o.output}</p>
              <span>
                {[
                  o.minutes ? `${o.minutes} min` : "",
                  o.count ? `${o.count} items` : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p>No completed work recorded in this discipline.</p>
      )}
      {list.length > 20 && (
        <p>Showing 20 of {list.length}. Export includes every work sample.</p>
      )}
      <details>
        <summary>Field competencies</summary>
        <label className="competency-toggle">
          <input
            type="checkbox"
            checked={allTools}
            onChange={(e) => setAllTools(e.target.checked)}
          />
          All available disciplines
        </label>
        <div className="field-competency-grid">
          {CAREER_UTILITIES.filter(
            (u) =>
              allTools ||
              u.category === category.id ||
              hasCareerUtility(c, u.id),
          ).map((u) => (
            <div className="career-competency" key={u.id}>
              <b>
                {u.name} · {hasCareerUtility(c, u.id) ? "Learned" : "Locked"}
              </b>
              <small>
                {CAREER_CATEGORIES.find((g) => g.id === u.category)?.name}
              </small>
              <p>{u.effect}</p>
              <small>Learn {u.learn}.</small>
              {hasCareerUtility(c, u.id) && onFieldwork && (
                <button
                  className="button secondary"
                  disabled={!!c.campaign?.battle}
                  onClick={() => onFieldwork(u.id)}
                >
                  Use {u.name}
                </button>
              )}
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
