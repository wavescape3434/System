import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  LockKeyhole,
  Plus,
  Sparkles,
  Map,
  Trophy,
  Mountain,
  Flag,
  Award,
} from "lucide-react";
import type { Character, Objective, Cadence, Stats, Attribute } from "./domain";
import {
  CLASSES,
  ATTRIBUTES,
  PROFESSIONS,
  SKILLS,
  RANKS,
  stats,
  currentPath,
  level,
  totalXP,
  rank,
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
        <small>{done ? "Well done" : `+${o.stat}`}</small>
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
    nextRank = RANKS.find((r) => r.xp > xp);
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
              <span className="hero-kicker">
                YOUR STORY IS STILL BEING WRITTEN
              </span>
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
            <strong>{rank(xp).name}</strong>
            <span>
              {xp === 0 ? "THE FIRST CHAPTER" : "THE JOURNEY CONTINUES"}
            </span>
          </div>
          <p>
            {nextRank
              ? "Every completed objective is a step forward."
              : "A remarkable journey, one day at a time."}
          </p>
          <div className="small-progress-label">
            <span>
              {nextRank ? `Toward ${nextRank.name} rank` : "Highest guild rank"}
            </span>
            <b>
              {xp.toLocaleString()} / {(nextRank?.xp || 50000).toLocaleString()}{" "}
              XP
            </b>
          </div>
          <Progress value={xp} max={nextRank?.xp || 50000} />
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
              <span className="eyebrow">SMALL STEPS, REAL GROWTH</span>
              <h3>Your daily focus</h3>
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
              <span className="status-dot" /> A little progress is still
              progress.
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
            Grown through the things you actually do.
          </p>
        </section>
      </div>
      <section className="panel legacy-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">NOTHING YOU EARN IS LEFT BEHIND</span>
            <h3>Your lasting legacy</h3>
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
            <span className="eyebrow">SHOW UP FOR YOURSELF</span>
            <h3>A week of becoming</h3>
            <p>
              {week.filter((x) => x.count > 0).length} active days in the last
              seven. A fresh start is always welcome.
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
  const list = objectives(c).filter((o) => o.cadence === tab),
    done = list.filter((o) => isComplete(c, o)).length;
  return (
    <>
      <div className="intro-banner">
        <Icon name="compass" size={30} />
        <div>
          <h3>A purpose for every season.</h3>
          <p>
            Daily tasks build habits. Weekly quests build momentum. Monthly
            adventures make room for something bigger.
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
      <div className="section-heading page-section-heading">
        <h3>
          {tab === "daily"
            ? "Today’s small victories"
            : tab === "weekly"
              ? "Make this week count"
              : "A chapter worth remembering"}
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
      `Your ${CLASSES.find((p) => p.id === id)!.name} chapter begins. All previous progress is preserved.`,
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
            const unlocked = available(path, s, totalXP(c)),
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
                <p>{path.description}</p>
                <div className="requirements">
                  <span>
                    CORE ATTRIBUTE <b>{path.stat}</b>
                  </span>
                  <small>
                    {Object.entries(path.requirements)
                      .map(([a, n]) => `${a} ${n}+`)
                      .join(" · ") || "Open to everyone"}
                    {path.minXP ? ` · ${path.minXP} total XP` : ""}
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
                      ? "Walk this path"
                      : "Keep growing to unlock"}
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
            <h3>Give your {p.name.toLowerCase()} path a new dimension.</h3>
            <Tag tone="gold">Unlock at class level 2</Tag>
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
                <div className="requirements">
                  <span>
                    SECONDARY FOCUS <b>{sub.stat}</b>
                  </span>
                  <small>
                    {p.name} Lv. 2 · {sub.stat} 5+
                  </small>
                </div>
                <button
                  className="button primary full"
                  disabled={
                    subLevel < 2 || s[sub.stat] < 5 || c.subclass === sub.id
                  }
                  onClick={() => {
                    if (!update({ ...c, subclass: sub.id })) return;
                    notify(
                      `${sub.name} selected. Your objectives now include its focus.`,
                    );
                  }}
                >
                  {c.subclass === sub.id
                    ? "Current subclass"
                    : subLevel < 2 || s[sub.stat] < 5
                      ? "Keep growing to unlock"
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
            <h3>Every chapter stays with you.</h3>
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
              <span className="eyebrow">YOUR CHARACTER, IN BALANCE</span>
              <StatRadar values={s} />
              <Attributes s={s} />
            </section>
            <div className="stat-description">
              <span className="eyebrow">EARNED IN THE REAL WORLD</span>
              <h2>
                More than
                <br />a set of numbers.
              </h2>
              <p>
                Your baseline is a starting point. Every 100 XP earned for an
                attribute adds one point. Small actions compound over time.
              </p>
              <div className="notice">
                These are personal game scores, not clinical measurements or a
                comparison with anyone else.
              </div>
            </div>
          </div>
          <div className="stat-detail-grid">
            {ATTRIBUTES.map((a) => {
              const xp = c.completions
                .filter((x) => x.stat === a)
                .reduce((sum, x) => sum + x.xp, 0);
              return (
                <section className="panel stat-detail" key={a}>
                  <div>
                    <span className={`objective-icon ${a.toLowerCase()}`}>
                      <Icon name={a} />
                    </span>
                    <span>
                      <h3>{STAT_NAMES[a]}</h3>
                      <small>
                        {a} · Baseline {c.baseStats[a]} + {Math.floor(xp / 100)}{" "}
                        earned
                      </small>
                    </span>
                    <b>{s[a]}</b>
                  </div>
                  <Progress value={xp % 100} />
                  <small>{xp % 100} / 100 XP toward next point</small>
                </section>
              );
            })}
          </div>
        </>
      )}
      {tab === "skills" && (
        <>
          <div className="section-heading page-section-heading">
            <div>
              <span className="eyebrow">EARNED, NEVER ASSIGNED</span>
              <h3>Your growing repertoire</h3>
            </div>
            <button className="button secondary" onClick={onCertificate}>
              <Plus size={16} />
              Record credential
            </button>
          </div>
          <section className="network-tree panel">
            <div>
              <Tag tone="blue">NETWORKING SKILL PATH</Tag>
              <h3>From curiosity to connection.</h3>
              <p>Real practice. Recognized credentials. Permanent skills.</p>
            </div>
            <div className="tree-nodes">
              {SKILLS.slice(0, 3).map((skill, i) => (
                <div
                  className={hasSkill(c, skill) ? "earned" : ""}
                  key={skill.id}
                >
                  <span className="tree-node">
                    {hasSkill(c, skill) ? (
                      <Check size={23} />
                    ) : i === 0 ? (
                      <Icon name="INT" size={23} />
                    ) : (
                      <LockKeyhole size={21} />
                    )}
                  </span>
                  <small>{skill.tier}</small>
                  <b>{skill.name}</b>
                </div>
              ))}
            </div>
          </section>
          <div className="skill-grid">
            {SKILLS.map((skill) => {
              const earned = hasSkill(c, skill);
              return (
                <section
                  className={`panel skill-card ${earned ? "earned" : ""}`}
                  key={skill.id}
                >
                  <div className="section-heading">
                    <span
                      className={`objective-icon ${skill.stat.toLowerCase()}`}
                    >
                      <Icon name={skill.stat} />
                    </span>
                    <Tag tone={earned ? "green" : "neutral"}>
                      {earned ? "Earned" : skill.tier}
                    </Tag>
                  </div>
                  <h3>{skill.name}</h3>
                  <p>{skill.description}</p>
                  <Progress
                    value={hasSkill(c, skill) ? skill.target : skill.current(c)}
                    max={skill.target}
                  />
                  <small>{skill.proof}</small>
                  {earned &&
                    skill.id.includes("network-") &&
                    skill.id !== "network-initiate" && (
                      <span className="helper">
                        Credential is self-reported
                      </span>
                    )}
                </section>
              );
            })}
          </div>
        </>
      )}
      {tab === "profession" && (
        <div className="profession-layout">
          <section className="panel">
            <span className="eyebrow">YOUR CHOSEN CRAFT</span>
            <h2>{c.profession}</h2>
            <p>
              Your profession shapes your work objectives. It can change as
              often as your ambitions do.
            </p>
            <label className="field">
              Choose a profession
              <select
                value={c.profession}
                onChange={(e) => update({ ...c, profession: e.target.value })}
              >
                {PROFESSIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <div className="notice">
              Skills are earned through practice and milestones independently of
              your profession.
            </div>
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
              <Empty icon="shield" title="Real milestones belong here.">
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
              <h3>From F to SSS. At your own pace.</h3>
              <p>
                Adventurer rank reflects lifetime objective XP. A change of
                class never resets it.
              </p>
            </div>
          </div>
          <div className="ranks-grid">
            {RANKS.map((r) => (
              <section
                className={`panel rank-tile ${rank(totalXP(c)).name === r.name ? "selected" : ""}`}
                key={r.name}
              >
                <div className="rank-mini">{r.name}</div>
                <h3>{r.name} Rank</h3>
                <p>{r.xp.toLocaleString()} lifetime XP</p>
                <Tag tone={totalXP(c) >= r.xp ? "green" : "neutral"}>
                  {rank(totalXP(c)).name === r.name
                    ? "Your current rank"
                    : totalXP(c) >= r.xp
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
const ENCOUNTERS: {
  title: string;
  text: string;
  choices: {
    label: string;
    stat: Attribute;
    target: number;
    success: string;
    fallback: string;
  }[];
}[] = [
  {
    title: "The bridge at Mossfall",
    text: "Mist rises from the ravine. An old bridge has fallen, but the guildhall is waiting on the other side. How will you cross?",
    choices: [
      {
        label: "Move the fallen timber",
        stat: "STR",
        target: 8,
        success:
          "Your training pays off. You steady a heavy beam and build a crossing.",
        fallback:
          "The beam is heavier than expected. You make progress, then find a safer route with a traveler.",
      },
      {
        label: "Find a careful way around",
        stat: "DEX",
        target: 7,
        success: "Your steady footing carries you across the stones below.",
        fallback:
          "You take your time, testing each step. The longer trail gets you there safely.",
      },
    ],
  },
  {
    title: "The forgotten waystone",
    text: "Beyond the bridge, an inscription marks three paths. A tired traveler asks for your help.",
    choices: [
      {
        label: "Decipher the inscription",
        stat: "INT",
        target: 8,
        success:
          "You recognize the pattern and uncover the route to the guild.",
        fallback:
          "You sketch the inscription and work it through together. Patience reveals the way.",
      },
      {
        label: "Listen to the traveler",
        stat: "WIS",
        target: 7,
        success:
          "You listen carefully. A detail in their story reveals the right path.",
        fallback:
          "You share a quiet moment and agree to retrace the safest trail together.",
      },
    ],
  },
  {
    title: "A light at the guildhall",
    text: "At the gate, a small group gathers around a discouraged apprentice. Your journey has given you something to offer.",
    choices: [
      {
        label: "Offer words of encouragement",
        stat: "CHA",
        target: 7,
        success:
          "Your words restore their courage. The guild welcomes a new friend.",
        fallback:
          "You offer a simple, sincere greeting. Sometimes presence is enough.",
      },
      {
        label: "Lend a steady hand",
        stat: "CON",
        target: 7,
        success:
          "You help finish the evening work. Together, you carry the last supplies inside.",
        fallback:
          "You help at your own pace. Every contribution finds a place.",
      },
    ],
  },
];
export function Adventures({ c, update }: ScreenProps) {
  const [scene, setScene] = useState(-1),
    [result, setResult] = useState<string | null>(null),
    [finished, setFinished] = useState(false),
    s = stats(c),
    earned = c.relics.includes("mossfall-lantern");
  const resolve = (choice: (typeof ENCOUNTERS)[0]["choices"][number]) =>
    setResult(
      s[choice.stat] >= choice.target ? choice.success : choice.fallback,
    );
  return (
    <>
      <div className="adventure-hero">
        <div>
          <Tag tone="gold">THE STORY REALM</Tag>
          <h2>
            Bring your real-world
            <br />
            growth into the story.
          </h2>
          <p>
            The attributes you build in life shape the choices you make here.
          </p>
        </div>
        <div className="adventure-map">
          <Map size={95} strokeWidth={0.8} />
          <span className="map-pin pin-one">
            <Mountain size={20} />
          </span>
          <span className="map-pin pin-two">
            <Flag size={20} />
          </span>
          <span className="map-pin pin-three">
            <Icon name="shield" size={20} />
          </span>
        </div>
      </div>
      {scene === -1 ? (
        <div className="adventure-grid">
          <section className="panel adventure-story-card">
            <span className="eyebrow">CHAPTER I · A SHORT SOLO ADVENTURE</span>
            <h3>The road to Mossfall</h3>
            <p>
              A broken bridge. A forgotten waystone. A light at the guildhall.
              An ordinary traveler can make an extraordinary difference.
            </p>
            <div className="adventure-info">
              <span>
                <Clock3 size={15} /> 3 encounters
              </span>
              <span>
                <Icon name="compass" size={16} /> All ranks welcome
              </span>
            </div>
            <div className="relic-preview">
              <span>✧</span>
              <div>
                <small>STORY REWARD</small>
                <b>The Mossfall Lantern</b>
              </div>
              {earned && <Tag>Collected</Tag>}
            </div>
            <button
              className="button primary"
              onClick={() => {
                setScene(0);
                setResult(null);
                setFinished(false);
              }}
            >
              Enter with {c.name} <ArrowRight size={16} />
            </button>
          </section>
          <section className="panel">
            <span className="eyebrow">YOUR ADVENTURING SELF</span>
            <h3>
              {c.name} · Level {level(totalXP(c))}
            </h3>
            <Attributes s={s} />
            <p>
              Your current attributes resolve each challenge. Lower scores
              reveal a different route; they never end your story.
            </p>
            <div className="notice">
              Story adventures award keepsakes. Real-world XP and attribute
              points come from your real-world objectives.
            </div>
          </section>
        </div>
      ) : (
        <section className="panel encounter-panel">
          <div className="section-heading">
            <Tag tone="gold">
              {finished ? "CHAPTER COMPLETE" : `ENCOUNTER ${scene + 1} OF 3`}
            </Tag>
            <button className="text-button" onClick={() => setScene(-1)}>
              Leave adventure
            </button>
          </div>
          {finished ? (
            <>
              <div className="story-ornament">✧</div>
              <h2>A light to carry forward.</h2>
              <p>
                The guildhall doors open. Your journey wasn’t about being the
                strongest person on the road. It was about choosing to keep
                going, and bringing others with you.
              </p>
              <div className="relic-preview">
                <span>✧</span>
                <div>
                  <small>KEEPSAKE COLLECTED</small>
                  <b>The Mossfall Lantern</b>
                </div>
              </div>
              <button className="button primary" onClick={() => setScene(-1)}>
                Return to the trail <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="story-ornament">
                {scene === 0 ? "⌁" : scene === 1 ? "✧" : "♜"}
              </div>
              <h2>{ENCOUNTERS[scene].title}</h2>
              <p>{ENCOUNTERS[scene].text}</p>
              {result ? (
                <div className="encounter-result">
                  <p>{result}</p>
                  <button
                    className="button primary"
                    onClick={() => {
                      if (scene < 2) {
                        setScene(scene + 1);
                        setResult(null);
                      } else {
                        setFinished(true);
                        if (!earned)
                          update({
                            ...c,
                            relics: [...c.relics, "mossfall-lantern"],
                          });
                      }
                    }}
                  >
                    {scene < 2 ? "Continue the journey" : "Enter the guildhall"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="encounter-choices">
                  {ENCOUNTERS[scene].choices.map((choice) => (
                    <button key={choice.stat} onClick={() => resolve(choice)}>
                      <Icon name={choice.stat} />
                      <span>
                        {choice.label}
                        <small>
                          {choice.stat} {s[choice.stat]} · Challenge{" "}
                          {choice.target}
                        </small>
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}
      {c.relics.length > 0 && (
        <section className="panel keepsakes">
          <div className="section-heading">
            <h3>Your keepsakes</h3>
            <Sparkles size={19} />
          </div>
          <div className="relic-preview">
            <span>✧</span>
            <div>
              <b>The Mossfall Lantern</b>
              <small>A reminder that every small light matters.</small>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
export function Journal({ c, update, notify }: ScreenProps) {
  const [text, setText] = useState(""),
    [tab, setTab] = useState("reflections");
  return (
    <>
      <div className="intro-banner">
        <Icon name="book" size={28} />
        <div>
          <h3>Remember the becoming.</h3>
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
            <span className="eyebrow">A MOMENT FOR YOURSELF</span>
            <h3>A page in your story</h3>
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
                <Empty title="Your story has room to grow.">
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
            <Empty icon="compass" title="The first page is waiting.">
              Complete your first objective to begin your chronicle.
            </Empty>
          )}
        </section>
      )}
    </>
  );
}
