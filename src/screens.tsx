import GuildWork from "./GuildWork";
import { loginReward, claimLoginReward, LOGIN_REWARDS } from "./login-rewards";
import { campaign } from "./rpg";
import { examTargets } from "./exams";
import RequestBoard from "./RequestBoard";
import ClassExams from "./ClassExams";
import { displayAssessmentResults } from "./metrics";
import ClassBrowser from "./ClassBrowser";
import VocationPanel from "./VocationPanel";
import GuildCard from "./GuildCard";

import AdventureGame from "./AdventureGame";
import SkillTree from "./SkillTree";
import ProfessionPicker from "./ProfessionPicker";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Plus,
  Trophy,
  Award,
  Target,
  Compass,
} from "lucide-react";
import type { Character, Objective, Stats } from "./domain";
import {
  CLASSES,
  ATTRIBUTES,
  SKILLS,
  RANKS,
  stats,
  currentPath,
  rankXP,
  characterRank,
  professionLevel,
  professionXP,
  professionStat,
  classLevel,
  classProgress,
  classXP,
  classRank,
  objectives,
  takenObjectives,
  isComplete,
  activity,
  switchClass,
  hasSkill,
} from "./domain";
import { Icon, Progress, StatRadar, Tag, Empty, STAT_NAMES } from "./ui";
export type Page =
  | "guild"
  | "objectives"
  | "paths"
  | "skills"
  | "adventures"
  | "journey"
  | "help"
  | "settings";
