import AssessmentForm from "./AssessmentForm";
import { EMPTY_ASSESSMENT } from "./metrics";
import ClassBrowser from "./ClassBrowser";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Globe } from "lucide-react";
import {
  CLASSES,
  RANKS,
  EMPTY_BASELINE,
  startingStats,
  available,
  createCharacter,
  demoCharacter,
  startingRankFor,
} from "./domain";
import type { Character, Baseline } from "./domain";
import { Crest, Tag } from "./ui";
import ProfessionPicker from "./ProfessionPicker";
export default function Onboarding({
  onCreate,
  onGoogle,
  onHelp,
}: {
  onCreate: (c: Character) => void;
  onGoogle: () => void;
  onHelp: () => void;
}) {
  const [step, setStep] = useState(0),
    [name, setName] = useState(""),
    [baseline, setBaseline] = useState<Baseline>({
      ...EMPTY_BASELINE,
      assessment: { ...EMPTY_ASSESSMENT },
    }),
    [seenForms, setSeenForms] = useState<string[]>([]),
    [units, setUnits] = useState<"metric" | "imperial">("metric"),
    [classId, setClassId] = useState("disciple"),
    [profession, setProfession] = useState("Analyst");
  const values = startingStats(baseline);
  return (
    <div className="onboarding">
      <div className="onboard-art">
        <div className="onboard-brand">
          <Crest small />
          <span>THE ADVENTURERS GUILD</span>
        </div>
        <div className="onboard-copy">
          <span className="eyebrow">THE ADVENTURERS GUILD</span>
          <h1>
            The Adventurers
            <br />
            Guild
          </h1>
          <span className="art-caption">
            <span /> CHARACTER REGISTRATION
          </span>
        </div>
        <div className="art-coordinates">
          THE ADVENTURERS GUILD <span>✦</span> ANDROID
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
            <button className="text-button full" onClick={onHelp}>
              Help
            </button>
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
                <AssessmentForm
                  units={units}
                  usedForms={seenForms}
                  onFormStart={(id) =>
                    setSeenForms([...new Set([...seenForms, id])])
                  }
                  onUnitsChange={setUnits}
                  completeLabel="Review starting classes"
                  onComplete={() => {
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
                  value={baseline.assessment!}
                  onChange={(assessment) =>
                    setBaseline({
                      ...baseline,
                      mode:
                        assessment.strengthTest === "weighted"
                          ? "weights"
                          : "bodyweight",
                      assessment,
                    })
                  }
                />
              </>
            )}
            {step === 3 && (
              <>
                <span className="eyebrow">CLASS SELECTION</span>
                <h2>Choose a starting class</h2>
                <div className="starting-stats">
                  {Object.entries(values).map(([a, v]) => (
                    <span key={a}>
                      <small>{a}</small>
                      <b>{v}</b>
                    </span>
                  ))}
                </div>
                <ClassBrowser
                  baseline={values}
                  selected={classId}
                  onSelect={setClassId}
                />
                <div className="rank-intro">
                  <div className="rank-mini">{startingRankFor(values)}</div>
                  <span>
                    Starting rank: {startingRankFor(values)} ·{" "}
                    {
                      RANKS.find((r) => r.name === startingRankFor(values))!
                        .metal
                    }
                  </span>
                </div>
                <button
                  className="button primary full"
                  onClick={() =>
                    onCreate({
                      ...createCharacter(name, baseline, classId, profession),
                      assessmentFormsSeen: seenForms,
                      preferences: {
                        units,
                        textSize: "standard",
                        reduceMotion: false,
                        equipment:
                          baseline.mode === "weights"
                            ? ["bodyweight", "weights"]
                            : ["bodyweight"],
                        showLockedRequests: true,
                        defaultPage: "guild",
                      },
                    })
                  }
                >
                  Create character <ArrowRight size={18} />
                </button>
              </>
            )}
          </div>
        )}
        <footer>
          <button onClick={onHelp}>Help</button> · THE ADVENTURERS GUILD
        </footer>
      </main>
    </div>
  );
}
