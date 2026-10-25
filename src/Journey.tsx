import { useMemo, useState } from "react";
import { performanceHistory } from "./performance-history";
import {
  Check,
  TrendingUp,
  Flame,
  CalendarDays,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import type { Character } from "./domain";
import {
  activityCalendar,
  journeyItems,
  journeyReport,
  dateKey,
} from "./journey";
import type { JourneyRange } from "./journey";
import { Icon, Tag } from "./ui";
export default function Journey({ c }: { c: Character }) {
  const [view, setView] = useState<"timeline" | "reports">("timeline"),
    [range, setRange] = useState<JourneyRange>("30"),
    [filter, setFilter] = useState("all"),
    [order, setOrder] = useState("newest"),
    [page, setPage] = useState(0),
    [selectedDay, setSelectedDay] = useState<string | null>(null);
  const now = new Date(),
    day = dateKey(now),
    report = useMemo(() => journeyReport(c, range), [c, range, day]);
  const items = useMemo(() => journeyItems(c), [c]);
  const filtered = items.filter(
    (i) =>
      new Date(i.at) >= report.start &&
      new Date(i.at) <= now &&
      (!selectedDay || dateKey(new Date(i.at)) === selectedDay) &&
      (filter === "all" ||
        (filter === "training" && i.kind === "completion") ||
        (filter === "milestones" &&
          ["skill", "unlock", "level", "rank", "stat", "credential"].includes(
            i.kind,
          )) ||
        (filter === "adventures" &&
          ["adventure", "companion", "equipment"].includes(i.kind)) ||
        (filter === "notes" && i.kind === "note")),
  );
  if (order === "oldest") filtered.reverse();
  const pages = Math.max(1, Math.ceil(filtered.length / 25)),
    currentPage = Math.min(page, pages - 1),
    slice = filtered.slice(currentPage * 25, currentPage * 25 + 25);
  const group = new Map<string, typeof slice>();
  for (const i of slice) {
    const key = dateKey(new Date(i.at));
    group.set(key, [...(group.get(key) || []), i]);
  }
  const calendar = useMemo(() => activityCalendar(c), [c, day]);
  const performance = useMemo(
    () => performanceHistory(c, report.start),
    [c, range, day],
  );
  const max = Math.max(1, ...calendar.map((d) => d.count));
  return (
    <div className="journey-page">
      <div className="journey-controls">
        <div className="tabs">
          <button
            className={view === "timeline" ? "active" : ""}
            onClick={() => setView("timeline")}
          >
            Chronicle
          </button>
          <button
            className={view === "reports" ? "active" : ""}
            onClick={() => setView("reports")}
          >
            Reports
          </button>
        </div>
        <label className="field">
          <span className="sr-only">Journey timeframe</span>
          <select
            aria-label="Journey timeframe"
            value={range}
            onChange={(e) => {
              setRange(e.target.value as JourneyRange);
              setPage(0);
              setSelectedDay(null);
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </label>
      </div>
      <section className="journey-summary panel" aria-label="Timeframe summary">
        <div>
          <span className="eyebrow">
            {range === "all" ? "GUILD RECORD" : `LAST ${range} DAYS`}
          </span>
          <h2>
            {report.xp.toLocaleString()} <small>XP</small>
          </h2>
          {range !== "all" && (
            <span
              className={`period-change ${report.delta >= 0 ? "positive" : ""}`}
            >
              <TrendingUp size={14} />
              {report.delta >= 0 ? "+" : ""}
              {report.delta.toLocaleString()} vs previous {range} days
            </span>
          )}
        </div>
        <div className="journey-summary-grid">
          <Summary
            value={report.count}
            label="Requests"
            icon={<Check size={17} />}
          />
          <Summary
            value={report.activeDays}
            label="Active days"
            icon={<Flame size={17} />}
          />
          <Summary
            value={report.skills}
            label="Skills learned"
            icon={<Sparkles size={17} />}
          />
          <Summary
            value={report.statGains}
            label="Stat points"
            icon={<TrendingUp size={17} />}
          />
        </div>
      </section>
      {view === "timeline" ? (
        <>
          <div className="journey-timeline-filters">
            <select
              aria-label="Journey event filter"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="all">All events</option>
              <option value="training">Completed requests</option>
              <option value="milestones">Milestones</option>
              <option value="adventures">Adventures</option>
              <option value="notes">Archived notes</option>
            </select>
            <select
              aria-label="Timeline order"
              value={order}
              onChange={(e) => {
                setOrder(e.target.value);
                setPage(0);
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
          {selectedDay && (
            <div className="journey-day-selection">
              <Tag>{selectedDay}</Tag>
              <button
                className="text-button"
                onClick={() => setSelectedDay(null)}
              >
                All dates
              </button>
            </div>
          )}
          <section className="journey-timeline" aria-label="Journey chronicle">
            {!slice.length && (
              <div className="panel journey-empty">
                <CalendarDays size={28} />
                <h3>No events in this timeframe</h3>
              </div>
            )}
            {[...group].map(([key, events]) => (
              <div className="journey-day" key={key}>
                <h3>
                  <CalendarDays size={15} />
                  {new Date(key + "T12:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <div>
                  {events.map((event) => (
                    <article
                      className={`journey-event event-${event.kind}`}
                      key={event.id}
                    >
                      <span className="journey-event-icon">
                        <Icon
                          name={
                            event.kind === "completion"
                              ? "sword"
                              : event.kind === "adventure"
                                ? "compass"
                                : event.kind === "class"
                                  ? "sword"
                                  : event.kind === "stat"
                                    ? "STR"
                                    : event.kind === "note"
                                      ? "book"
                                      : "sparkles"
                          }
                          size={19}
                        />
                      </span>
                      <div>
                        <small>
                          {!event.dateOnly && (
                            <>
                              {new Date(event.at).toLocaleTimeString(
                                undefined,
                                { hour: "numeric", minute: "2-digit" },
                              )}{" "}
                              ·{" "}
                            </>
                          )}
                          {event.kind === "completion"
                            ? "Request completed"
                            : event.kind === "note"
                              ? "Archived note"
                              : event.kind[0].toUpperCase() +
                                event.kind.slice(1)}
                        </small>
                        <h4>{event.title}</h4>
                        {event.detail && (
                          <p
                            className={
                              event.kind === "note" ? "archived-note-text" : ""
                            }
                          >
                            {event.detail}
                          </p>
                        )}
                      </div>
                      {event.xp !== undefined && (
                        <Tag tone="gold">+{event.xp} XP</Tag>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
          {pages > 1 && (
            <div className="journey-pagination">
              <button
                className="button secondary"
                disabled={!currentPage}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span>
                {currentPage + 1} / {pages}
              </span>
              <button
                className="button secondary"
                disabled={currentPage === pages - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <section
            className="performance-report"
            aria-label="Real-world performance"
          >
            <div className="section-heading">
              <h2>Real-world performance</h2>
              <Tag>{performance.length} recorded tests</Tag>
            </div>
            {performance.length ? (
              <div className="journey-chart-grid">
                {performance.map((series) => (
                  <div key={series.id} className="performance-series">
                    <div className="performance-change">
                      <b>
                        {series.points[0].value} → {series.points.at(-1)!.value}{" "}
                        {series.unit}
                      </b>
                      <span>
                        {series.points.length} checks
                        {series.lower ? " · Lower is better" : ""}
                      </span>
                    </div>
                    <ProgressChart
                      title={series.title}
                      unit={series.unit}
                      points={series.points}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <section className="panel">
                <p>No performance checks in this timeframe.</p>
              </section>
            )}
          </section>
          <div className="journey-chart-grid">
            <ProgressChart
              title="Experience over time"
              unit="XP"
              points={report.series.map((p) => ({
                label: p.label,
                key: p.key,
                value: p.cumulative,
              }))}
            />
            <ProgressChart
              title="Completed requests"
              unit="requests"
              bars
              points={report.series.map((p) => ({
                label: p.label,
                key: p.key,
                value: p.count,
              }))}
            />
          </div>
          <section className="panel activity-calendar">
            <div className="section-heading">
              <h3>Activity · last 12 weeks</h3>
              <Flame size={19} />
            </div>
            <div className="calendar-scroll">
              <div className="calendar-days">
                {calendar.map((d) => (
                  <button
                    key={d.key}
                    className={`heat-${d.count ? Math.min(4, Math.ceil((d.count / max) * 4)) : 0}`}
                    title={`${d.label}: ${d.count} requests`}
                    aria-label={`${d.label}: ${d.count} completed requests`}
                    onClick={() => {
                      setRange("90");
                      setView("timeline");
                      setPage(0);
                      setFilter("training");
                      setSelectedDay(d.key);
                    }}
                  >
                    <span className="sr-only">{d.count}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="heatmap-legend">
              <span>Fewer</span>
              {[0, 1, 2, 3, 4].map((n) => (
                <i className={`heat-${n}`} key={n} />
              ))}
              <span>More</span>
            </div>
          </section>
          <div className="journey-chart-grid">
            <section className="panel path-report">
              <div className="section-heading">
                <h3>Experience by path</h3>
                <ArrowUpRight size={18} />
              </div>
              {report.paths.map((p, i) => (
                <div className="path-report-row" key={p.name}>
                  <span>{p.name}</span>
                  <b>{p.xp.toLocaleString()} XP</b>
                  <div>
                    <i
                      className={`path-fill-${i}`}
                      style={{
                        width: `${(p.xp / Math.max(1, report.xp)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {report.classes.map((p) => (
                <div className="report-class" key={p.id}>
                  <span>
                    {p.name} <small>Lv. {p.level}</small>
                  </span>
                  <b>+{p.xp.toLocaleString()} XP</b>
                </div>
              ))}
            </section>
            <section className="panel attribute-report">
              <div className="section-heading">
                <h3>Attributes</h3>
                <Tag>Registration → Current</Tag>
              </div>
              {report.attributes.map((a) => (
                <div key={a.id}>
                  <Icon name={a.id} size={17} />
                  <b>{a.id}</b>
                  <span>
                    {a.baseline} → {a.current}
                  </span>
                  <strong>+{a.earned}</strong>
                  <div>
                    <i
                      style={{
                        width: `${(a.current / Math.max(...report.attributes.map((s) => s.current))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>
          </div>
          <div className="journey-record-totals panel">
            <div>
              <b>{report.totalXP.toLocaleString()}</b>
              <small>Lifetime XP</small>
            </div>
            <div>
              <b>
                {c.earnedSkills.filter((id) => id !== "universal-root").length}
              </b>
              <small>Skills learned</small>
            </div>
            <div>
              <b>{report.adventures}</b>
              <small>Expeditions cleared · period</small>
            </div>
            <div>
              <b>{report.levels}</b>
              <small>Adventurer levels gained · period</small>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
function Summary({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      {icon}
      <b>{value.toLocaleString()}</b>
      <small>{label}</small>
    </div>
  );
}
function ProgressChart({
  title,
  unit,
  points,
  bars = false,
}: {
  title: string;
  unit: string;
  points: { key: string; label: string; value: number }[];
  bars?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const index = Math.max(
    0,
    points.findIndex((p) => p.key === selected),
  );
  const active = selected ? points[index] : points.at(-1),
    max = Math.max(1, ...points.map((p) => p.value));
  const width = 680,
    height = 210,
    left = 45,
    top = 15,
    bottom = 175;
  const x = (i: number) =>
      left + (width - left - 15) * (i / Math.max(1, points.length - 1)),
    y = (value: number) => bottom - ((bottom - top) * value) / max;
  const path = points
      .map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`)
      .join(" "),
    area = points.length
      ? `${path} L${x(points.length - 1)},${bottom} L${x(0)},${bottom} Z`
      : "";
  const id = title.replaceAll(" ", "-");
  return (
    <section className="panel progress-chart">
      <div className="section-heading">
        <h3>{title}</h3>
        <TrendingUp size={18} />
      </div>
      <div className="chart-readout">
        <b>
          {active?.value.toLocaleString() || 0} <small>{unit}</small>
        </b>
        <span>{active?.label || "No activity"}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={`${title}, ${points.length} periods`}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#6b936c" stopOpacity=".35" />
            <stop offset="1" stopColor="#6b936c" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {[0, ...(max > 1 ? [Math.round(max / 2)] : []), max].map((n) => (
          <g key={n}>
            <line
              x1={left}
              x2={width - 15}
              y1={y(n)}
              y2={y(n)}
              stroke="#d8c9a5"
              strokeDasharray="4 5"
            />
            <text x={left - 8} y={y(n) + 4} textAnchor="end">
              {Math.round(n).toLocaleString()}
            </text>
          </g>
        ))}
        {!bars ? (
          <>
            <path d={area} fill={`url(#${id})`} />
            <path d={path} fill="none" stroke="#416b4e" strokeWidth="3" />
          </>
        ) : (
          points.map((p, i) => (
            <rect
              key={p.key}
              x={x(i) - Math.min(12, 240 / points.length)}
              width={Math.min(24, 480 / points.length)}
              y={y(p.value)}
              height={bottom - y(p.value)}
              fill="#a98746"
              rx="2"
            />
          ))
        )}
        {points.map((p, i) => (
          <g
            key={p.key}
            tabIndex={0}
            role="button"
            aria-label={`${p.label}: ${p.value} ${unit}`}
            onFocus={() => setSelected(p.key)}
            onMouseEnter={() => setSelected(p.key)}
            onClick={() => setSelected(p.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelected(p.key);
              }
            }}
          >
            <circle cx={x(i)} cy={y(p.value)} r="14" fill="transparent" />
            <circle
              cx={x(i)}
              cy={y(p.value)}
              r="3"
              fill="#416b4e"
              pointerEvents="none"
            />
            {selected === p.key && (
              <>
                <line
                  x1={x(i)}
                  x2={x(i)}
                  y1={top}
                  y2={bottom}
                  stroke="#9a7c42"
                  strokeDasharray="3 4"
                />
                <circle cx={x(i)} cy={y(p.value)} r="5" fill="#9a7c42" />
              </>
            )}
          </g>
        ))}
        {points
          .filter(
            (_, i) =>
              i === 0 ||
              i === points.length - 1 ||
              i === Math.floor(points.length / 2),
          )
          .map((p) => (
            <text
              key={p.key}
              x={x(points.indexOf(p))}
              y="201"
              textAnchor={
                points.indexOf(p) === 0
                  ? "start"
                  : points.indexOf(p) === points.length - 1
                    ? "end"
                    : "middle"
              }
            >
              {p.label}
            </text>
          ))}
      </svg>
      <details className="chart-data">
        <summary>View data</summary>
        <div>
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>{unit}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.key}>
                  <td>{p.label}</td>
                  <td>{p.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
