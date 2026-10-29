import { useState, useRef } from "react";
import { mentalForm, nextMentalForm, formScore } from "./exam-bank";
import type { MentalStat, MentalResult, MentalForm } from "./exam-bank";
import { Tag } from "./ui";
import CommunicationTrial from "./CommunicationTrial";
export default function MentalCheck({
  stat,
  saved,
  usedForms = [],
  challenge = 1,
  onStart,
  onFinish,
}: {
  stat: MentalStat;
  saved?: MentalResult;
  usedForms?: string[];
  challenge?: number;
  onStart?: (form: MentalForm) => void | boolean | Promise<void | boolean>;
  onFinish: (result: MentalResult) => void | boolean | Promise<void | boolean>;
}) {
  const [form, setForm] = useState<MentalForm | null>(null),
    [answers, setAnswers] = useState<number[]>([]),
    [index, setIndex] = useState(0),
    [done, setDone] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [used, setUsed] = useState<string[]>([]);
  const startedAt = useRef(0);
  const title = mentalForm(stat).name;
  const start = async () => {
    const next = nextMentalForm(
      stat,
      [...usedForms, ...used, ...(saved?.formId ? [saved.formId] : [])],
      challenge,
    );
    setPending(true);
    try {
      if ((await onStart?.(next)) === false) return;
    } catch {
      setError("Check could not be started. Retry when storage is available.");
      return;
    } finally {
      setPending(false);
    }
    setError("");
    startedAt.current = performance.now();
    setForm(next);
    setAnswers([]);
    setIndex(0);
    setDone(false);
    setUsed([...used, next.id]);
  };
  if (!form)
    return (
      <section className="mind-check">
        <h3>{title}</h3>
        <Tag>
          {stat === "CHA"
            ? "5 spoken exercises · 6–10 minutes"
            : "5 problems · 4–7 minutes"}
        </Tag>
        {stat === "CHA" && (
          <p>
            Practice aloud, then rate the listed criteria. Optional recordings
            stay in this screen and are discarded when you leave.
          </p>
        )}
        {saved && (
          <p className="assessment-inline-data">
            Previous check:{" "}
            {saved.formId
              ? formScore(mentalForm(stat, saved.formId), saved.answers)
              : saved.answers.length
                ? "Recorded"
                : "Unassessed"}
            {saved.formId ? "/5" : ""} ·{" "}
            {new Date(saved.completedAt).toLocaleDateString()}
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        <button
          className="button primary full"
          disabled={pending}
          onClick={start}
        >
          Start {stat} check
        </button>
      </section>
    );
  if (done)
    return (
      <section className="mind-check">
        <h3>
          {title} · {formScore(form, answers)}/5
        </h3>
        <Tag>
          Form {Number(form.id.split("-")[2]) + 1} · Challenge {form.challenge}
        </Tag>
        <div className="check-review">
          {form.questions.map((q, i) => (
            <details key={q.id}>
              <summary>
                {q.performance
                  ? `${answers[i]}/3`
                  : answers[i] === q.answer
                    ? "✓"
                    : "○"}{" "}
                {q.prompt}
              </summary>
              <p>{q.explanation}</p>
            </details>
          ))}
        </div>
        <button className="button secondary full" onClick={start}>
          Start another {stat} check
        </button>
      </section>
    );
  const q = form.questions[index];
  return (
    <section className="mind-check">
      <span className="eyebrow">
        {stat} · {q.performance ? "EXERCISE" : "QUESTION"} {index + 1} / 5
      </span>
      <h3>{q.prompt}</h3>
      {q.performance && (
        <CommunicationTrial
          key={q.id}
          seconds={q.performance.seconds}
          criteria={q.performance.criteria}
        />
      )}
      <div className="check-options">
        {q.options.map((text, i) => (
          <button
            className={answers[index] === i ? "selected" : ""}
            key={i}
            onClick={() => {
              const next = [...answers];
              next[index] = i;
              setAnswers(next);
            }}
          >
            {text}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      <button
        className="button primary full"
        disabled={pending || answers[index] === undefined}
        onClick={async () => {
          if (index < 4) setIndex(index + 1);
          else {
            setPending(true);
            try {
              const saved = await onFinish({
                answers,
                formId: form.id,
                challenge: form.challenge,
                completedAt: new Date().toISOString(),
                durationMs: Math.max(
                  1000,
                  Math.round(performance.now() - startedAt.current),
                ),
              });
              if (saved !== false) {
                setDone(true);
                setError("");
              }
            } catch {
              setError(
                "Result could not be saved. Your answers are kept; retry.",
              );
            } finally {
              setPending(false);
            }
          }
        }}
      >
        {index < 4 ? "Next question" : `Finish ${stat} check`}
      </button>
    </section>
  );
}
