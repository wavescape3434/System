import { useState } from "react";
import type { Character, Objective } from "./domain";
import type { PracticeEvidence } from "./adaptive-ability";
import {
  abilityBrief,
  abilityRecommendation,
  recordAbilityCheck,
  validPracticeEvidence,
} from "./adaptive-ability";
import { REGIMEN_RANKS } from "./training-prescriptions";
import type { RegimenRank } from "./training-prescriptions";
import { activeProficiency } from "./proficiency";
export default function AbilityCheckForm({
  c,
  o,
  update,
  onCalibrated,
}: {
  c: Character;
  o: Objective;
  update: (c: Character) => Promise<boolean>;
  onCalibrated?: (c: Character) => void;
}) {
  const profile = activeProficiency(c, o),
    current = abilityRecommendation(c, o, profile?.topic);
  const [open, setOpen] = useState(false),
    [level, setLevel] = useState<RegimenRank>(current?.level || "D"),
    [subject, setSubject] = useState(
      profile?.topic || current?.latest.subject || "",
    ),
    [source, setSource] = useState(current?.latest.source || ""),
    [criteria, setCriteria] = useState<boolean[]>([false, false, false, false]),
    [independent, setIndependent] = useState(false),
    [unfamiliar, setUnfamiliar] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  const brief = abilityBrief(o, level);
  if (brief.domain === "recovery") return null;
  if (!open)
    return (
      <section className="ability-check">
        <button
          className="button secondary"
          type="button"
          onClick={() => setOpen(true)}
        >
          Check current ability
        </button>
        {current && (
          <p>
            {current.level} suggested · {current.latest.subject} ·{" "}
            {current.reason}
          </p>
        )}
      </section>
    );
  return (
    <section className="ability-check" aria-label="Activity ability check">
      <h3>Starting sample</h3>
      <label>
        Sample difficulty
        <select
          aria-label="Sample difficulty"
          value={level}
          onChange={(e) => {
            setLevel(e.target.value as RegimenRank);
            setCriteria([false, false, false, false]);
            setStatus("");
          }}
        >
          {REGIMEN_RANKS.map((r, i) => (
            <option value={r} key={r}>
              {r} ·{" "}
              {["Guided", "Familiar", "Independent", "Constrained transfer"][i]}
            </option>
          ))}
        </select>
      </label>
      <p>{brief.task}</p>
      <label>
        Specific activity or subject
        <input
          aria-label="Ability sample subject"
          value={subject}
          maxLength={100}
          onChange={(e) => setSubject(e.target.value)}
        />
      </label>
      <label>
        Comparison source and setup
        <input
          aria-label="Ability sample source"
          value={source}
          maxLength={140}
          placeholder="Source/version, exercise setup, or marking guide"
          onChange={(e) => setSource(e.target.value)}
        />
      </label>
      <fieldset>
        <legend>After performing the sample</legend>
        {brief.criteria.map((text, i) => (
          <label key={text}>
            <input
              type="checkbox"
              checked={criteria[i]}
              onChange={(e) =>
                setCriteria(
                  criteria.map((v, j) => (j === i ? e.target.checked : v)),
                )
              }
            />
            {text}
          </label>
        ))}
      </fieldset>
      <label>
        <input
          type="checkbox"
          checked={independent}
          onChange={(e) => setIndependent(e.target.checked)}
        />
        Completed without help or copied steps
      </label>
      <label>
        <input
          type="checkbox"
          checked={unfamiliar}
          onChange={(e) => setUnfamiliar(e.target.checked)}
        />
        Unfamiliar work at this difficulty
      </label>
      <p>{brief.next}</p>
      <button
        className="button primary"
        type="button"
        disabled={busy}
        onClick={async () => {
          const sample: PracticeEvidence = {
            source: source.trim(),
            subject: subject.trim(),
            level,
            unfamiliar,
            independent,
            criteriaMet: criteria.filter(Boolean).length,
            criteriaTotal: 4,
          };
          if (!validPracticeEvidence(sample)) {
            setStatus(
              "Name the subject and comparison source/setup before recording the sample.",
            );
            return;
          }
          setBusy(true);
          try {
            const next = recordAbilityCheck(c, o, sample);
            if (next === c || !(await update(next)))
              setStatus("Could not save. Your sample is kept; retry.");
            else {
              onCalibrated?.(next);
              const result = abilityRecommendation(next, o, sample.subject);
              setStatus(`${result!.level} suggested. ${result!.reason}`);
            }
          } finally {
            setBusy(false);
          }
        }}
      >
        Save sample & calibrate
      </button>
      <button
        className="text-button"
        type="button"
        onClick={() => setOpen(false)}
      >
        Close sample
      </button>
      <p role="status">{status}</p>
    </section>
  );
}
export function PracticeQualityForm({
  c,
  o,
  value,
  onChange,
}: {
  c: Character;
  o: Objective;
  value?: PracticeEvidence;
  onChange: (v: PracticeEvidence | undefined) => void;
}) {
  const [enabled, setEnabled] = useState(!!value);
  if (
    o.cadence !== "daily" ||
    !REGIMEN_RANKS.includes(o.rank as RegimenRank) ||
    abilityBrief(o, o.rank as RegimenRank).domain === "recovery"
  )
    return null;
  const taken = c.takenRequests?.find((r) => r.id === o.id);
  const owner =
    taken &&
    (taken.classId !== c.activeClass ||
      taken.profession !== c.profession ||
      (taken.vocationId || null) !== (c.vocation || null))
      ? {
          ...c,
          activeClass: taken.classId,
          profession: taken.profession,
          vocation: taken.vocationId || null,
        }
      : c;
  const profile = activeProficiency(owner, o),
    previous = abilityRecommendation(owner, o, profile?.topic);
  const draft = value || {
    source: previous?.latest.source || "",
    subject: profile?.topic || previous?.latest.subject || "",
    level: o.rank as RegimenRank,
    unfamiliar: false,
    independent: false,
    criteriaMet: 0,
    criteriaTotal: 4,
  };
  const brief = abilityBrief(o, draft.level);
  return (
    <section className="practice-quality" aria-label="Practice quality">
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            onChange(e.target.checked ? draft : undefined);
          }}
        />
        Use this result to adapt future work
      </label>
      {enabled && (
        <>
          <label>
            Specific subject
            <input
              aria-label="Practice subject"
              value={draft.subject}
              maxLength={100}
              onChange={(e) => onChange({ ...draft, subject: e.target.value })}
            />
          </label>
          <label>
            Same source / setup
            <input
              aria-label="Practice comparison source"
              value={draft.source}
              maxLength={140}
              onChange={(e) => onChange({ ...draft, source: e.target.value })}
            />
          </label>
          <ul>
            {brief.criteria.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <label>
            Criteria met
            <select
              aria-label="Practice criteria met"
              value={draft.criteriaMet}
              onChange={(e) =>
                onChange({ ...draft, criteriaMet: Number(e.target.value) })
              }
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} / 4
                </option>
              ))}
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.independent}
              onChange={(e) =>
                onChange({ ...draft, independent: e.target.checked })
              }
            />
            Independent work
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.unfamiliar}
              onChange={(e) =>
                onChange({ ...draft, unfamiliar: e.target.checked })
              }
            />
            Unfamiliar work at this difficulty
          </label>
        </>
      )}
    </section>
  );
}
