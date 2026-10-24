import { useState, useEffect, useMemo } from "react";
import { Search, Star, Clock3, Check, Plus } from "lucide-react";
import type { Character, Objective, Cadence } from "./domain";
import {
  objectives,
  takenObjectives,
  suggestedObjectives,
  isTaken,
  isComplete,
  takeRequest,
  taskRequirements,
  ATTRIBUTES,
  currentPath,
} from "./domain";
import { groupRequests } from "./objective-catalog";
import { allowedRanks } from "./request-balance";
import { TASK_NAMES } from "./task-ranks";
import { requestProgress } from "./training-tasks";
import { periodStart, periodEnd } from "./calendar-goals";
import { Tag, Icon } from "./ui";
export default function RequestBoard({
  c,
  openObjective,
  update,
  notify,
}: {
  c: Character;
  openObjective: (o: Objective) => void;
  update: (c: Character) => boolean;
  notify: (s: string) => void;
}) {
  const [view, setView] = useState("board"),
    [tab, setTab] = useState<Cadence>("daily"),
    [category, setCategory] = useState("all"),
    [rank, setRank] = useState("all"),
    [query, setQuery] = useState(""),
    [focus, setFocus] = useState("all"),
    [sort, setSort] = useState("relevant");
  const [limit, setLimit] = useState(12);
  useEffect(
    () => setLimit(12),
    [view, tab, category, rank, query, focus, sort],
  );
  const taken = useMemo(() => takenObjectives(c), [c]),
    all = useMemo(
      () => objectives(c).map((o) => taken.find((t) => t.id === o.id) || o),
      [c, taken],
    ),
    suggestions = useMemo(() => suggestedObjectives(c), [c]),
    pins = c.favoriteRequests || [];
  const source =
    view === "taken"
      ? taken
      : view === "suggested"
        ? suggestions
        : view === "pinned"
          ? all.filter((o) => pins.includes(o.requestGroup || o.id))
          : all;
  const filtered = source.filter(
    (o) =>
      o.cadence === tab &&
      (category === "trials"
        ? o.kind === "class-trial"
        : o.kind !== "class-trial") &&
      (rank === "all" || o.rank === rank) &&
      (focus === "all" || o.stat === focus) &&
      (category === "all" ||
        o.scope === category ||
        (category === "vocation" && o.id.startsWith("vocation-")) ||
        (category === "hybrid" &&
          (o.adventureRequirement || o.adventureBonus)) ||
        category === "trials") &&
      (c.preferences?.showLockedRequests !== false ||
        !taskRequirements(c, o, new Date(), "accept").length ||
        isTaken(c, o)) &&
      (!query ||
        [o.groupTitle, o.title, o.description, ...(o.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  const score = (g: ReturnType<typeof groupRequests>[number]) =>
    (pins.includes(g.id) ? 100 : 0) +
    (g.variants.some((o) => o.scope === "class")
      ? 50
      : g.variants.some((o) => o.stat === currentPath(c).stat)
        ? 30
        : g.variants.some((o) => o.scope === "universal")
          ? 20
          : 10);
  const groups = groupRequests(filtered).sort((a, b) =>
    sort === "relevant"
      ? score(b) - score(a) || a.title.localeCompare(b.title)
      : sort === "pinned"
        ? Number(pins.includes(b.id)) - Number(pins.includes(a.id)) ||
          a.title.localeCompare(b.title)
        : sort === "reward"
          ? Math.max(...b.variants.map((o) => o.xp)) -
            Math.max(...a.variants.map((o) => o.xp))
          : a.title.localeCompare(b.title),
  );
  const pin = (id: string) =>
    update({
      ...c,
      favoriteRequests: pins.includes(id)
        ? pins.filter((p) => p !== id)
        : [...pins, id],
    });
  const end = new Date(periodEnd(tab).getTime() - 1),
    fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <>
      <div className="request-view-tabs">
        {[
          ["board", "Guild board"],
          ["taken", `Taken (${taken.filter((o) => !isComplete(c, o)).length})`],
          ["pinned", `Pinned (${pins.length})`],
          ["suggested", `Suggested (${groupRequests(suggestions).length})`],
        ].map(([id, title]) => (
          <button
            key={id}
            className={view === id ? "active" : ""}
            onClick={() => setView(id)}
          >
            {title}
          </button>
        ))}
      </div>
      <div className="tabs">
        {(["daily", "weekly", "monthly"] as Cadence[]).map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => {
              setTab(t);
              setRank("all");
            }}
          >
            {t === "daily"
              ? "Daily tasks"
              : t === "weekly"
                ? "Weekly quests"
                : "Monthly adventures"}{" "}
            <span>
              {groupRequests(source.filter((o) => o.cadence === t)).length}
            </span>
          </button>
        ))}
      </div>
      <div className="request-tools">
        <label className="request-search">
          <Search size={18} />
          <input
            aria-label="Search requests"
            type="search"
            placeholder="Search requests"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="objective-filter">
          Category
          <select
            aria-label="Objective category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {[
              ["all", "All objectives"],
              ["universal", "Universal"],
              ["class", "Class"],
              ["vocation", "Vocation"],
              ["profession", "Profession & technical practice"],
              ["hybrid", "Hybrid"],
              ["trials", "Class trials"],
            ].map(([id, t]) => (
              <option key={id} value={id}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="objective-filter">
          Rank
          <select
            aria-label="Request rank"
            value={rank}
            onChange={(e) => setRank(e.target.value)}
          >
            <option value="all">
              F–{allowedRanks(tab).at(-1)} · All ranks
            </option>
            {allowedRanks(tab).map((r) => (
              <option key={r} value={r}>
                {r} · {TASK_NAMES[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="objective-filter">
          Focus
          <select
            aria-label="Request focus"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
          >
            <option value="all">All stats</option>
            {ATTRIBUTES.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="objective-filter">
          Sort
          <select
            aria-label="Sort requests"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="relevant">Current focus</option>
            <option value="name">Name</option>
            <option value="pinned">Pinned first</option>
            <option value="reward">Highest reward</option>
          </select>
        </label>
      </div>
      <div className="section-heading page-section-heading">
        <h3>
          {view === "taken"
            ? "Taken requests"
            : view === "pinned"
              ? "Pinned requests"
              : view === "suggested"
                ? "Suggested requests"
                : tab === "daily"
                  ? "Daily tasks"
                  : tab === "weekly"
                    ? "Weekly quests"
                    : "Monthly adventures"}
        </h3>
        <Tag>
          {groups.length} requests · {fmt(periodStart(tab))}
          {tab !== "daily" ? ` – ${fmt(end)}` : ""}
        </Tag>
      </div>
      <div className="guild-request-board">
        <div className="board-inscription">
          <span>✦</span>
          {view === "taken" ? "ACCEPTED COMMISSIONS" : "THE ADVENTURERS GUILD"}
          <span>✦</span>
        </div>
        <div className="objectives-grid request-papers">
          {groups.slice(0, limit).map((g) => {
            const chosen =
                g.variants.find((o) => isTaken(c, o)) ||
                g.variants.find((o) => isComplete(c, o)) ||
                g.variants.find(
                  (o) => !taskRequirements(c, o, new Date(), "accept").length,
                ) ||
                g.variants[0],
              done = isComplete(c, chosen),
              accepted = isTaken(c, chosen),
              progress = requestProgress(c, chosen),
              multi = g.variants.length > 1;
            return (
              <article
                key={g.id}
                className={`panel objective-card guild-request-paper ${done ? "completed" : ""}`}
              >
                <button
                  className={`request-pin-toggle ${pins.includes(g.id) ? "pinned" : ""}`}
                  aria-label={`${pins.includes(g.id) ? "Unpin" : "Pin"} ${g.title}`}
                  onClick={() => pin(g.id)}
                >
                  <Star
                    size={16}
                    fill={pins.includes(g.id) ? "currentColor" : "none"}
                  />
                </button>
                <button
                  className="request-details"
                  aria-label={`View ${g.title}`}
                  onClick={() => openObjective(chosen)}
                >
                  <span className="request-pin" aria-hidden="true" />
                  <small className="request-number">
                    {tab === "daily"
                      ? "GUILD TASK"
                      : tab === "weekly"
                        ? "QUEST COMMISSION"
                        : "MONTHLY ADVENTURE"}
                  </small>
                  <div className="objective-card-top">
                    <span
                      className={`objective-icon ${chosen.stat.toLowerCase()}`}
                    >
                      <Icon name={chosen.stat} size={23} />
                    </span>
                    <Tag tone="gold">
                      {accepted || done || !multi
                        ? `${chosen.rank} rank`
                        : `${g.variants[0].rank}–${g.variants.at(-1)!.rank}`}
                    </Tag>
                    <Tag>{done ? "Completed" : chosen.category}</Tag>
                  </div>
                  <h3>{g.title}</h3>
                  {multi && !accepted && !done && (
                    <div className="rank-choice-preview">
                      {g.variants.map((o) => (
                        <span key={o.id}>{o.rank}</span>
                      ))}
                    </div>
                  )}
                  {(chosen.adventureRequirement || chosen.adventureBonus) && (
                    <Tag tone="gold">
                      {chosen.adventureRequirement
                        ? "Adventure required"
                        : "Adventure bonus"}
                    </Tag>
                  )}
                  {chosen.participants === "group" && <Tag>Group quest</Tag>}
                  <p>{chosen.description}</p>
                  {accepted &&
                    (chosen.minimumDays || chosen.minimumSessions) && (
                      <div className="request-mix">
                        <Tag>
                          {Math.min(
                            progress.sessions,
                            chosen.minimumSessions || 0,
                          )}{" "}
                          / {chosen.minimumSessions || 0} practice days
                        </Tag>
                        {chosen.calendarBound && (
                          <Tag>
                            {tab === "weekly" ? "This week" : "This month"}
                          </Tag>
                        )}
                      </div>
                    )}
                  {chosen.statReward && (
                    <Tag tone="gold">
                      +{chosen.statReward.amount} base {chosen.statReward.stat}
                    </Tag>
                  )}
                </button>
                <div className="objective-card-bottom">
                  <span>
                    <Clock3 size={13} />
                    {accepted || !multi
                      ? chosen.minutes
                      : `${g.variants.length} rank options`}
                  </span>
                  <span className="request-rewards">
                    <b>
                      {multi && !accepted && !done
                        ? `${g.variants[0].xp}–${g.variants.at(-1)!.xp}`
                        : `+${chosen.xp}`}{" "}
                      XP
                    </b>
                    <b>
                      {multi && !accepted && !done
                        ? `${g.variants[0].gold}–${g.variants.at(-1)!.gold}`
                        : `+${chosen.gold}`}{" "}
                      gold
                    </b>
                  </span>
                </div>
                <div className="request-actions">
                  {done ? (
                    <button onClick={() => openObjective(chosen)}>
                      <Check size={15} />
                      Completed
                    </button>
                  ) : accepted ? (
                    <button
                      className="taken-request-action"
                      onClick={() => openObjective(chosen)}
                    >
                      <Check size={15} />
                      Taken · Open
                    </button>
                  ) : multi ? (
                    <button
                      aria-label={`Choose rank for ${g.title}`}
                      onClick={() => openObjective(chosen)}
                    >
                      Choose rank
                    </button>
                  ) : (
                    <button
                      aria-label={`Take ${g.title}`}
                      disabled={
                        !!taskRequirements(c, chosen, new Date(), "accept")
                          .length
                      }
                      title={taskRequirements(
                        c,
                        chosen,
                        new Date(),
                        "accept",
                      ).join(" · ")}
                      onClick={() => {
                        if (update(takeRequest(c, chosen.id)))
                          notify("Request taken.");
                      }}
                    >
                      <Plus size={15} />
                      Take request
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {!groups.length && (
          <div className="empty-request-board">
            <h3>
              {view === "taken" ? "No taken requests" : "No matching requests"}
            </h3>
          </div>
        )}
      </div>
      {groups.length > limit && (
        <button
          className="button secondary request-load-more"
          onClick={() => setLimit((n) => n + 12)}
        >
          Show {Math.min(12, groups.length - limit)} more
        </button>
      )}
    </>
  );
}
