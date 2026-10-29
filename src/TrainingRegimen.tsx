import { CheckList } from "./ui";
import { useState } from "react";
import type { Character, Objective } from "./domain";
import {
  objectives,
  takenObjectives,
  takeRequest,
  isTaken,
  isComplete,
  taskRequirements,
  currentPath,
  releaseRequest,
  objectivePeriod,
} from "./domain";
import { completeWithResult, resultSummary } from "./activity-results";
import {
  REGIMEN_RANKS,
  TRAINING_RANKS,
  validTrainingPlan,
} from "./training-prescriptions";
import type { TrainingPlan } from "./training-prescriptions";
import {
  defaultTrainingPlan,
  localDate,
  dateNumber,
  exerciseProgress,
  planProgress,
  personalizedWorkout,
  assessedPushLevel,
} from "./training-regimen";
import { hasEquipment } from "./preferences";
import { Icon, Tag } from "./ui";
import WorkoutRecordForm from "./WorkoutRecordForm";
export default function TrainingRegimen({
  c,
  update,
  openObjective,
}: {
  c: Character;
  update: (c: Character) => Promise<boolean>;
  openObjective: (o: Objective) => void;
}) {
  const [draft, setDraft] = useState<TrainingPlan>(
      () => c.trainingPlan || defaultTrainingPlan(c),
    ),
    [editing, setEditing] = useState(!c.trainingPlan),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [day, setDay] = useState<number | null>(null),
    [creditClass, setCreditClass] = useState(true);
  const plan = c.trainingPlan || draft,
    elapsed = Math.max(0, dateNumber(localDate()) - dateNumber(plan.startedOn)),
    today = elapsed % 7,
    selected = day ?? today;
  const strength = selected === 0 || selected === 3,
    session = selected === 3 ? "B" : "A";
  const all = objectives({ ...c, trainingPlan: plan }),
    taken = takenObjectives(c),
    preferred = all.find(
      (o) =>
        o.scope === "class" &&
        o.workout?.session === session &&
        o.cadence === "daily",
    );
  const planned = all.find(
    (o) =>
      o.id === `regimen-${session.toLowerCase()}-${plan.rank.toLowerCase()}`,
  )!;
  const existing = taken.find((o) => o.workout?.session === session);
  const request = existing || (creditClass && preferred ? preferred : planned);
  const p =
      request?.workout ||
      personalizedWorkout(
        { ...c, trainingPlan: plan },
        plan.rank,
        session,
        plan.environment,
      ),
    done = request && isComplete(c, request),
    accepted = request && isTaken(c, request),
    blocks = request
      ? taskRequirements(
          c,
          request,
          new Date(),
          accepted ? "complete" : "accept",
        )
      : [];
  const progress = planProgress(c, plan),
    recent = c.completions
      .filter((r) => r.workout)
      .slice(-4)
      .reverse();
  const walkingMinutes =
    plan.walkMinutes || ({ F: 5, E: 15, D: 30, C: 30 } as const)[plan.rank];
  const walk = all.find(
    (o) =>
      o.id ===
      (walkingMinutes >= 30
        ? "u-walk-brisk"
        : walkingMinutes >= 15
          ? "u-walk-15"
          : "u-walk-5"),
  );
  const save = async () => {
    if (!validTrainingPlan(draft)) {
      setError("Choose a valid start date and training rank.");
      return;
    }
    if (
      draft.environment !== "home" &&
      !hasEquipment(c.preferences?.equipment, "weights")
    ) {
      setError("Enable available weights or gym equipment in Settings first.");
      return;
    }
    setBusy(true);
    if (await update({ ...c, trainingPlan: { ...draft } })) {
      setEditing(false);
      setDay(null);
      setError("");
    }
    setBusy(false);
  };
  return (
    <section className="training-regimen" aria-label="Training regimen">
      <div className="section-heading">
        <h2>
          <Icon name="STR" /> Regimen
        </h2>
        <button
          className="text-button"
          onClick={() => {
            setDraft(plan);
            setEditing(!editing);
          }}
        >
          Edit plan
        </button>
      </div>
      {editing && (
        <form
          className="panel regimen-settings"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <h3>Balanced strength & fitness</h3>
          <p>Two strength days · five walking days · one recovery day</p>
          <label>
            Strength request rank
            <select
              value={draft.rank}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  rank: e.target.value as TrainingPlan["rank"],
                })
              }
            >
              {REGIMEN_RANKS.map((r) => (
                <option key={r} value={r}>
                  {r} · {TRAINING_RANKS[r].name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Pushing variation
            <select
              value={draft.pushLevel || assessedPushLevel(c)}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  pushLevel: Number(
                    e.target.value,
                  ) as TrainingPlan["pushLevel"],
                })
              }
            >
              <option value="1">Wall</option>
              <option value="2">Incline</option>
              <option value="3">Floor</option>
              <option value="4">
                Harder floor · tempo / low feet elevation
              </option>
            </select>
          </label>
          <p>
            Pushing setup follows your latest assessment. Sets follow the
            selected request rank; other movements are calibrated independently
            by reps in reserve.
          </p>
          {draft.environment === "home" && (
            <details>
              <summary>Calibrate legs, hips & core</summary>
              {(["squat", "hinge", "core"] as const).map((key) => (
                <label key={key}>
                  {
                    {
                      squat: "Leg variation",
                      hinge: "Hip variation",
                      core: "Core variation",
                    }[key]
                  }
                  <select
                    value={draft.movementLevels?.[key] || ""}
                    onChange={(e) => {
                      const levels = { ...draft.movementLevels };
                      if (e.target.value)
                        levels[key] = Number(e.target.value) as 1 | 2 | 3 | 4;
                      else delete levels[key];
                      setDraft({ ...draft, movementLevels: levels });
                    }}
                  >
                    <option value="">Use rank's starting setup</option>
                    {{
                      squat: [
                        "Chair sit-to-stand",
                        "Bodyweight squat",
                        "Supported split squat",
                        "Slow-tempo split squat",
                      ],
                      hinge: [
                        "Glute bridge",
                        "Paused bridge",
                        "Staggered-stance bridge",
                        "Single-leg bridge",
                      ],
                      core: [
                        "Short reach",
                        "Standard reach",
                        "Long reach / pause",
                        "Slow long reach / pause",
                      ],
                    }[key].map((name, i) => (
                      <option key={name} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <p>
                Use an easy practice set to find a setup where 6–12 reps leave
                2–3 clean reps possible. Assess each movement separately. For
                rows, self-resistance is a fallback; choose a weighed backpack
                or gym row for measurable pulling overload.
              </p>
            </details>
          )}
          <label>
            Equipment
            <select
              value={draft.environment}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  environment: e.target.value as TrainingPlan["environment"],
                })
              }
            >
              <option value="home">Home · no weights</option>
              <option value="weights">Weights / weighed backpack</option>
              <option value="gym">Gym equipment</option>
            </select>
          </label>
          <label>
            First strength day
            <input
              type="date"
              value={draft.startedOn}
              onChange={(e) =>
                setDraft({ ...draft, startedOn: e.target.value })
              }
            />
          </label>
          <label>
            Walking target · minutes per walking day
            <select
              value={
                draft.walkMinutes ||
                ({ F: 5, E: 15, D: 30, C: 30 } as const)[draft.rank]
              }
              onChange={(e) =>
                setDraft({ ...draft, walkMinutes: Number(e.target.value) })
              }
            >
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>
          <p>{TRAINING_RANKS[draft.rank].dose}</p>
          {error && <p role="alert">{error}</p>}
          <button className="button primary" disabled={busy}>
            {c.trainingPlan ? "Save plan" : "Start plan"}
          </button>
        </form>
      )}
      <div className="regimen-week" aria-label="Training week">
        {Array.from({ length: 7 }, (_, i) => {
          const date = new Date(plan.startedOn + "T12:00:00");
          date.setDate(date.getDate() + Math.floor(elapsed / 7) * 7 + i);
          return (
            <button
              key={i}
              aria-pressed={selected === i}
              onClick={() => setDay(i)}
            >
              <b>{date.toLocaleDateString(undefined, { weekday: "short" })}</b>
              <small>
                {i === 0
                  ? "Strength A"
                  : i === 3
                    ? "Strength B"
                    : i === 6
                      ? "Recovery"
                      : "Walk"}
                {i === today ? " · Today" : ""}
              </small>
            </button>
          );
        })}
      </div>
      {localDate() < plan.startedOn && (
        <p className="notice">
          Plan begins {plan.startedOn}. Preview the sessions below.
        </p>
      )}
      {plan.pushLevel && assessedPushLevel(c) > plan.pushLevel && !editing && (
        <p className="notice">
          Your latest pushup check supports a harder setup.{" "}
          <button
            className="text-button"
            onClick={() => {
              setDraft({ ...plan, pushLevel: assessedPushLevel(c) });
              setEditing(true);
            }}
          >
            Review exercise difficulty
          </button>
        </p>
      )}
      {strength ? (
        <section className="panel regimen-session">
          <div className="section-heading">
            <h3>Strength {session}</h3>
            <Tag tone="gold">
              {p.rank} · {p.minutes} min
            </Tag>
          </div>
          <p>{p.warmup}</p>
          <p>
            <b>Effort:</b> finish with about {p.rir} clean reps left. Keep the
            same setup for comparisons.
          </p>
          <ol className="regimen-exercises">
            {p.exercises.map((e) => {
              const history = exerciseProgress(c, p, e.id);
              return (
                <li key={e.id}>
                  <h4>{e.name}</h4>
                  <b>
                    {e.sets} × {e.min}–{e.max}
                    {e.perSide ? " each side" : ""} · rest {e.restSeconds} sec
                  </b>
                  {history.latest && (
                    <p className="regimen-last">
                      Last: {history.latest.reps.join(" / ")} reps
                      {history.latest.loadKg
                        ? ` · ${Math.round(history.latest.loadKg * (c.preferences?.units === "imperial" ? 2.2046226218 : 1) * 100) / 100} ${c.preferences?.units === "imperial" ? "lb" : "kg"}`
                        : ""}{" "}
                      · {history.latest.rir} reps left
                    </p>
                  )}
                  {history.ready && (
                    <p className="regimen-progress">
                      <b>Ready to progress:</b> {history.suggestion}
                    </p>
                  )}
                  <details>
                    <summary>Technique &amp; progression</summary>
                    <p>{e.cues}</p>
                    <p>{e.progress}</p>
                  </details>
                </li>
              );
            })}
          </ol>
          {!existing && preferred && (
            <label className="regimen-class-choice">
              <input
                type="checkbox"
                checked={creditClass}
                onChange={(e) => setCreditClass(e.target.checked)}
              />
              Use the {currentPath(c).name} class request
            </label>
          )}
          {request && (
            <div className="regimen-request-actions">
              <p>
                <b>{request.title}</b> · {request.xp} XP · {request.gold} gold
              </p>
              {done ? (
                <p className="notice">Completed today</p>
              ) : accepted ? (
                <>
                  <Tag>Taken · {request.workout!.environment}</Tag>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      await update(releaseRequest(c, request.id));
                      setBusy(false);
                    }}
                  >
                    Release request
                  </button>
                </>
              ) : (
                <button
                  className="button primary full"
                  disabled={
                    busy ||
                    !c.trainingPlan ||
                    blocks.length > 0 ||
                    localDate() < plan.startedOn
                  }
                  onClick={async () => {
                    setBusy(true);
                    await update(takeRequest(c, request.id));
                    setBusy(false);
                  }}
                >
                  Take strength session
                </button>
              )}
              {!done && blocks.length > 0 && (
                <p className="notice">{blocks[0]}</p>
              )}
              {accepted && !done && request.checklist && (
                <section className="regimen-focus">
                  <h4>Class focus</h4>
                  <CheckList
                    items={request.checklist}
                    checked={
                      c.milestones[
                        `${request.id}:${objectivePeriod(request)}`
                      ] || []
                    }
                    setChecked={async (items) => {
                      setBusy(true);
                      await update({
                        ...c,
                        milestones: {
                          ...c.milestones,
                          [`${request.id}:${objectivePeriod(request)}`]: items,
                        },
                      });
                      setBusy(false);
                    }}
                  />
                </section>
              )}
              {accepted && !done && !blocks.length && (
                <WorkoutRecordForm
                  receiptKey={`${request.id}:${c.takenRequests?.find((r) => r.id === request.id)?.takenAt}`}
                  key={`${request.id}:${plan.startedOn}`}
                  c={c}
                  ready={
                    !request.checklist ||
                    (
                      c.milestones[
                        `${request.id}:${objectivePeriod(request)}`
                      ] || []
                    ).length === request.checklist.length
                  }
                  prescription={p}
                  pending={busy}
                  onSubmit={async (workout) => {
                    setBusy(true);
                    const next = completeWithResult(c, request, { workout });
                    const ok = next !== c && (await update(next));
                    setBusy(false);
                    return ok;
                  }}
                />
              )}
            </div>
          )}
          {selected === 0 && walk && (
            <button
              className="button secondary"
              onClick={() => openObjective(walk)}
            >
              Walking target · {walkingMinutes} min
            </button>
          )}
        </section>
      ) : (
        <section className="panel regimen-recovery">
          <h3>{selected === 6 ? "Recovery day" : "Walking"}</h3>
          {selected === 6 ? (
            <p>
              Rest from hard strength work. Optional comfortable walking and
              gentle mobility.
            </p>
          ) : (
            <>
              <p>
                <b>Plan target: {walkingMinutes} minutes.</b>{" "}
                {walk?.description}
              </p>
              <p>
                Record the actual duration. The request pays once for its listed
                minimum; additional minutes do not create extra claims.
              </p>
              {walk && (
                <button
                  className="button primary"
                  onClick={() => openObjective(walk)}
                >
                  {walk.title} · {walk.xp} XP
                </button>
              )}
              <p>
                Keep a conversational pace. Build duration by a few minutes when
                the current walks feel comfortable; the next rank is a target to
                work toward.
              </p>
            </>
          )}
          <details>
            <summary>Mobility · 3–5 minutes</summary>
            <p>
              Ten comfortable ankle rocks per side, five controlled shoulder
              circles each way and five easy hip hinges. Use support for
              balance. This warm-up is not a second hard strength session.
            </p>
          </details>
        </section>
      )}
      <section className="panel">
        <h3>Progression</h3>
        <p>{TRAINING_RANKS[plan.rank].progress}</p>
        <p>
          {progress.days} logged strength days at {plan.rank} · two sessions
          weekly
        </p>
        {progress.ready && progress.next ? (
          <p className="notice">
            Review strength rank {progress.next}. Your recent sessions meet the
            current top ranges with at least two clean reps left. Choose the
            next rank in Edit plan when the movements remain controlled.
          </p>
        ) : (
          <p>
            Progress an exercise after two comparable top-range sessions on
            separate days. Change one variable: reps, then variation or a small
            load increase. Improvement is reviewed from recorded work, not from
            elapsed time alone.
          </p>
        )}
        <details>
          <summary>Rank guide · F–SSS</summary>
          {Object.entries(TRAINING_RANKS).map(([r, v]) => (
            <p key={r}>
              <b>
                {r} · {v.name}
              </b>
              <br />
              {v.dose} {v.progress}
            </p>
          ))}
        </details>
      </section>
      <section className="panel">
        <h3>Strength commitments</h3>
        <div className="regimen-goals">
          {(["weekly", "monthly"] as const).map((cadence) => {
            const o = all.find(
              (r) => r.id === `regimen-${cadence}-${plan.rank.toLowerCase()}`,
            )!;
            return (
              <button
                key={cadence}
                className="button secondary"
                onClick={() => openObjective(o)}
              >
                {cadence === "weekly"
                  ? "Strength week · 2 days"
                  : "Strength month · 8 days"}{" "}
                · {o.xp} XP
              </button>
            );
          })}
        </div>
      </section>
      {recent.length > 0 && (
        <section className="panel">
          <h3>Recent training</h3>
          {recent.map((r) => (
            <details key={`${r.id}:${r.period}`}>
              <summary>
                {new Date(r.at).toLocaleDateString()} · {r.workout!.rank} ·
                session {r.workout!.session}
              </summary>
              <p>
                {r.result?.workout
                  ? resultSummary(r.result, c.preferences?.units === "imperial")
                  : "Completed without measured results"}
              </p>
            </details>
          ))}
        </section>
      )}
    </section>
  );
}
