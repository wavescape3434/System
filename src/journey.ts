import type { Character } from "./domain";
import {
  ATTRIBUTES,
  CLASSES,
  stats,
  period,
  totalXP,
  classLevel,
} from "./domain";
import type { JourneyKind } from "./journey-events";
export type JourneyRange = "7" | "30" | "90" | "all";
export interface JourneyItem {
  id: string;
  at: string;
  kind: JourneyKind | "completion" | "registration" | "note" | "credential";
  title: string;
  detail?: string;
  xp?: number;
  amount?: number;
  subject?: string;
  dateOnly?: boolean;
}
export const dateKey = (d: Date) => period("daily", d);
export function rangeStart(
  c: Character,
  range: JourneyRange,
  now = new Date(),
) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "all") {
    const dates = [
      c.createdAt,
      ...c.completions.map((o) => o.at),
      ...(c.journeyEvents || []).map((e) => e.at),
      ...c.journal.map((j) => j.at),
      ...c.certificates.map((cert) =>
        cert.date.includes("T") ? cert.date : cert.date + "T00:00:00",
      ),
    ];
    return new Date(
      dates.reduce(
        (earliest, at) => Math.min(earliest, new Date(at).getTime()),
        d.getTime(),
      ),
    );
  }
  d.setDate(d.getDate() - Number(range) + 1);
  return d;
}
export function journeyItems(c: Character): JourneyItem[] {
  return [
    {
      id: "registration",
      at: c.createdAt,
      kind: "registration" as const,
      title: "Joined the Guild",
      detail: `Starting rank ${c.startingRank || "F"}`,
    },
    ...c.completions.map((o) => ({
      id: `completion-${o.id}-${o.period}`,
      at: o.at,
      kind: "completion" as const,
      title: o.title,
      xp: o.xp,
      detail:
        o.scope === "profession"
          ? o.profession
          : o.scope === "universal"
            ? "Universal"
            : CLASSES.find((p) => p.id === o.classId)?.name,
    })),
    ...(c.journeyEvents || []),
    ...c.certificates.map((cert) => ({
      id: `credential-${cert.id}`,
      at: new Date(
        cert.date.includes("T") ? cert.date : cert.date + "T00:00:00",
      ).toISOString(),
      kind: "credential" as const,
      title: `${cert.name} earned`,
      detail: cert.issuer,
      dateOnly: true,
    })),
    ...c.journal.map((j) => ({
      id: `note-${j.id}`,
      at: j.at,
      kind: "note" as const,
      title: "Archived note",
      detail: j.text,
    })),
  ].sort(
    (a, b) =>
      new Date(b.at).getTime() - new Date(a.at).getTime() ||
      a.id.localeCompare(b.id),
  );
}
export function journeyReport(
  c: Character,
  range: JourneyRange,
  now = new Date(),
) {
  const start = rangeStart(c, range, now),
    end = now.getTime(),
    span = Number(
      range === "all"
        ? Math.max(1, Math.ceil((end - start.getTime()) / 86400000))
        : range,
    ),
    previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - span);
  const inRange = (at: string) =>
    new Date(at) >= start && new Date(at).getTime() <= end;
  const completions = c.completions.filter((o) => inRange(o.at)),
    previous = c.completions.filter(
      (o) => new Date(o.at) >= previousStart && new Date(o.at) < start,
    ),
    events = (c.journeyEvents || []).filter((e) => inRange(e.at));
  const xp = completions.reduce((n, o) => n + o.xp, 0),
    previousXP = previous.reduce((n, o) => n + o.xp, 0),
    activeDays = new Set(completions.map((o) => dateKey(new Date(o.at)))).size;
  const classes = CLASSES.map((p) => ({
    id: p.id,
    name: p.name,
    xp: completions
      .filter(
        (o) =>
          o.classId === p.id &&
          (!o.scope || o.scope === "class" || o.scope === "subclass"),
      )
      .reduce((n, o) => n + o.xp, 0),
    level: classLevel(c, p.id),
  }))
    .filter((p) => p.xp > 0)
    .sort((a, b) => b.xp - a.xp);
  const paths = [
    {
      name: "Class",
      xp: completions
        .filter(
          (o) => !o.scope || o.scope === "class" || o.scope === "subclass",
        )
        .reduce((n, o) => n + o.xp, 0),
    },
    {
      name: "Profession",
      xp: completions
        .filter((o) => o.scope === "profession")
        .reduce((n, o) => n + o.xp, 0),
    },
    {
      name: "Universal",
      xp: completions
        .filter((o) => o.scope === "universal")
        .reduce((n, o) => n + o.xp, 0),
    },
  ];
  const step = span > 370 ? "month" : span > 45 ? "week" : "day";
  const bucket = (d: Date) =>
    step === "month"
      ? period("monthly", d)
      : step === "week"
        ? period("weekly", d)
        : dateKey(d);
  const days = new Map<
    string,
    {
      key: string;
      label: string;
      xp: number;
      count: number;
      cumulative: number;
    }
  >();
  const cursor = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const before = c.completions
    .filter((o) => new Date(o.at) < cursor)
    .reduce((n, o) => n + o.xp, 0);
  while (cursor.getTime() <= end) {
    const key = bucket(cursor);
    if (!days.has(key))
      days.set(key, {
        key,
        label: cursor.toLocaleDateString(
          undefined,
          step === "month"
            ? { month: "short", year: "numeric" }
            : { month: "short", day: "numeric" },
        ),
        xp: 0,
        count: 0,
        cumulative: 0,
      });
    cursor.setDate(cursor.getDate() + 1);
  }
  // A partially covered final week/month can start inside the requested range.
  for (const o of completions) {
    const key = bucket(new Date(o.at));
    const point = days.get(key);
    if (point) {
      point.xp += o.xp;
      point.count++;
    }
  }
  let cumulative = before;
  const series = [...days.values()].map((p) => {
    cumulative += p.xp;
    return { ...p, cumulative };
  });
  const current = stats(c),
    attributes = ATTRIBUTES.map((a) => ({
      id: a,
      baseline: c.baseStats[a],
      current: current[a],
      earned: current[a] - c.baseStats[a],
    }));
  return {
    start,
    xp,
    previousXP,
    delta: xp - previousXP,
    activeDays,
    count: completions.length,
    skills: events.filter((e) => e.kind === "skill").length,
    levels: events
      .filter((e) => e.kind === "level" && e.subject === "adventurer")
      .reduce((n, e) => n + (e.amount || 0), 0),
    statGains: events
      .filter((e) => e.kind === "stat")
      .reduce((n, e) => n + (e.amount || 0), 0),
    adventures: events.filter(
      (e) => e.kind === "adventure" && (e.amount || 0) > 0,
    ).length,
    classes,
    paths,
    series,
    attributes,
    totalXP: totalXP(c),
    step,
  };
}
export function activityCalendar(c: Character, now = new Date(), weeks = 12) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    start = new Date(end);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (weeks - 1) * 7);
  const counts = new Map<string, number>();
  for (const o of c.completions) {
    const key = dateKey(new Date(o.at));
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const result = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = dateKey(cursor);
    result.push({
      key,
      count: counts.get(key) || 0,
      label: cursor.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      weekday: cursor.getDay(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}
