import { useState } from "react";
import { CAREER_RUBRICS } from "./ability-rubrics";
import { careerCategory } from "./careers";
import type { Character } from "./domain";
import { checkScore } from "./metrics";
import {
  examTargets,
  FITNESS_PROTOCOLS,
  previousFitness,
  previousMental,
  beginExam,
  submitFitnessExam,
  submitMentalExam,
  usedExamForms,
  workProtocolId,
  masteryStandard,
} from "./exams";
import type { ExamRoute } from "./exam-rules";
import type { ExamTarget } from "./exams";
import type { MentalStat } from "./exam-bank";
import MentalCheck from "./MentalCheck";
import { Icon, Modal, Tag } from "./ui";
export default function ClassExams({
  c,
  update,
}: {
  c: Character;
  update: (c: Character) => Promise<boolean>;
}) {
  const [target, setTarget] = useState<ExamTarget | null>(null),
    [protocol, setProtocol] = useState(""),
    [raw, setRaw] = useState(""),
    [note, setNote] = useState(""),
    [mode, setMode] = useState("quiz"),
    [route, setRoute] = useState<ExamRoute>("improvement");
  const targets = examTargets(c),
    physical =
      !!target &&
      target.scope === "class" &&
      ["STR", "DEX", "CON"].includes(target.stat),
    p = FITNESS_PROTOCOLS.find((p) => p.id === protocol),
    before =
      target && p
        ? previousFitness(c, target, p)
        : target
          ? [...(c.exams || [])]
              .reverse()
              .find(
                (e) =>
                  e.scope === target.scope &&
                  e.owner === target.owner &&
                  e.protocol === workProtocolId(target.stat, note) &&
                  e.value !== undefined &&
                  (e.status === "passed" || e.status === "baseline"),
              )
          : undefined;
  const imperial = c.preferences?.units === "imperial",
    factor =
      imperial && p?.unit === "kg"
        ? 2.2046226218
        : imperial && p?.unit === "metres"
          ? 1.0936132983
          : 1;
  const unit =
    imperial && p?.unit === "kg"
      ? "lb"
      : imperial && p?.unit === "metres"
        ? "yards"
        : p?.unit || "correct outcomes / 10 minutes";
  const mastery = target
    ? masteryStandard(
        c,
        target,
        physical
          ? protocol
          : mode === "work"
            ? workProtocolId(target.stat, note)
            : undefined,
      )
    : null;
  const activeRoute =
    route === "mastery" && mastery?.eligible ? "mastery" : "improvement";
  const last = target
    ? (c.exams || [])
        .filter(
          (e) =>
            e.scope === target.scope &&
            e.owner === target.owner &&
            e.milestone === target.milestone &&
            e.status !== "started",
        )
        .at(-1)
    : undefined;
  return (
    <section className="exam-register">
      <div className="exam-grid">
        {targets.map((t) => (
          <article className="panel exam-dossier" key={`${t.scope}-${t.owner}`}>
            <Icon name={t.stat} size={25} />
            <Tag>{t.scope === "class" ? "Class" : "Profession"}</Tag>
            <h3>{t.name}</h3>
            <b>Level {t.milestone} examination</b>
            <p>
              {t.ready
                ? "Ready for examination"
                : `Requires training XP and commissions for level ${t.milestone}`}
            </p>
            <button
              className="button primary full"
              disabled={!t.ready}
              onClick={() => {
                setTarget(t);
                setProtocol(
                  (t.scope === "class"
                    ? FITNESS_PROTOCOLS.find((p) => p.stat === t.stat)?.id
                    : undefined) || `work-${t.stat}`,
                );
                setRaw("");
                setNote("");
                setMode(t.scope === "profession" ? "work" : "quiz");
                setRoute("improvement");
              }}
            >
              Open {t.name} exam
            </button>
          </article>
        ))}
      </div>
      <details className="panel exam-history">
        <summary>
          Examination record ·{" "}
          {(c.exams || []).filter((e) => e.status !== "started").length}
        </summary>
        {[...(c.exams || [])]
          .reverse()
          .filter((e) => e.status !== "started")
          .map((e) => (
            <p key={e.id}>
              <b>
                {targets.find((t) => t.owner === e.owner)?.name || e.owner} ·
                Lv. {e.milestone}
              </b>
              <span>
                {new Date(e.at).toLocaleDateString()} ·{" "}
                {e.status === "baseline"
                  ? "Baseline recorded"
                  : e.status === "passed"
                    ? "Passed"
                    : "Not passed"}
                {e.value !== undefined ? ` · ${e.value}` : ""}
              </span>
            </p>
          ))}
      </details>
      {target && (
        <Modal
          title={`${target.name} · Level ${target.milestone} exam`}
          onClose={() => setTarget(null)}
        >
          <Tag>Stat milestone · {target.stat}</Tag>
          {mastery?.eligible && (
            <div
              className="exam-route"
              role="group"
              aria-label="Examination route"
            >
              <button
                className="button secondary"
                aria-pressed={activeRoute === "improvement"}
                onClick={() => setRoute("improvement")}
              >
                Improvement
              </button>
              <button
                className="button secondary"
                aria-pressed={activeRoute === "mastery"}
                onClick={() => setRoute("mastery")}
              >
                Maintain mastery
              </button>
            </div>
          )}
          {activeRoute === "mastery" && mastery && (
            <p className="notice">
              Maintain{" "}
              {physical || mode === "work"
                ? `${Math.round(mastery.value * factor * 10) / 10} ${unit}${p?.lower ? " or less" : " or more"}`
                : `${Math.max(4, mastery.value)}/5 on a new form`}
              . Submit on a later day than your last passed exam.
            </p>
          )}
          {last && (
            <div role="status" className={`notice exam-result ${last.status}`}>
              <b>
                {last.status === "passed"
                  ? "Passed"
                  : last.status === "baseline"
                    ? "Baseline recorded"
                    : "Not passed"}
              </b>
              {last.status === "baseline" && (
                <p>Repeat this test on a later day after practice.</p>
              )}
              {last.status === "failed" && (
                <p>
                  {last.route === "mastery"
                    ? "The mastery standard must be met on a later day."
                    : "The new result must improve on the previous baseline."}{" "}
                  XP is retained.
                </p>
              )}
            </div>
          )}
          {last?.status !== "passed" && (
            <>
              {!physical && target.scope === "class" && (
                <div className="tabs">
                  <button
                    className={mode === "quiz" ? "active" : ""}
                    onClick={() => setMode("quiz")}
                  >
                    Knowledge check
                  </button>
                  <button
                    className={mode === "work" ? "active" : ""}
                    onClick={() => {
                      setMode("work");
                      setNote(
                        [...(c.exams || [])]
                          .reverse()
                          .find(
                            (e) =>
                              e.owner === target.owner &&
                              e.protocol?.startsWith(`work-${target.stat}`) &&
                              e.note,
                          )?.note || "",
                      );
                    }}
                  >
                    Alternate work sample
                  </button>
                </div>
              )}
              {target.scope === "profession" && (
                <section className="profession-exam-brief">
                  <h3>Profession work sample</h3>
                  <p>
                    Use the same task type, source level, ten-minute limit and
                    marking guide for the comparison. Count correct outcomes
                    against the rubric.
                  </p>
                  <ul>
                    {(
                      CAREER_RUBRICS[careerCategory(target.owner).id] ||
                      CAREER_RUBRICS.general
                    ).map((criterion) => (
                      <li key={criterion}>{criterion}</li>
                    ))}
                  </ul>
                </section>
              )}
              {!physical && target.scope === "class" && mode === "quiz" ? (
                <>
                  <div className="exam-comparison">
                    {(() => {
                      const old = previousMental(c, target);
                      return old ? (
                        <>
                          <b>
                            Previous:{" "}
                            {checkScore(
                              target.stat as MentalStat,
                              old.answers,
                              old.formId,
                            )}
                            /5
                            {old.durationMs
                              ? ` · ${Math.round(old.durationMs / 1000)} seconds`
                              : ""}
                          </b>
                          {activeRoute === "improvement" && (
                            <p>
                              New v3 checks require at least 4/5 and improved
                              accuracy on a later day; finishing faster alone
                              does not pass. An older v2 check starts a new
                              comparison baseline. Use an alternate work sample
                              if a brief check reaches its ceiling.
                            </p>
                          )}
                        </>
                      ) : (
                        <p>This first check records the comparison baseline.</p>
                      );
                    })()}
                  </div>
                  <MentalCheck
                    key={`${target.owner}-${target.milestone}`}
                    stat={target.stat as MentalStat}
                    usedForms={usedExamForms(c)}
                    challenge={mastery?.challenge || 1}
                    onStart={(f) => update(beginExam(c, target, f))}
                    onFinish={(r) =>
                      update(
                        submitMentalExam(c, target, r, new Date(), activeRoute),
                      )
                    }
                  />
                </>
              ) : (
                <div className="fitness-exam">
                  {physical && (
                    <label className="field">
                      Test
                      <select
                        aria-label="Exam test"
                        value={protocol}
                        onChange={(e) => {
                          setProtocol(e.target.value);
                          setRaw("");
                          setRoute("improvement");
                        }}
                      >
                        {FITNESS_PROTOCOLS.filter(
                          (p) => p.stat === target.stat,
                        ).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <p>
                    {physical
                      ? p?.instructions
                      : target.scope === "profession"
                        ? "Choose a repeatable solo task from your profession. Use a fixed ten-minute window and count correctly completed outcomes against the same documented marking guide. Keep the task type and source difficulty comparable."
                        : "Choose a repeatable solo work sample: verified correct problems for INT, evidence-based decisions for WIS, or clearly conveyed points in a recorded explanation for CHA. Use a fixed ten-minute window and a documented marking guide."}
                  </p>
                  {before && activeRoute === "improvement" && (
                    <div className="exam-comparison">
                      <b>
                        Baseline: {Math.round(before.value! * factor * 10) / 10}{" "}
                        {unit}
                      </b>
                      <span>
                        Target:{" "}
                        {Math.round(
                          (p?.lower
                            ? before.value! * 0.95
                            : p &&
                                [
                                  "repetitions",
                                  "correct taps",
                                  "correct steps",
                                ].includes(p.unit) &&
                                p.id !== "chair"
                              ? Math.ceil(
                                  Math.max(
                                    before.value! * 1.05,
                                    before.value! + 1,
                                  ),
                                )
                              : Math.max(
                                  before.value! * 1.05,
                                  before.value! + 1,
                                )) *
                            factor *
                            10,
                        ) / 10}{" "}
                        {unit}
                        {p?.lower ? " or less" : " or more"}
                      </span>
                    </div>
                  )}
                  {!physical && (
                    <label className="field">
                      Work sample and marking guide
                      <textarea
                        aria-label="Work sample and marking guide"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Keep the same task type, time limit, and marking guide for the comparison."
                      />
                    </label>
                  )}
                  <label className="field">
                    {physical ? p?.name : "Correct outcomes in 10 minutes"} (
                    {unit})
                    <input
                      aria-label="Exam result"
                      type="number"
                      min="0"
                      step="any"
                      value={raw}
                      onChange={(e) => setRaw(e.target.value)}
                      placeholder="Enter measured result"
                    />
                  </label>
                  <button
                    className="button primary full"
                    disabled={
                      raw === "" ||
                      Number(raw) < 0 ||
                      !Number.isFinite(Number(raw)) ||
                      (!physical && note.trim().length < 12) ||
                      (!!p?.max && Number(raw) / factor > p.max) ||
                      (physical &&
                        !!p &&
                        [
                          "repetitions",
                          "correct taps",
                          "correct steps",
                        ].includes(p.unit) &&
                        p.id !== "chair" &&
                        !Number.isInteger(Number(raw)))
                    }
                    onClick={() =>
                      update(
                        submitFitnessExam(
                          c,
                          target,
                          physical
                            ? protocol
                            : workProtocolId(target.stat, note),
                          Number(raw) / factor,
                          note,
                          new Date(),
                          activeRoute,
                        ),
                      )
                    }
                  >
                    Submit measured result
                  </button>
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </section>
  );
}
