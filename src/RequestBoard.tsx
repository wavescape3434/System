import { useViewState } from "./useViewState";
import { careerCategory } from "./careers";
import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Star,
  Plus,
  Globe,
  Blend,
  BriefcaseBusiness,
  Compass,
  Shield,
  Users,
  SlidersHorizontal,
} from "lucide-react";
import type { Character, Objective, Cadence } from "./domain";
import {
  objectives,
  takenObjectives,
  suggestedObjectives,
  isTaken,
  isComplete,
  taskRequirements,
  ATTRIBUTES,
  currentPath,
  activeVocation,
} from "./domain";
import { groupRequests } from "./objective-catalog";
import { allowedRanks } from "./request-balance";
import { TASK_RANKS, TASK_NAMES } from "./task-ranks";
import { periodStart, periodEnd } from "./calendar-goals";
import { Tag } from "./ui";
export default function RequestBoard({
  c,
  openObjective,
  update,
  section,
}: {
  c: Character;
  openObjective: (o: Objective) => void;
  update: (c: Character) => boolean;
  notify: (s: string) => void;
  section?: string;
}) {
  const key = `${c.id}.requests`;
  const [view, setView] = useViewState<string>(
      `${key}.view`,
      section?.split(":")[0] || "board",
      !!section,
      ["board", "taken", "pinned", "suggested"],
    ),
    [tab, setTab] = useViewState<Cadence | "all">(
      `${key}.cadence`,
      (section?.split(":")[1] as Cadence | "all") ||
        (section?.startsWith("taken") ? "all" : "daily"),
      !!section,
      ["all", "daily", "weekly", "monthly"],
    ),
    [category, setCategory] = useViewState<string>(
      `${key}.category`,
      "all",
      !!section,
    ),
    [rank, setRank] = useViewState<string>(`${key}.rank`, "all", !!section),
    [query, setQuery] = useViewState<string>(`${key}.query`, "", !!section),
    [focus, setFocus] = useViewState<string>(`${key}.focus`, "all", !!section),
    [sort, setSort] = useViewState<string>(
      `${key}.sort`,
      "relevant",
      !!section,
    ),
    [filtersOpen, setFiltersOpen] = useState(false);
  const cadence = view === "taken" ? tab : tab === "all" ? "daily" : tab;
  const ranks = cadence === "all" ? TASK_RANKS : allowedRanks(cadence);
  const filterCount =
    [category, rank, focus].filter((v) => v !== "all").length +
    Number(sort !== "relevant");
  const resetFilters = () => {
    setCategory("all");
    setRank("all");
    setFocus("all");
    setQuery("");
    setSort("relevant");
  };
  const [limit, setLimit] = useState(30);
  useEffect(
    () => setLimit(30),
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
  const scopeOf = (o: Objective) =>
    o.scope === "profession" &&
    (o.id.startsWith("vocation-") ||
      (o.careerCategory === activeVocation(c)?.category &&
        o.careerCategory !== careerCategory(c.profession).id))
      ? "vocation"
      : o.scope || "class";
  const filtered = source.filter(
    (o) =>
      (cadence === "all" || o.cadence === cadence) &&
      (view === "taken" && category === "all"
        ? true
        : category === "trials"
          ? o.kind === "class-trial"
          : o.kind !== "class-trial") &&
      (rank === "all" || o.rank === rank) &&
      (focus === "all" || o.stat === focus) &&
      (category === "all" ||
        scopeOf(o) === category ||
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
  const periodCadence = cadence === "all" ? "daily" : cadence;
  const end = new Date(periodEnd(periodCadence).getTime() - 1),
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
            onClick={() => {
              setView(id);
              if (id === "taken") {
                setTab("all");
                resetFilters();
              }
            }}
          >
            {title}
          </button>
        ))}
      </div>
      <div className="tabs request-cadence-tabs">
        {view === "taken" && (
          <button
            className={tab === "all" ? "active" : ""}
            onClick={() => setTab("all")}
          >
            All taken <span>{taken.length}</span>
          </button>
        )}
        {(["daily", "weekly", "monthly"] as Cadence[]).map((t) => (
          <button
            key={t}
            className={cadence === t ? "active" : ""}
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
      <div className="request-discovery">
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
        <button
          className="button secondary request-filter-toggle"
          aria-expanded={filtersOpen}
          aria-controls="request-filters"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal size={17} /> Filters
          {filterCount ? ` (${filterCount})` : ""}
        </button>
      </div>
      <div
        id="request-filters"
        className={`request-tools request-filter-fields ${filtersOpen ? "open" : ""}`}
      >
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
              ["profession", "Profession"],
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
            <option value="all">F–{ranks.at(-1)} · All ranks</option>
            {ranks.map((r) => (
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
      {(filterCount > 0 || query) && (
        <button className="text-button request-clear" onClick={resetFilters}>
          Clear filters
        </button>
      )}
      <div className="section-heading page-section-heading">
        <h3>
          {view === "taken"
            ? "Taken requests"
            : view === "pinned"
              ? "Pinned requests"
              : view === "suggested"
                ? "Suggested requests"
                : cadence === "daily"
                  ? "Daily tasks"
                  : cadence === "weekly"
                    ? "Weekly quests"
                    : "Monthly adventures"}
        </h3>
        <Tag>
          {groups.length} requests
          {cadence === "all"
            ? " · All taken"
            : ` · ${fmt(periodStart(cadence))}${cadence !== "daily" ? ` – ${fmt(end)}` : ""}`}
        </Tag>
      </div>
      <div className="guild-request-board">
        <div className="board-inscription">
          <span>✦</span>
          {view === "taken" ? "ACCEPTED COMMISSIONS" : "THE ADVENTURERS GUILD"}
          <span>✦</span>
        </div>
        <div className="objectives-grid request-papers compact-papers">
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
              multi = g.variants.length > 1;
            const scope = scopeOf(chosen),
              Scope =
                scope === "universal"
                  ? Users
                  : scope === "profession"
                    ? BriefcaseBusiness
                    : scope === "vocation"
                      ? Compass
                      : Shield,
              hybrid = !!(chosen.adventureRequirement || chosen.adventureBonus),
              Realm = hybrid ? Blend : Globe;
            return (
              <article
                key={g.id}
                className={`panel objective-card guild-request-paper compact-request ${done ? "completed" : ""} ${accepted ? "accepted" : ""}`}
              >
                <span
                  role="img"
                  className="request-scope-icon"
                  title={scope}
                  aria-label={`${scope} request`}
                >
                  <Scope size={18} />
                </span>
                <span
                  role="img"
                  className="request-realm-icon"
                  title={hybrid ? "Real world + adventure" : "Real world"}
                  aria-label={
                    hybrid ? "Real world and adventure" : "Real world"
                  }
                >
                  <Realm size={17} />
                </span>
                <button
                  className="request-compact-name"
                  aria-label={`View ${g.title}`}
                  onClick={() => openObjective(chosen)}
                >
                  {g.title}
                </button>
                <span
                  className="compact-rank"
                  title={accepted ? "Taken" : done ? "Completed" : "Available"}
                >
                  {accepted || done || !multi
                    ? chosen.rank
                    : `${g.variants[0].rank}–${g.variants.at(-1)!.rank}`}
                </span>
                <span className="request-state">
                  {done ? "Completed" : accepted ? "Taken" : ""}
                </span>
                <button
                  className="compact-details"
                  aria-label={`Show details for ${g.title}`}
                  onClick={() => openObjective(chosen)}
                >
                  <Plus size={18} />
                </button>
                <button
                  className={`request-pin-toggle ${pins.includes(g.id) ? "pinned" : ""}`}
                  aria-label={`${pins.includes(g.id) ? "Unpin" : "Pin"} ${g.title}`}
                  aria-pressed={pins.includes(g.id)}
                  onClick={() => pin(g.id)}
                >
                  <Star
                    size={13}
                    fill={pins.includes(g.id) ? "currentColor" : "none"}
                  />
                </button>
              </article>
            );
          })}
        </div>
        {!groups.length && (
          <div className="empty-request-board">
            <h3>
              {view === "taken"
                ? cadence === "all"
                  ? "No taken requests"
                  : `No ${cadence} requests`
                : "No matching requests"}
            </h3>
            {view === "taken" && cadence !== "all" && taken.length > 0 && (
              <button
                className="button secondary"
                onClick={() => {
                  setTab("all");
                  resetFilters();
                }}
              >
                Show all taken requests
              </button>
            )}
          </div>
        )}
      </div>
      {groups.length > limit && (
        <button
          className="button secondary request-load-more"
          onClick={() => setLimit((n) => n + 30)}
        >
          Show {Math.min(30, groups.length - limit)} more
        </button>
      )}
    </>
  );
}
