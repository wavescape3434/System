import { CLASS_ROLES } from "./class-roles";
import AdventureGame from "./AdventureGame";
import SkillTree from "./SkillTree";
import ProfessionPicker from "./ProfessionPicker";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  LockKeyhole,
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
  level,
  totalXP,
  rankXP,
  characterRank,
  startingRankCredit,
  subclassRequirements,
  selectSubclass,
  professionLevel,
  professionXP,
  professionStat,
  classLevel,
  classXP,
  classRank,
  available,
  objectives,
  isComplete,
  activity,
  switchClass,
  hasSkill,
} from "./domain";
import { Icon, Progress, StatRadar, Tag, Empty, STAT_NAMES } from "./ui";
export type Page =
  "guild" | "objectives" | "paths" | "skills" | "adventures" | "journal";
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
    p = currentPath(c),
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
        <section className="guild-card">
          <div className="card-topline">
            <span>ADVENTURERS’ GUILD</span>
            <span>
              PERSONAL GUILD CARD <span className="diamond">✦</span>
            </span>
          </div>
          <div className="identity">
            <div className="avatar-seal">
              <Icon name={p.icon} size={39} />
              <span>LV. {level(xp)}</span>
            </div>
            <div>
              <span className="hero-kicker">REGISTERED ADVENTURER</span>
              <h2>{c.name}</h2>
              <p>{c.title}</p>
              <div className="hero-tags">
                <span>
                  <Icon name={p.icon} size={13} />
                  {p.name} · Lv. {classLevel(c, p.id)}
                </span>
                <span>{c.profession}</span>
                {c.subclass && (
                  <span>
                    {p.subclasses.find((x) => x.id === c.subclass)?.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="hero-progress">
            <span>
              ADVENTURER LEVEL {level(xp)} <b>{xp % 250} / 250 XP</b>
            </span>
            <Progress value={xp % 250} max={250} label="Adventurer level" />
          </div>
          <div className="card-bottomline">
            <span>✦ &nbsp; BODY · MIND · HEART</span>
            <span>
              MEMBER SINCE{" "}
              {new Date(c.createdAt)
                .toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })
                .toUpperCase()}
            </span>
          </div>
        </section>
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
          <p>
            {nextRank
              ? "Complete real-world objectives to increase your rank."
              : "Highest adventurer rank reached."}
          </p>
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
              <span className="status-dot" /> Progress saved after completion.
            </span>
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
          <p className="panel-caption">
            Attributes increase through objective XP.
          </p>
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
export function Objectives({ c, openObjective }: ScreenProps) {
  const [tab, setTab] = useState<Cadence>("daily");
  const [filter, setFilter] = useState("all");
  const list = objectives(c).filter(
      (o) =>
        o.cadence === tab &&
        (filter === "all" ||
          (filter === "networking" && o.category === "Networking") ||
          (filter === "analysis" && o.category === "Data Analysis") ||
          o.scope === filter),
    ),
    done = list.filter((o) => isComplete(c, o)).length;
  return (
    <>
      <div className="intro-banner">
        <Icon name="compass" size={30} />
        <div>
          <h3>Objective schedule</h3>
          <p>
            Tasks award XP to their progression path. Weekly and monthly goals
            may also list a base stat reward.
          </p>
        </div>
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
            <span>{objectives(c).filter((o) => o.cadence === t).length}</span>
          </button>
        ))}
      </div>
      <label className="objective-filter">
        Category
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All objectives</option>
          <option value="class">Current class</option>
          <option value="subclass">Current subclass</option>
          <option value="profession">Profession & technical practice</option>
          <option value="universal">Universal</option>
          <option value="networking">Networking</option>
          <option value="analysis">Data Analysis</option>
        </select>
      </label>
      <div className="section-heading page-section-heading">
        <h3>
          {tab === "daily"
            ? "Daily tasks"
            : tab === "weekly"
              ? "Weekly quests"
              : "Monthly adventures"}
        </h3>
        <Tag>
          {done} / {list.length} completed
        </Tag>
      </div>
      <div className="objectives-grid">
        {list.map((o) => (
          <button
            key={o.id}
            className={`panel objective-card ${isComplete(c, o) ? "completed" : ""}`}
            onClick={() => openObjective(o)}
          >
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
                Special reward: +{o.statReward.amount} base {o.statReward.stat}
              </Tag>
            )}
            <div className="objective-card-bottom">
              <span>
                <Clock3 size={14} />
                {o.minutes}
              </span>
              <b>
                {isComplete(c, o) ? (
                  <Check size={18} />
                ) : (
                  <>
                    +{o.xp} XP <ArrowRight size={16} />
                  </>
                )}
              </b>
            </div>
          </button>
        ))}
      </div>
      <p className="helper center">
        Daily tasks refresh at local midnight, weekly quests on Monday, and
        monthly adventures on the first. Completed rewards stay with you.
      </p>
    </>
  );
}
export function Paths({ c, update, notify }: ScreenProps) {
  const s = stats(c),
    p = currentPath(c),
    [view, setView] = useState("all");
  const subLevel = classLevel(c, p.id);
  const select = (id: string) => {
    if (!update(switchClass(c, id))) return;
    notify(
      `${CLASSES.find((p) => p.id === id)!.name} selected. Previous progress is preserved.`,
    );
  };
  return (
    <>
      <div className="intro-banner">
        <Icon name={p.icon} size={30} />
        <div>
          <span className="eyebrow">YOUR CURRENT PATH</span>
          <h3>
            {p.name}{" "}
            <span className="inline-level">
              Lv. {subLevel} · {classRank(subLevel)}
            </span>
          </h3>
          <p>
            {p.motto} Your earned class levels always remain on your record.
          </p>
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
          className={view === "sub" ? "active" : ""}
          onClick={() => setView("sub")}
        >
          Subclasses
        </button>
        <button
          className={view === "history" ? "active" : ""}
          onClick={() => setView("history")}
        >
          Your class record
        </button>
      </div>
      {view === "all" && (
        <div className="path-grid">
          {CLASSES.map((path) => {
            const unlocked = available(path, s, totalXP(c), c),
              active = path.id === p.id;
            return (
              <article
                key={path.id}
                className={`panel path-card ${active ? "selected" : ""} ${!unlocked ? "locked" : ""}`}
              >
                <div className={`path-icon ${path.color}`}>
                  <Icon name={path.icon} size={29} />
                </div>
                <div className="path-title">
                  <h3>{path.name}</h3>
                  {active ? (
                    <Tag>Current path</Tag>
                  ) : !unlocked ? (
                    <LockKeyhole size={16} />
                  ) : (
                    <Tag tone="neutral">Available</Tag>
                  )}
                </div>
                <Tag tone="neutral">{CLASS_ROLES[path.id]?.role}</Tag>
                <p>{CLASS_ROLES[path.id]?.description || path.description}</p>
                <small className="class-stance">
                  Combat stance: {CLASS_ROLES[path.id]?.stance}
                </small>
                <div className="requirements">
                  <span>
                    CORE ATTRIBUTE <b>{path.stat}</b>
                  </span>
                  <small>
                    {Object.entries(path.requirements)
                      .map(([a, n]) => `${a} ${n}+`)
                      .join(" · ") || "Open to everyone"}
                    {path.minXP ? ` · ${path.minXP} total XP` : ""}
                    {path.classRequirements?.map((r) => (
                      <span key={r.id} className="required-class">
                        {CLASSES.find((p) => p.id === r.id)?.name} level{" "}
                        {r.level} required · current {classLevel(c, r.id)}
                      </span>
                    ))}
                  </small>
                </div>
                <button
                  className={`button full ${active ? "secondary" : "primary"}`}
                  disabled={!unlocked || active}
                  onClick={() => select(path.id)}
                >
                  {active
                    ? `Level ${classLevel(c, path.id)} ${path.name}`
                    : unlocked
                      ? "Select class"
                      : "Requirements not met"}
                  {!active && unlocked && <ArrowRight size={15} />}
                </button>
              </article>
            );
          })}
        </div>
      )}
      {view === "sub" && (
        <>
          <div className="section-heading page-section-heading">
            <h3>
              Select a specialization for your {p.name.toLowerCase()} class.
            </h3>
            <Tag tone="gold">Requirements vary by subclass</Tag>
          </div>
          <div className="path-grid">
            {p.subclasses.map((sub) => (
              <article
                key={sub.id}
                className={`panel path-card ${c.subclass === sub.id ? "selected" : ""}`}
              >
                <div className="path-icon gold">
                  <Icon name={sub.stat} size={28} />
                </div>
                <h3>{sub.name}</h3>
                <p>{sub.description}</p>
                <small className="class-stance">
                  Adds specialization objectives and its own skill tree. No
                  automatic stat or combat bonus.
                </small>
                <div className="requirements">
                  <span>
                    OBJECTIVE FOCUS <b>{sub.stat}</b>
                  </span>
                  <small>
                    {p.name} Lv. {sub.minClassLevel || 3} ·{" "}
                    {Object.entries(sub.requirements || {})
                      .map(([a, n]) => `${a} ${n}+`)
                      .join(" · ")}
                  </small>
                </div>
                <button
                  className="button primary full"
                  disabled={
                    subclassRequirements(c, sub).length > 0 ||
                    c.subclass === sub.id
                  }
                  onClick={() => {
                    if (!update(selectSubclass(c, sub.id))) return;
                    notify(
                      `${sub.name} selected. Your objectives now include its focus.`,
                    );
                  }}
                >
                  {c.subclass === sub.id
                    ? "Current subclass"
                    : subclassRequirements(c, sub).length > 0
                      ? "Requirements not met"
                      : "Choose subclass"}
                </button>
              </article>
            ))}
          </div>
          {c.subclass && (
            <button
              className="text-button"
              onClick={() => update({ ...c, subclass: null })}
            >
              Return to your core class without a subclass
            </button>
          )}
        </>
      )}
      {view === "history" && (
        <section className="panel record-panel">
          <div className="section-heading">
            <h3>Class history</h3>
            <Icon name="book" />
          </div>
          {CLASSES.filter(
            (x) => classXP(c, x.id) > 0 || x.id === c.activeClass,
          ).map((x) => (
            <div className="class-record" key={x.id}>
              <span className={`path-icon ${x.color}`}>
                <Icon name={x.icon} />
              </span>
              <div>
                <h4>
                  {x.name} {x.id === c.activeClass && <Tag>Current</Tag>}
                </h4>
                <small>
                  Level {classLevel(c, x.id)} · {classRank(classLevel(c, x.id))}{" "}
                  · {classXP(c, x.id)} XP earned
                </small>
                <Progress
                  value={classXP(c, x.id) % 100}
                  label={`${x.name} next level`}
                />
              </div>
            </div>
          ))}
          <p className="helper">
            Class level increases every 100 XP earned while that class is
            active. Novice → Apprentice (3) → Adept (5) → Expert (10) → Master
            (20).
          </p>
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
            <div className="stat-description">
              <span className="eyebrow">ATTRIBUTE PROGRESSION</span>
              <h2>Base attributes</h2>
              <p>
                Class and profession level-ups grant +1 to their focus
                attribute. Selected weekly and monthly goals award the listed
                stat point. Skill purchases and combat equipment never change
                these numbers.
              </p>
              <div className="notice">
                These are personal game scores, not clinical measurements or a
                comparison with anyone else.
              </div>
            </div>
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
                  <small>
                    From class/profession levels and explicit goal rewards
                  </small>
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
            <p>
              Your profession shapes your work objectives. It can change as
              often as your ambitions do.
            </p>
            <ProfessionPicker
              value={c.profession}
              onChange={(profession) => update({ ...c, profession })}
            />
            <div className="notice">
              Profession objectives award profession XP and skill shards. Each
              level adds +1 to this profession’s focus attribute. Previous
              profession levels and purchased skills are retained.
            </div>
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
              <Empty icon="shield" title="No credentials recorded">
                Record a certification when you earn it. Qualifying credentials
                unlock permanent skills. Removing a ledger entry keeps an earned
                skill.
              </Empty>
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
              <p>
                Promotion costs double at each rank. Rank XP = objective XP +
                starting-rank credit ({startingRankCredit(c)}). Starting credit
                does not grant levels, class XP, or skill points.
              </p>
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
                      : "On the horizon"}
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
export function Journal({ c, update, notify }: ScreenProps) {
  const [text, setText] = useState(""),
    [tab, setTab] = useState("reflections");
  return (
    <>
      <div className="intro-banner">
        <Icon name="book" size={28} />
        <div>
          <h3>Reflections</h3>
          <p>
            What did you learn? Where did you see God at work? What is one small
            step for tomorrow?
          </p>
        </div>
      </div>
      <div className="tabs">
        <button
          className={tab === "reflections" ? "active" : ""}
          onClick={() => setTab("reflections")}
        >
          Reflections
        </button>
        <button
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          Adventure chronicle
        </button>
      </div>
      {tab === "reflections" ? (
        <div className="journal-layout">
          <section className="panel journal-compose">
            <span className="eyebrow">NEW ENTRY</span>
            <h3>New reflection</h3>
            <label className="field">
              <span className="sr-only">Your reflection</span>
              <textarea
                maxLength={4000}
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Today, I’m grateful for…"
              />
            </label>
            <div className="section-heading">
              <small>{text.length} / 4,000</small>
              <button
                className="button primary"
                disabled={!text.trim()}
                onClick={() => {
                  if (
                    !update({
                      ...c,
                      journal: [
                        {
                          id: crypto.randomUUID(),
                          at: new Date().toISOString(),
                          text: text.trim(),
                        },
                        ...c.journal,
                      ],
                    })
                  )
                    return;
                  setText("");
                  notify("A moment worth remembering. Reflection saved.");
                }}
              >
                Save reflection <Plus size={16} />
              </button>
            </div>
          </section>
          <div>
            {c.journal.length ? (
              c.journal.map((j) => (
                <article className="panel journal-entry" key={j.id}>
                  <span className="eyebrow">
                    {new Date(j.at).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <p>{j.text}</p>
                </article>
              ))
            ) : (
              <section className="panel">
                <Empty title="No saved reflections">
                  Your saved reflections will appear here. A few honest words
                  are enough.
                </Empty>
              </section>
            )}
          </div>
        </div>
      ) : (
        <section className="panel">
          {c.completions.length ? (
            [...c.completions].reverse().map((entry, i) => (
              <div
                className="chronicle-row"
                key={`${entry.id}-${entry.period}-${i}`}
              >
                <span className={`objective-icon ${entry.stat.toLowerCase()}`}>
                  <Check size={18} />
                </span>
                <div>
                  <b>{entry.title}</b>
                  <small>
                    {new Date(entry.at).toLocaleString()} ·{" "}
                    {CLASSES.find((p) => p.id === entry.classId)?.name}
                  </small>
                </div>
                <Tag>+{entry.xp} XP</Tag>
              </div>
            ))
          ) : (
            <Empty icon="compass" title="No completed objectives">
              Complete your first objective to begin your chronicle.
            </Empty>
          )}
        </section>
      )}
    </>
  );
}
