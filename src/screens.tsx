import ClassBrowser from "./ClassBrowser";
import VocationPanel from "./VocationPanel";
import GuildCard from "./GuildCard";
import { levelProgress } from "./progression";
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
  Sparkles,
  Trophy,
  Flag,
  Award,
} from "lucide-react";
import type { Character, Objective, Cadence, Stats } from "./domain";
import {
  CLASSES,
  ATTRIBUTES,
  SKILLS,
  RANKS,
  stats,
  currentPath,
  totalXP,
  rankXP,
  characterRank,
  professionLevel,
  professionXP,
  professionStat,
  classLevel,
  classXP,
  classRank,
  objectives,
  takeRequest,
  takenObjectives,
  suggestedObjectives,
  isTaken,
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
  | "help";
interface ScreenProps {
  c: Character;
  update: (c: Character) => boolean;
  navigate: (p: Page) => void;
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
export function Guild({ c, navigate, openObjective }: ScreenProps) {
  const xp = totalXP(c),
    s = stats(c),
    dailies = objectives(c).filter((o) => o.cadence === "daily"),
    done = dailies.filter((o) => isComplete(c, o)).length,
    week = activity(c),
    nextRank = RANKS.find((r) => r.xp > rankXP(c));
  const history = CLASSES.filter(
    (p) => classXP(c, p.id) > 0 || p.id === c.activeClass,
  );
  return (
    <>
      <div className="dashboard-top">
        <GuildCard c={c} onSkills={() => navigate("skills")} />
        <section className="panel rank-panel">
          <div className="section-heading">
            <h3>Adventurer rank</h3>
            <Trophy size={17} />
          </div>
          <div className="rank-emblem">
            <span>GUILD RANK</span>
            <strong>{characterRank(c).name}</strong>
            <span>{xp === 0 ? "REGISTERED" : "ACTIVE"}</span>
          </div>
          <div className="small-progress-label">
            <span>
              {nextRank ? `Toward ${nextRank.name} rank` : "Highest guild rank"}
            </span>
            <b>
              {rankXP(c).toLocaleString()} /{" "}
              {(nextRank?.xp || RANKS.at(-1)!.xp).toLocaleString()} XP
            </b>
          </div>
          <Progress value={rankXP(c)} max={nextRank?.xp || RANKS.at(-1)!.xp} />
          <button className="text-button" onClick={() => navigate("skills")}>
            View your progression <ArrowRight size={14} />
          </button>
        </section>
      </div>
      <div className="metrics-row">
        <div>
          <span className="metric-icon">
            <Flag size={20} />
          </span>
          <span>
            <b>
              {done}
              <small> / {dailies.length}</small>
            </b>
            <small>Daily objectives</small>
          </span>
        </div>
        <div>
          <span className="metric-icon gold">
            <Sparkles size={20} />
          </span>
          <span>
            <b>{xp.toLocaleString()}</b>
            <small>Total experience</small>
          </span>
        </div>
        <div>
          <span className="metric-icon blue">
            <Award size={20} />
          </span>
          <span>
            <b>{SKILLS.filter((s) => hasSkill(c, s)).length}</b>
            <small>Skills earned</small>
          </span>
        </div>
        <div>
          <span className="metric-icon rust">
            <Icon name="sword" />
          </span>
          <span>
            <b>{history.length}</b>
            <small>Paths explored</small>
          </span>
        </div>
      </div>
      <div className="dashboard-bottom">
        <section className="panel daily-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">DAILY TASKS</span>
              <h3>Daily objectives</h3>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("objectives")}
            >
              All objectives <ArrowRight size={14} />
            </button>
          </div>
          <div className="objective-list">
            {dailies.slice(0, 3).map((o) => (
              <ObjectiveRow
                key={o.id}
                o={o}
                c={c}
                onClick={() => openObjective(o)}
              />
            ))}
          </div>
          <div className="daily-footer">
            <span>
              {done} of {dailies.length} complete
            </span>
          </div>
        </section>
        <section className="panel attributes-panel">
          <div className="section-heading">
            <h3>Your attributes</h3>
            <button
              className="icon-button"
              aria-label="View skills and stats"
              onClick={() => navigate("skills")}
            >
              <ArrowRight size={17} />
            </button>
          </div>
          <div className="attribute-overview">
            <StatRadar values={s} />
            <div className="compact-stats">
              {ATTRIBUTES.map((a) => (
                <div key={a}>
                  <span>{a}</span>
                  <b>{s[a]}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <section className="panel legacy-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CLASS & SKILL HISTORY</span>
            <h3>Character record</h3>
          </div>
          <button className="text-button" onClick={() => navigate("paths")}>
            Explore paths <ArrowRight size={14} />
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
      <div className="dashboard-low">
        <section className="panel weekly-panel">
          <div>
            <span className="eyebrow">ACTIVITY</span>
            <h3>Last 7 days</h3>
            <p>
              {week.filter((x) => x.count > 0).length} active days in the last
              seven.
            </p>
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
        </section>
        <section className="quote-panel">
          <span>✦</span>
          <blockquote>
            “Let us not become weary
            <br />
            in doing good.”
          </blockquote>
          <small>GALATIANS 6:9</small>
        </section>
      </div>
    </>
  );
}
export function Objectives({ c, openObjective, update, notify }: ScreenProps) {
  const [view, setView] = useState("board"),
    [tab, setTab] = useState<Cadence>("daily"),
    [filter, setFilter] = useState("all");
  const board = objectives(c),
    taken = takenObjectives(c);
  const suggestions = suggestedObjectives(c);
  const source =
    view === "taken" ? taken : view === "suggested" ? suggestions : board;
  const list = source.filter(
    (o) =>
      o.cadence === tab &&
      (filter === "all" ||
        (filter === "vocation" && o.id.startsWith("vocation-")) ||
        (filter === "networking" && o.category === "Networking") ||
        (filter === "analysis" && o.category === "Data Analysis") ||
        o.scope === filter),
  );
  return (
    <>
      <div className="request-view-tabs">
        <button
          className={view === "board" ? "active" : ""}
          onClick={() => setView("board")}
        >
          Guild board
        </button>
        <button
          className={view === "taken" ? "active" : ""}
          onClick={() => setView("taken")}
        >
          Taken <span>{taken.filter((o) => !isComplete(c, o)).length}</span>
        </button>
        <button
          className={view === "suggested" ? "active" : ""}
          onClick={() => setView("suggested")}
        >
          Suggested <span>{suggestions.length}</span>
        </button>
      </div>
      <div className="tabs">
        {(["daily", "weekly", "monthly"] as Cadence[]).map((t) => (
          <button
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t === "daily"
              ? "Daily tasks"
              : t === "weekly"
                ? "Weekly quests"
                : "Monthly adventures"}
            <span>{source.filter((o) => o.cadence === t).length}</span>
          </button>
        ))}
      </div>
      <label className="objective-filter">
        Category
        <select
          aria-label="Objective category"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All objectives</option>
          <option value="class">Class</option>
          <option value="vocation">Vocation</option>
          <option value="profession">Profession & technical practice</option>
          <option value="universal">Universal</option>
          <option value="networking">Networking</option>
          <option value="analysis">Data Analysis</option>
        </select>
      </label>
      <div className="section-heading page-section-heading">
        <h3>
          {view === "taken"
            ? "Taken requests"
            : view === "suggested"
              ? "Suggested requests"
              : tab === "daily"
                ? "Daily tasks"
                : tab === "weekly"
                  ? "Weekly quests"
                  : "Monthly adventures"}
        </h3>
        <Tag>
          {list.filter((o) => isComplete(c, o)).length} / {list.length}{" "}
          completed
        </Tag>
      </div>
      <div className="guild-request-board">
        <div className="board-inscription">
          <span>✦</span>
          {view === "taken"
            ? "ACCEPTED COMMISSIONS"
            : view === "suggested"
              ? "RETURNING COMMISSIONS"
              : "REQUESTS OF THE ADVENTURERS’ GUILD"}
          <span>✦</span>
        </div>
        <div className="objectives-grid request-papers">
          {list.map((o) => (
            <article
              key={o.id}
              className={`panel objective-card guild-request-paper ${isComplete(c, o) ? "completed" : ""}`}
            >
              <button
                className="request-details"
                aria-label={`View ${o.title}`}
                onClick={() => openObjective(o)}
              >
                <span className="request-pin" aria-hidden="true" />
                <small className="request-number">
                  {o.cadence === "daily"
                    ? "GUILD TASK"
                    : o.cadence === "weekly"
                      ? "QUEST COMMISSION"
                      : "MONTHLY EXPEDITION"}
                </small>
                <div className="objective-card-top">
                  <span className={`objective-icon ${o.stat.toLowerCase()}`}>
                    <Icon name={o.stat} size={24} />
                  </span>
                  <Tag tone={isComplete(c, o) ? "green" : "neutral"}>
                    {isComplete(c, o) ? "Completed" : o.category}
                  </Tag>
                </div>
                <h3>{o.title}</h3>
                <p>{o.description}</p>
                {o.statReward && (
                  <Tag tone="gold">
                    +{o.statReward.amount} base {o.statReward.stat}
                  </Tag>
                )}
              </button>
              <div className="objective-card-bottom">
                <span>
                  <Clock3 size={14} />
                  {o.minutes}
                </span>
                <b>+{o.xp} XP</b>
              </div>
              <div className="request-actions">
                {isComplete(c, o) ? (
                  <button onClick={() => openObjective(o)}>
                    <Check size={15} />
                    Completed
                  </button>
                ) : isTaken(c, o) ? (
                  <button
                    className="taken-request-action"
                    onClick={() => openObjective(o)}
                  >
                    <Check size={15} />
                    Taken · Open
                  </button>
                ) : (
                  <button
                    aria-label={`Take ${o.title}`}
                    onClick={() => {
                      if (update(takeRequest(c, o.id)))
                        notify("Request taken.");
                    }}
                  >
                    <Plus size={15} />
                    Take request
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        {!list.length && (
          <div className="empty-request-board">
            <Icon name="compass" size={30} />
            <h3>
              {view === "taken"
                ? "No taken requests"
                : view === "suggested"
                  ? "No suggestions"
                  : "No requests"}
            </h3>
            {view !== "board" && (
              <button
                className="button secondary"
                onClick={() => setView("board")}
              >
                Browse guild board
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
export function Paths({ c, update, notify }: ScreenProps) {
  const [view, setView] = useState("all");
  const p = currentPath(c);
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
          onSelect={(id) => {
            if (update(switchClass(c, id)))
              notify(
                `${CLASSES.find((p) => p.id === id)!.name} selected. Earlier class progress retained.`,
              );
          }}
        />
      )}
      {view === "vocation" && <VocationPanel c={c} update={update} />}
      {view === "history" && (
        <section className="panel record-panel">
          <h3>Class chronicle</h3>
          {CLASSES.filter(
            (p) => classXP(c, p.id) > 0 || p.id === c.activeClass,
          ).map((p) => {
            const prog = levelProgress(
              classXP(c, p.id) + (c.legacyProgress?.classes[p.id] || 0),
            );
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
}: {
  c: Character;
  update: (c: Character) => boolean;
  onCertificate: () => void;
}) {
  const [tab, setTab] = useState("attributes"),
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
                <h3>{r.name} Rank</h3>
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
