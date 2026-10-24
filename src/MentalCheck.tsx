import { useState, useRef } from "react";
import { mentalForm, nextMentalForm, formScore } from "./exam-bank";
import type { MentalStat, MentalResult, MentalForm } from "./exam-bank";
import { Tag } from "./ui";
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
  onStart?: (form: MentalForm) => void;
  onFinish: (result: MentalResult) => void;
}) {
  const [form, setForm] = useState<MentalForm | null>(null),
    [answers, setAnswers] = useState<number[]>([]),
    [index, setIndex] = useState(0),
    [done, setDone] = useState(false),
    [used, setUsed] = useState<string[]>([]);
  const startedAt = useRef(0);
  const title = mentalForm(stat).name;
  const start = () => {
    const next = nextMentalForm(
      stat,
      [...usedForms, ...used, ...(saved?.formId ? [saved.formId] : [])],
      challenge,
    );
    startedAt.current = performance.now();
    setForm(next);
    setAnswers([]);
    setIndex(0);
    setDone(false);
    setUsed([...used, next.id]);
    onStart?.(next);
  };
  if (!form)
    return (
      <section className="mind-check">
        <h3>{title}</h3>
        <Tag>5 questions · 2–4 minutes</Tag>
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
        <button className="button primary full" onClick={start}>
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
                {answers[i] === q.answer ? "✓" : "○"} {q.prompt}
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
        {stat} · QUESTION {index + 1} / 5
      </span>
      <h3>{q.prompt}</h3>
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
      <button
        className="button primary full"
        disabled={answers[index] === undefined}
        onClick={() => {
          if (index < 4) setIndex(index + 1);
          else {
            onFinish({
              answers,
              formId: form.id,
              challenge: form.challenge,
              completedAt: new Date().toISOString(),
              durationMs: Math.max(
                1000,
                Math.round(performance.now() - startedAt.current),
              ),
            });
            setDone(true);
          }
        }}
      >
        {index < 4 ? "Next question" : `Finish ${stat} check`}
      </button>
    </section>
  );
}