interface ScreenProps {
  c: Character;
  update: (c: Character) => boolean;
  navigate: (p: Page, section?: string) => void;
  section?: string;
  openObjective: (o: Objective) => void;
  notify: (s: string) => void;
}
export function ObjectiveRow({
  o,
  c,
  onClick,
}: {
  o: Objective;
  c: Character;
  onClick: () => void;
}) {
  const done = isComplete(c, o);
  return (
    <button
      className={`objective-row ${done ? "completed" : ""}`}
      onClick={onClick}
    >
      <span className={`objective-icon ${o.stat.toLowerCase()}`}>
        {done ? <Check size={20} /> : <Icon name={o.stat} />}
      </span>
      <span className="objective-text">
        <b>{o.title}</b>
        <span>
          {o.category} <i>·</i> <Clock3 size={11} /> {o.minutes}
        </span>
      </span>
      <span className="objective-reward">
        {done ? "Completed" : `+${o.xp} XP`}
        <small>
          {done
            ? "Saved"
            : o.statReward
              ? `+${o.statReward.amount} ${o.statReward.stat}`
              : `${o.scope || "class"} XP`}
        </small>
      </span>
      <ChevronRight size={16} className="row-chevron" />
    </button>
  );
}
function Attributes({ s }: { s: Stats }) {
  return (
    <div className="attribute-strip">
      {ATTRIBUTES.map((a) => (
        <div key={a}>
          <Icon name={a} size={17} />
          <strong>{s[a]}</strong>
          <small>{a}</small>
        </div>
      ))}
    </div>
  );
}
export function Guild({ c, navigate, openObjective, update }: ScreenProps) {
  const requests = takenObjectives(c).filter((o) => !isComplete(c, o)),
    reward = loginReward(c),
    data = campaign(c),
    exams = examTargets(c).filter((t) => t.ready),
    history = CLASSES.filter(
      (p) => classXP(c, p.id) > 0 || p.id === c.activeClass,
    ),
    week = activity(c);
  const cardSection = (section: string) =>
    section === "class"
      ? navigate("paths", "all")
      : section === "vocation"
        ? navigate("paths", "vocation")
        : navigate("skills", section === "profession" ? "profession" : section);
  return (
    <>
      <div className="guild-action-strip" aria-label="Guild actions">
        <button
          onClick={() =>
            navigate(
              "objectives",
              requests.length ? "taken:all" : "board:daily",
            )
          }
        >
          <Target size={19} />
          <span>
            <b>
              {requests.length
                ? `${requests.length} taken requests`
                : "Take a request"}
            </b>
            <small>
              {requests.some((o) => o.cadence !== "daily")
                ? "Daily · Weekly · Monthly"
                : "Today's work"}
            </small>
          </span>
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() =>
            exams.length
              ? navigate("paths", "exams")
              : navigate("skills", "skills")
          }
        >
          <Award size={19} />
          <span>
            <b>
              {exams.length ? `${exams.length} exams ready` : "Skill trees"}
            </b>
            <small>
              {exams.length
                ? "Banked XP retained"
                : `${currentPath(c).name} · Lv. ${classLevel(c, c.activeClass)}`}
            </small>
          </span>
          <ArrowRight size={16} />
        </button>
        <button onClick={() => navigate("adventures")}>
          <Compass size={19} />
          <span>
            <b>
              {data.battle || data.world?.expedition
                ? "Resume expedition"
                : "Adventures"}
            </b>
            <small>{data.gold.toLocaleString()} gold</small>
          </span>
          <ArrowRight size={16} />
        </button>
      </div>
      <GuildWork c={c} navigate={navigate} openObjective={openObjective} />
      <div className="dashboard-top guild-hub-top">
        <GuildCard
          c={c}
          onSkills={() => navigate("skills", "skills")}
          onSection={cardSection}
        />
        <section className="panel login-panel">
          <div className="section-heading">
            <h3>Guild allowance</h3>
            <span className="gold-balance">
              {data.gold.toLocaleString()} gold
            </span>
          </div>
          <div className="login-days">
            {LOGIN_REWARDS.map((r, i) => (
              <div
                key={i}
                className={i + 1 === reward.cycleDay ? "current" : ""}
              >
                <small>DAY {i + 1}</small>
                <b>{r.gold}</b>
                <span>gold</span>
                <small>
                  {r.potion ? `${r.potion} potion` : "1 ether"}
                  {r.potion && r.ether ? " + ether" : ""}
                </small>
              </div>
            ))}
          </div>
          <button
            className="button primary full"
            disabled={reward.claimed}
            onClick={() => update(claimLoginReward(c))}
          >
            {reward.claimed
              ? "Claimed today"
              : `Claim day ${reward.cycleDay} reward`}
          </button>
          <div className="hub-shortcuts">
            <button onClick={() => navigate("adventures")}>
              {" "}
              {data.battle || data.world?.expedition
                ? "Resume expedition"
                : "Adventures"}{" "}
              <ArrowRight size={15} />
            </button>
            <button onClick={() => navigate("skills", "skills")}>
              Skill trees <ArrowRight size={15} />
            </button>
          </div>
          {exams.map((t) => (
            <button
              className="hub-exam"
              key={`${t.scope}-${t.owner}`}
              onClick={() => navigate("paths", "exams")}
            >
              <Award size={18} />
              {t.name} · Lv. {t.milestone} exam ready
              <ArrowRight size={15} />
            </button>
          ))}
        </section>
      </div>
      <section className="panel legacy-panel">
        <div className="section-heading">
          <h3>Character record</h3>
          <button
            className="text-button"
            onClick={() => navigate("paths", "history")}
          >
            Class history <ArrowRight size={14} />
          </button>
        </div>
        <div className="legacy-badges">
          {history.map((path) => (
            <span
              key={path.id}
              className={path.id === c.activeClass ? "current" : ""}
            >
              <Icon name={path.icon} size={15} />
              {path.name} · Lv. {classLevel(c, path.id)}
              {path.id === c.activeClass && <small>CURRENT</small>}
            </span>
          ))}
          {SKILLS.filter((skill) => hasSkill(c, skill)).map((skill) => (
            <span key={skill.id}>
              <Award size={15} />
              {skill.name}
            </span>
          ))}
        </div>
      </section>
      <section className="panel hub-activity">
        <div>
          <h3>Last 7 days</h3>
          <span>
            {week.reduce((n, d) => n + d.count, 0)} requests completed
          </span>
        </div>
        <div className="week-dots">
          {week.map((d) => (
            <div key={d.key}>
              <span className={d.count ? "active" : ""}>
                {d.count ? <Check size={15} /> : <span />}
              </span>
              <small>{d.label}</small>
            </div>
          ))}
        </div>
        <button className="text-button" onClick={() => navigate("journey")}>
          Journey & reports <ArrowRight size={15} />
        </button>
      </section>
    </>
  );
}
export function Objectives(props: ScreenProps) {
  return <RequestBoard {...props} />;
}
export function Paths({
  c,
  update,
  notify,
  openObjective,
  section,
}: ScreenProps) {
  const [view, setView] = useState(section || "all");
  const p = currentPath(c);
  const progress = classProgress(c, p.id);
  return (
    <>
      <div className="intro-banner class-current-banner">
        <Icon name={p.icon} size={30} />
        <div>
          <span className="eyebrow">ACTIVE CLASS</span>
          <h3>
            {p.name}{" "}
            <span className="inline-level">
              Lv. {classLevel(c, p.id)} · {p.tier}
            </span>
          </h3>
          <p>{p.goal}</p>
        </div>
      </div>
      <section className="class-next-step panel">
        <div>
          <b>
            {progress.examRequired
              ? `Level ${classLevel(c, p.id) + 1} exam ready`
              : progress.waiting
                ? "Class commission required"
                : `Next: ${p.name} level ${classLevel(c, p.id) + 1}`}
          </b>
          <span>
            {progress.current.toLocaleString()} /{" "}
            {progress.needed.toLocaleString()} XP
            {progress.banked > 0
              ? ` · ${progress.banked.toLocaleString()} XP banked`
              : ""}
          </span>
        </div>
        <button
          className="button primary"
          onClick={() => {
            if (progress.examRequired) setView("exams");
            else {
              const commission = objectives(c).find(
                (o) =>
                  o.scope === "class" &&
                  o.cadence === "daily" &&
                  o.kind !== "class-trial",
              );
              if (commission) openObjective(commission);
            }
          }}
        >
          {progress.examRequired ? "Open examination" : "Open class commission"}
          <ArrowRight size={16} />
        </button>
      </section>
      <div className="tabs">
        <button
          className={view === "all" ? "active" : ""}
          onClick={() => setView("all")}
        >
          Class paths
        </button>
        <button
          className={view === "vocation" ? "active" : ""}
          onClick={() => setView("vocation")}
        >
          Vocation
        </button>
        <button
          className={view === "exams" ? "active" : ""}
          onClick={() => setView("exams")}
        >
          Examinations
        </button>
        <button
          className={view === "history" ? "active" : ""}
          onClick={() => setView("history")}
        >
          Your class record
        </button>
      </div>
      {view === "all" && (
        <ClassBrowser
          c={c}
          selected={c.activeClass}
          onTrial={(id) => {
            const trial = objectives(c).find((o) => o.targetClass === id);
            if (trial) openObjective(trial);
          }}
          onSelect={(id) => {
            if (update(switchClass(c, id)))
              notify(
                `${CLASSES.find((p) => p.id === id)!.name} selected. Earlier class progress retained.`,
              );
          }}
        />
      )}
      {view === "vocation" && <VocationPanel c={c} update={update} />}
      {view === "exams" && <ClassExams c={c} update={update} />}
      {view === "history" && (
        <section className="panel record-panel">
          <h3>Class chronicle</h3>
          {CLASSES.filter(
            (p) => classXP(c, p.id) > 0 || p.id === c.activeClass,
          ).map((p) => {
            const prog = classProgress(c, p.id);
            return (
              <div className="class-record" key={p.id}>
                <span className={`path-icon ${p.color}`}>
                  <Icon name={p.icon} />
                </span>
                <div>
                  <h4>
                    {p.name} {p.id === c.activeClass && <Tag>Current</Tag>}
                  </h4>
                  <small>
                    Level {classLevel(c, p.id)} ·{" "}
                    {classRank(classLevel(c, p.id))} ·{" "}
                    {classXP(c, p.id).toLocaleString()} XP earned
                  </small>
                  <Progress
                    value={prog.current}
                    max={prog.needed}
                    label={`${p.name} next level`}
                  />
                  {prog.waiting && (
                    <small className="class-trial-status">
                      {prog.examRequired
                        ? `Level ${classLevel(c, p.id) + 1} exam required · XP retained`
                        : "Class commission required · XP retained"}
                    </small>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
export function Skills({
  c,
  update,
  onCertificate,
  initialTab,
}: {
  c: Character;
  update: (c: Character) => boolean;
  onCertificate: () => void;
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab || "attributes"),
    s = stats(c);
  return (
    <>
      <div className="tabs">
        <button
          className={tab === "attributes" ? "active" : ""}
          onClick={() => setTab("attributes")}
        >
          Attributes
        </button>
        <button
          className={tab === "skills" ? "active" : ""}
          onClick={() => setTab("skills")}
        >
          Skill tree
        </button>
        <button
          className={tab === "profession" ? "active" : ""}
          onClick={() => setTab("profession")}
        >
          Profession & credentials
        </button>
        <button
          className={tab === "rank" ? "active" : ""}
          onClick={() => setTab("rank")}
        >
          Guild ranks
        </button>
      </div>
      {tab === "attributes" && (
        <>
          <div className="stats-top">
            <section className="panel stat-radar-panel">
              <span className="eyebrow">ATTRIBUTES</span>
              <StatRadar values={s} />
              <Attributes s={s} />
            </section>
          </div>
          {c.baseline.assessment && (
            <section className="panel performance-ledger">
              <h3>Latest real-world check</h3>
              {displayAssessmentResults(
                c.baseline.assessment,
                c.preferences?.units,
              ).map((r) => (
                <div key={r.stat}>
                  <b>{r.stat}</b>
                  <span>{r.raw}</span>
                  <Tag>
                    {r.measured
                      ? r.evidence === "published"
                        ? "Published reference"
                        : "Provisional reference"
                      : "Unassessed"}
                  </Tag>
                </div>
              ))}
            </section>
          )}
          <div className="stat-detail-grid">
            {ATTRIBUTES.map((a) => {
              const earned = s[a] - c.baseStats[a];
              return (
                <section className="panel stat-detail" key={a}>
                  <div>
                    <span className={`objective-icon ${a.toLowerCase()}`}>
                      <Icon name={a} />
                    </span>
                    <span>
                      <h3>{STAT_NAMES[a]}</h3>
                      <small>
                        {a} · Baseline {c.baseStats[a]} + {earned} earned
                      </small>
                    </span>
                    <b>{s[a]}</b>
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
      {tab === "skills" && (
        <SkillTree c={c} update={update} onCertificate={onCertificate} />
      )}
      {tab === "profession" && (
        <div className="profession-layout">
          <section className="panel">
            <span className="eyebrow">PROFESSION</span>
            <h2>{c.profession}</h2>
            <Tag>
              Level {professionLevel(c)} · {professionXP(c)} XP · Focus{" "}
              {professionStat(c.profession)}
            </Tag>
            <ProfessionPicker
              value={c.profession}
              onChange={(profession) => update({ ...c, profession })}
            />
            <details className="profession-history">
              <summary>Profession history</summary>
              {[
                ...new Set([
                  c.profession,
                  ...c.completions
                    .filter((o) => o.scope === "profession" && o.profession)
                    .map((o) => o.profession!),
                ]),
              ].map((name) => (
                <div key={name}>
                  <b>{name}</b>
                  <small>
                    Level {professionLevel(c, name)} · {professionXP(c, name)}{" "}
                    XP
                  </small>
                </div>
              ))}
            </details>
          </section>
          <section className="panel">
            <div className="section-heading">
              <h3>Credential ledger</h3>
              <button className="text-button" onClick={onCertificate}>
                <Plus size={16} />
                Add
              </button>
            </div>
            {c.certificates.length ? (
              c.certificates.map((cert) => (
                <div className="credential-row" key={cert.id}>
                  <Award size={24} />
                  <div>
                    <b>{cert.name}</b>
                    <small>
                      {cert.issuer} · {cert.date} · Self-reported
                    </small>
                    {cert.reference && <small>{cert.reference}</small>}
                  </div>
                  <button
                    className="text-button"
                    onClick={() =>
                      update({
                        ...c,
                        certificates: c.certificates.filter(
                          (x) => x.id !== cert.id,
                        ),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <Empty icon="shield" title="No credentials recorded"></Empty>
            )}
            <button className="button secondary full" onClick={onCertificate}>
              <Plus size={16} /> Record a certification
            </button>
          </section>
        </div>
      )}
      {tab === "rank" && (
        <>
          <div className="intro-banner">
            <Trophy size={30} />
            <div>
              <h3>Adventurer ranks</h3>
            </div>
          </div>
          <div className="ranks-grid">
            {RANKS.map((r) => (
              <section
                className={`panel rank-tile ${characterRank(c).name === r.name ? "selected" : ""}`}
                key={r.name}
              >
                <div className="rank-mini">{r.name}</div>
                <h3>
                  {r.metal} · {r.name}
                </h3>
                <p>{r.xp.toLocaleString()} rank XP</p>
                <Tag tone={rankXP(c) >= r.xp ? "green" : "neutral"}>
                  {characterRank(c).name === r.name
                    ? "Your current rank"
                    : rankXP(c) >= r.xp
                      ? "Achieved"
                      : "Locked"}
                </Tag>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
export function Adventures({ c, update }: ScreenProps) {
  return <AdventureGame c={c} update={update} />;
}
