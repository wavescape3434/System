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
  PROFESSIONS,
  EMPTY_BASELINE,
  startingStats,
  available,
  createCharacter,
  demoCharacter,
} from "./domain";
import type { Character, Baseline } from "./domain";
import { Crest, Icon, Tag } from "./ui";
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
        value={baseline[key]}
        onChange={(e) =>
          setBaseline({
            ...baseline,
            [key]: Math.max(0, Math.min(max, Number(e.target.value))),
          })
        }
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
          <span className="eyebrow">
            AN ORDINARY LIFE. AN EXTRAORDINARY STORY.
          </span>
          <h1>
            Become who
            <br />
            you’re called to be.
          </h1>
          <p>
            Stronger in body. Sharper in mind.
            <br />
            Steadier in heart. One small quest at a time.
          </p>
          <span className="art-caption">
            <span /> YOUR ADVENTURE BEGINS IN THE EVERYDAY
          </span>
        </div>
        <div className="art-coordinates">
          EST. TODAY <span>✦</span> THE REALM OF POSSIBILITY
        </div>
      </div>
      <main className="onboard-form">
        {step === 0 ? (
          <div className="welcome">
            <Tag>YOUR GUILD INVITATION</Tag>
            <h2>
              Every hero
              <br />
              starts somewhere.
            </h2>
            <p>
              You don’t need a gym, a perfect routine, or a fresh start. Just a
              willingness to take the next step.
            </p>
            <div className="welcome-points">
              <div>
                <Icon name="sword" />
                <span>Turn real effort into lasting progress</span>
              </div>
              <div>
                <Icon name="book" />
                <span>Build a path for body, mind & heart</span>
              </div>
              <div>
                <Icon name="shield" />
                <span>Keep everything you earn along the way</span>
              </div>
            </div>
            <button className="button primary full" onClick={() => setStep(1)}>
              Begin your story <ArrowRight size={18} />
            </button>
            <button className="button secondary full" onClick={onGoogle}>
              <Globe size={17} /> Link Google account
            </button>
            <button
              className="text-button full"
              onClick={() => onCreate(demoCharacter())}
            >
              Explore a sample character first <ArrowRight size={15} />
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
                <span className="eyebrow">FIRST, AN INTRODUCTION</span>
                <h2>
                  What shall we
                  <br />
                  call you, adventurer?
                </h2>
                <p>
                  Your guild name is yours to choose. Your story will be
                  uniquely yours.
                </p>
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
                <label className="field">
                  Your profession
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                  >
                    {PROFESSIONS.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <p className="helper">
                  A profession is your chosen craft. Switch it whenever your
                  goals change.
                </p>
                <button
                  className="button primary full"
                  disabled={!name.trim()}
                  onClick={() => setStep(2)}
                >
                  Meet the guild examiner <ArrowRight size={18} />
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <span className="eyebrow">
                  THE BASELINE, NOT THE FINISH LINE
                </span>
                <h2>
                  Meet yourself
                  <br />
                  where you are.
                </h2>
                <p>
                  Use comfortable recent results or estimates. Skip anything you
                  don’t know by leaving it at zero. You never need to test to
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
                <div className="assessment-grid">
                  {baseline.mode === "bodyweight" ? (
                    input(
                      "pushups",
                      "Comfortable pushups",
                      80,
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
                        "Used only to scale your baseline.",
                      )}
                    </>
                  )}
                  {input(
                    "squats",
                    "Comfortable bodyweight squats",
                    80,
                    "Use a chair for support if needed.",
                  )}
                  {input(
                    "walk",
                    "Comfortable walking (minutes)",
                    120,
                    "Your usual comfortable duration.",
                  )}
                  {input(
                    "balance",
                    "Supported balance (seconds)",
                    90,
                    "Stand near a wall; skip if unsuitable.",
                  )}
                  {input(
                    "reading",
                    "Reading / study (min per week)",
                    150,
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
                    "Meaningful conversations per week",
                    10,
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
                  Discover your path <ArrowRight size={18} />
                </button>
              </>
            )}
            {step === 3 && (
              <>
                <span className="eyebrow">YOUR FIRST CHAPTER</span>
                <h2>A path, not a box.</h2>
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
                  <div className="rank-mini">F</div>
                  <span>
                    Every adventurer begins at F rank.
                    <small>Your first chapter is full of possibility.</small>
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
                  Take the guild oath <ArrowRight size={18} />
                </button>
              </>
            )}
          </div>
        )}
        <footer>✦ &nbsp; GROW AT YOUR OWN PACE. KEEP YOUR OWN STORY.</footer>
      </main>
    </div>
  );
}
