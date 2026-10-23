import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Leaf,
  Globe,
  Dumbbell,
} from "lucide-react";
import {
  CLASSES,
  EMPTY_BASELINE,
  startingStats,
  available,
  createCharacter,
  demoCharacter,
  startingRankFor,
} from "./domain";
import type { Character, Baseline } from "./domain";
import { Crest, Icon, Tag } from "./ui";
import ProfessionPicker from "./ProfessionPicker";
export default function Onboarding({
  onCreate,
  onGoogle,
}: {
  onCreate: (c: Character) => void;
  onGoogle: () => void;
}) {
  const [step, setStep] = useState(0),
    [name, setName] = useState(""),
    [baseline, setBaseline] = useState<Baseline>({ ...EMPTY_BASELINE }),
    [classId, setClassId] = useState("disciple"),
    [profession, setProfession] = useState("Analyst");
  const [drafts, setDrafts] = useState<Partial<Record<keyof Baseline, string>>>(
    {},
  );
  const values = startingStats(baseline);
  const input = (
    key: keyof Baseline,
    label: string,
    max: number,
    help: string,
  ) => (
    <label className="assessment-field" key={key}>
      <span>{label}</span>
      <input
        type="number"
        min="0"
        max={max}
        inputMode="numeric"
        value={drafts[key] ?? (baseline[key] || "")}
        placeholder="Not assessed"
        step={key === "load" || key === "bodyweight" ? "0.1" : "1"}
        onChange={(e) => {
          const raw = e.target.value;
          setDrafts({ ...drafts, [key]: raw });
          setBaseline({
            ...baseline,
            [key]: Math.max(0, Math.min(max, Number(raw) || 0)),
          });
        }}
        onBlur={() => {
          if (drafts[key])
            setDrafts({ ...drafts, [key]: String(baseline[key]) });
        }}
      />
      <small>{help}</small>
    </label>
  );
  return (
    <div className="onboarding">
      <div className="onboard-art">
        <div className="onboard-brand">
          <Crest small />
          <span>THE GUILD</span>
        </div>
        <div className="onboard-copy">
          <span className="eyebrow">THE ADVENTURERS’ GUILD</span>
          <h1>
            Train. Study.
            <br />
            Level up.
          </h1>
          <p>
            Track real-world training, learning, and Christian practice.
            <br />
            Build a character from your progress.
          </p>
          <span className="art-caption">
            <span /> CHARACTER REGISTRATION
          </span>
        </div>
        <div className="art-coordinates">
          THE GUILD <span>✦</span> ANDROID
        </div>
      </div>
      <main className="onboard-form">
        {step === 0 ? (
          <div className="welcome">
            <Tag>REGISTRATION</Tag>
            <h2>
              Create an
              <br />
              adventurer.
            </h2>
            <p>
              Choose a profession, record your starting assessment, and select a
              class. Equipment is optional.
            </p>
            <div className="welcome-points">
              <div>
                <Icon name="sword" />
                <span>Earn XP from real-world objectives</span>
              </div>
              <div>
                <Icon name="book" />
                <span>Train attributes and unlock skill trees</span>
              </div>
              <div>
                <Icon name="shield" />
                <span>Keep skills and levels when switching classes</span>
              </div>
            </div>
            <button className="button primary full" onClick={() => setStep(1)}>
              Register character <ArrowRight size={18} />
            </button>
            <button className="button secondary full" onClick={onGoogle}>
              <Globe size={17} /> Link Google account
            </button>
            <button
              className="text-button full"
              onClick={() => onCreate(demoCharacter())}
            >
              Try a sample character <ArrowRight size={15} />
            </button>
            <p className="privacy-note">
              Private by default. Start locally, link Google when you’re ready.
            </p>
          </div>
        ) : (
          <div className="application">
            <div className="step-heading">
              <button
                className="icon-button"
                aria-label="Previous step"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={20} />
              </button>
              <span>GUILD APPLICATION · {step} OF 3</span>
            </div>
            <div className="step-progress">
              {[1, 2, 3].map((i) => (
                <span className={step >= i ? "active" : ""} key={i} />
              ))}
            </div>
            {step === 1 && (
              <>
                <span className="eyebrow">PROFILE</span>
                <h2>Character profile</h2>
                <p>Choose your display name and current profession.</p>
                <label className="field">
                  Adventurer name
                  <input
                    autoFocus
                    maxLength={32}
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <ProfessionPicker value={profession} onChange={setProfession} />
                <p className="helper">
                  A profession is your chosen craft. Switch it whenever your
                  goals change.
                </p>
                <button
                  className="button primary full"
                  disabled={!name.trim()}
                  onClick={() => setStep(2)}
                >
                  Continue to assessment <ArrowRight size={18} />
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <span className="eyebrow">STARTING ASSESSMENT</span>
                <h2>Record your baseline</h2>
                <p>
                  Use comfortable recent results or estimates. Leave a field
                  blank if you have not assessed it. You never need to test to
                  exhaustion.
                </p>
                <div className="segmented">
                  <button
                    className={baseline.mode === "bodyweight" ? "active" : ""}
                    onClick={() =>
                      setBaseline({ ...baseline, mode: "bodyweight" })
                    }
                  >
                    <Leaf size={16} /> No equipment
                  </button>
                  <button
                    className={baseline.mode === "weights" ? "active" : ""}
                    onClick={() =>
                      setBaseline({ ...baseline, mode: "weights" })
                    }
                  >
                    <Dumbbell size={16} /> With weights
                  </button>
                </div>
                {baseline.mode === "bodyweight" && (
                  <label className="field">
                    Pushup variation
                    <select
                      value={baseline.pushupStyle || "floor"}
                      onChange={(e) =>
                        setBaseline({
                          ...baseline,
                          pushupStyle: e.target
                            .value as Baseline["pushupStyle"],
                        })
                      }
                    >
                      <option value="floor">Floor pushups</option>
                      <option value="knee">Knee pushups</option>
                      <option value="incline">Incline pushups</option>
                      <option value="wall">Wall pushups</option>
                    </select>
                  </label>
                )}
                <div className="assessment-grid">
                  {baseline.mode === "bodyweight" ? (
                    input(
                      "pushups",
                      "Pushups (repetitions)",
                      120,
                      "Wall, knee, or floor — use your variation.",
                    )
                  ) : (
                    <>
                      {input(
                        "load",
                        "Squat working weight (kg)",
                        500,
                        "A familiar, comfortable set; no max test.",
                      )}
                      {input(
                        "reps",
                        "Repetitions in that set",
                        30,
                        "Good technique, with reps in reserve.",
                      )}
                      {input(
                        "bodyweight",
                        "Body weight (kg)",
                        300,
                        "Needed for weighted strength scoring. Leave blank if unknown.",
                      )}
                    </>
                  )}
                  {input(
                    "squats",
                    "Bodyweight squats (repetitions)",
                    120,
                    "Use a chair for support if needed.",
                  )}
                  {input(
                    "walk",
                    "Walking duration (minutes)",
                    180,
                    "Your usual comfortable duration.",
                  )}
                  {input(
                    "balance",
                    "Balance duration (seconds)",
                    180,
                    "Stand near a wall; skip if unsuitable.",
                  )}
                  {input(
                    "reading",
                    "Reading / study (minutes per week)",
                    1200,
                    "Your recent weekly habit.",
                  )}
                  {input(
                    "reflection",
                    "Prayer / reflection (days per week)",
                    7,
                    "Your recent rhythm, without judgment.",
                  )}
                  {input(
                    "connection",
                    "Conversations (per week)",
                    30,
                    "A rough estimate is enough.",
                  )}
                </div>
                <div className="notice">
                  Attributes are game scores for motivation, not health,
                  intelligence, or faith assessments. Adapt movement to your
                  abilities.
                </div>
                <button
                  className="button primary full"
                  onClick={() => {
                    if (
                      !available(
                        CLASSES.find((p) => p.id === classId)!,
                        values,
                        0,
                      )
                    )
                      setClassId("disciple");
                    setStep(3);
                  }}
                >
                  Review starting classes <ArrowRight size={18} />
                </button>
              </>
            )}
            {step === 3 && (
              <>
                <span className="eyebrow">CLASS SELECTION</span>
                <h2>Choose a starting class</h2>
                <p>
                  Your baseline opens starting paths. You can change classes
                  freely as you qualify. Nothing you earn is lost.
                </p>
                <div className="starting-stats">
                  {Object.entries(values).map(([a, v]) => (
                    <span key={a}>
                      <small>{a}</small>
                      <b>{v}</b>
                    </span>
                  ))}
                </div>
                <div className="starter-paths">
                  {CLASSES.filter((p) => available(p, values, 0)).map((p) => (
                    <button
                      key={p.id}
                      className={classId === p.id ? "selected" : ""}
                      onClick={() => setClassId(p.id)}
                    >
                      <Icon name={p.icon} />
                      <span>
                        <b>{p.name}</b>
                        <small>{p.motto}</small>
                      </span>
                      {classId === p.id && <Check size={18} />}
                    </button>
                  ))}
                </div>
                <div className="rank-intro">
                  <div className="rank-mini">{startingRankFor(values)}</div>
                  <span>
                    Starting rank: {startingRankFor(values)}
                    <small>
                      Most assessments start at F. E and D require exceptional
                      results across several attributes.
                    </small>
                  </span>
                </div>
                <button
                  className="button primary full"
                  onClick={() =>
                    onCreate(
                      createCharacter(name, baseline, classId, profession),
                    )
                  }
                >
                  Create character <ArrowRight size={18} />
                </button>
              </>
            )}
          </div>
        )}
        <footer>✦ &nbsp; THE GUILD · PERSONAL DEVELOPMENT</footer>
      </main>
    </div>
  );
}
