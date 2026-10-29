import AbilityCheckForm from "./AbilityCheckForm";
import { abilityKey } from "./adaptive-ability";
import { useState } from "react";
import type { Character, Objective } from "./domain";
import {
  PROFICIENCY_LEVELS,
  activeProficiency,
  proficiencyFeedback,
} from "./proficiency";
import type { Proficiency } from "./proficiency";
import { REGIMEN_RANKS } from "./training-prescriptions";
export default function AbilitySettings({
  c,
  all,
  update,
}: {
  c: Character;
  all: Objective[];
  update: (c: Character) => Promise<boolean>;
}) {
  const choices = [
    ...new Map(
      all
        .filter(
          (o) =>
            o.cadence === "daily" &&
            !o.workout &&
            o.kind !== "class-trial" &&
            !o.id.includes("technique-daily"),
        )
        .map((o) => [abilityKey(c, o), o]),
    ).entries(),
  ].sort((a, b) => {
    const priority = (o: Objective) =>
      o.scope === "class" ? 0 : o.scope === "profession" ? 1 : 2;
    return (
      priority(a[1]) - priority(b[1]) || a[1].title.localeCompare(b[1].title)
    );
  });
  const probes = [
    ...new Map(
      all
        .filter(
          (o) =>
            o.cadence === "daily" &&
            !o.workout &&
            o.kind !== "class-trial" &&
            !o.id.includes("technique-daily"),
        )
        .map((o) => [abilityKey(c, o), o]),
    ).entries(),
  ];
  const [probeKey, setProbeKey] = useState(probes[0]?.[0] || "");
  const probe = probes.find(([k]) => k === probeKey)?.[1];
  const [key, setKey] = useState(choices[0]?.[0] || ""),
    [draft, setDraft] = useState<Proficiency>(
      (choices[0] ? activeProficiency(c, choices[0][1]) : undefined) || {
        rank: "F",
        topic: "",
        criterion: "",
        reviewedAt: new Date().toISOString(),
      },
    ),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const active = choices.find(([k]) => k === key)?.[1];
  return (
    <section className="panel ability-settings" aria-label="Ability settings">
      <h2>Ability settings</h2>
      <p>
        Choose difficulty from what you can do now. Guild rank and character
        stats do not set your real-world ability.
      </p>
      <label>
        Activity to calibrate
        <select
          aria-label="Activity to calibrate"
          value={probeKey}
          onChange={(e) => setProbeKey(e.target.value)}
        >
          {probes.map(([k, o]) => (
            <option key={k} value={k}>
              {o.category} · {o.groupTitle || o.title}
            </option>
          ))}
        </select>
      </label>
      {probe && (
        <AbilityCheckForm key={probeKey} c={c} o={probe} update={update} />
      )}
      <h3>Manual starting plan</h3>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setStatus("");
          try {
            if (
              await update({
                ...c,
                proficiencies: {
                  ...c.proficiencies,
                  [key]: {
                    ...draft,
                    topic: draft.topic.trim(),
                    criterion: draft.criterion.trim(),
                    reviewedAt: new Date().toISOString(),
                  },
                },
              })
            )
              setStatus(
                "Ability saved. Taken requests keep their original work and reward.",
              );
            else setStatus("Could not save. Your entries are kept; retry.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Practice area
          <select
            value={key}
            onChange={(e) => {
              const next = e.target.value;
              setKey(next);
              setDraft(
                (choices.find(([k]) => k === next)
                  ? activeProficiency(c, choices.find(([k]) => k === next)![1])
                  : undefined) || {
                  rank: "F",
                  topic: "",
                  criterion: "",
                  reviewedAt: new Date().toISOString(),
                },
              );
              setStatus("");
            }}
          >
            {choices.map(([k, o]) => (
              <option value={k} key={k}>
                {o.scope} · {o.category} · {o.groupTitle || o.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Subject or activity
          <input
            required
            minLength={2}
            maxLength={100}
            value={draft.topic}
            placeholder="Specific subject, exercise or practice domain"
            onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
          />
        </label>
        <label>
          Starting proficiency
          <select
            value={draft.rank}
            onChange={(e) =>
              setDraft({
                ...draft,
                rank: e.target.value as Proficiency["rank"],
              })
            }
          >
            {REGIMEN_RANKS.map((r) => (
              <option value={r} key={r}>
                {r} · {PROFICIENCY_LEVELS[r]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Success criterion and comparison source
          <textarea
            required
            minLength={8}
            maxLength={280}
            value={draft.criterion}
            placeholder="Name the source, level and what a successful attempt must demonstrate"
            onChange={(e) => setDraft({ ...draft, criterion: e.target.value })}
          />
        </label>
        <button className="button primary" disabled={busy || !key}>
          {busy ? "Saving…" : "Save ability"}
        </button>
        <p role="status">{status}</p>
      </form>
      {active && <p>{proficiencyFeedback(c, active)}</p>}
      <details>
        <summary>Choosing and reviewing difficulty</summary>
        <p>
          For unfamiliar subjects, try a short sample before choosing. Use
          sources with stated levels and answer keys or performance rubrics. Two
          comparable checks on different days above 85% suggest trying a harder
          sample; two below 60% suggest reviewing a prerequisite. These are
          adjustable practice heuristics, not validated mastery cutoffs. Record
          the same source/version and level. Exercise variation and load use
          reps in reserve in Regimen.
        </p>
      </details>
    </section>
  );
}
