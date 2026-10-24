// Regression coverage for retained version 1.3 characters and their accepted rewards.
import { describe, it, expect } from "vitest";
import {
  legacyDemoCharacter as demoCharacter,
  complete,
  objectives,
  takeRequest,
  switchClass,
  awardSkills,
  period,
  totalXP,
} from "./domain";
import {
  journeyItems,
  journeyReport,
  activityCalendar,
  dateKey,
} from "./journey";
import { recordJourney } from "./journey-events";
import { startBattle, campaign, claimVictory } from "./rpg";
import { validateCharacter } from "./storage";
const day = (d: number) => new Date(2026, 9, d, 12),
  now = day(26);
const sample = () => ({ ...demoCharacter(), createdAt: day(1).toISOString() });
describe("automatic journey", () => {
  it("records choices and completed work without changing progression or duplicating unchanged updates", () => {
    const before = sample();
    const taken = recordJourney(
      before,
      takeRequest(before, "warrior-daily", now),
      now,
    );
    const next = recordJourney(
      taken,
      awardSkills(complete(taken, objectives(taken)[0], now)),
      now,
    );
    expect(totalXP(next)).toBe(30);
    expect(
      next.journeyEvents?.filter((e) => e.kind === "request"),
    ).toHaveLength(1);
    expect(
      journeyItems(next).filter((e) => e.kind === "completion"),
    ).toHaveLength(1);
    expect(recordJourney(next, next, now)).toBe(next);
    expect(validateCharacter(next)).toBe(true);
  });
  it("logs real stat and level milestones only after they occur", () => {
    const before = sample(),
      o = objectives(before).find((o) => o.id === "warrior-monthly")!;
    before.milestones[`${o.id}:${period("monthly", now)}`] = [0, 1, 2];
    const next = recordJourney(before, complete(before, o, now), now);
    expect(
      next.journeyEvents?.some(
        (e) => e.kind === "stat" && e.subject === "STR" && e.amount === 1,
      ),
    ).toBe(true);
    expect(
      next.journeyEvents?.some(
        (e) => e.kind === "level" && e.subject === "class:warrior",
      ),
    ).toBe(true);
    expect(journeyReport(next, "7", now).statGains).toBe(1);
  });
  it("keeps archived notes and earlier completion dates without inventing past milestone dates", () => {
    let c = sample();
    c = complete(c, objectives(c)[0], day(2));
    c.journal = [
      { id: "old-note", at: day(3).toISOString(), text: "Psalm 23 notes" },
    ];
    const items = journeyItems(c);
    expect(items.find((e) => e.kind === "note")?.detail).toBe("Psalm 23 notes");
    expect(items.find((e) => e.kind === "completion")?.at).toBe(
      day(2).toISOString(),
    );
    expect(items.some((e) => e.kind === "level")).toBe(false);
    expect(items.map((e) => new Date(e.at).getTime())).toEqual(
      items.map((e) => new Date(e.at).getTime()).sort((a, b) => b - a),
    );
  });
  it("records class changes and skill unlocks but never invents events for another restored character", () => {
    const before = sample(),
      next = recordJourney(
        before,
        {
          ...switchClass(before, "bard"),
          earnedSkills: ["network-intermediate"],
        },
        now,
      );
    expect(
      next.journeyEvents?.some(
        (e) => e.kind === "class" && e.title === "Bard selected",
      ),
    ).toBe(true);
    expect(next.journeyEvents?.some((e) => e.kind === "skill")).toBe(true);
    const other = sample();
    expect(recordJourney(before, other, now)).toBe(other);
  });
  it("records an expedition reward once without awarding training XP", () => {
    const before = startBattle(sample(), "mossfall-1");
    before.campaign = {
      ...campaign(before),
      battle: { ...campaign(before).battle!, phase: "won" },
    };
    const next = recordJourney(before, claimVictory(before), now);
    expect(
      next.journeyEvents?.filter((e) => e.kind === "adventure"),
    ).toHaveLength(1);
    expect(totalXP(next)).toBe(0);
    expect(recordJourney(next, claimVictory(next), now)).toBe(next);
  });
});
it("shows date-only credentials before noon and retains earlier credentials in All time", () => {
  const c = sample();
  c.certificates = [
    {
      id: "ccna",
      name: "CCNA",
      issuer: "Cisco",
      date: "2026-10-26",
      reference: "",
    },
    {
      id: "older",
      name: "Network+",
      issuer: "CompTIA",
      date: "2024-01-01",
      reference: "",
    },
  ];
  const cert = journeyItems(c).find((e) => e.id === "credential-ccna")!;
  expect(cert.dateOnly).toBe(true);
  expect(new Date(cert.at).getTime()).toBeLessThanOrEqual(
    new Date(2026, 9, 26, 1).getTime(),
  );
  expect(journeyReport(c, "all", now).start.getFullYear()).toBe(2024);
});
describe("journey reports", () => {
  it("uses the chosen timeframe and previous equal period, filling days without activity with zeros", () => {
    let c = sample();
    for (const d of [15, 20, 20, 22, 26]) {
      const id =
        d === 20 &&
        c.completions.some((o) => dateKey(new Date(o.at)) === dateKey(day(20)))
          ? "reading-daily"
          : "warrior-daily";
      const o = objectives(c).find((o) => o.id === id)!;
      c = complete(c, o, day(d));
    }
    const report = journeyReport(c, "7", now);
    expect(report.count).toBe(4);
    expect(report.xp).toBe(110);
    expect(report.previousXP).toBe(30);
    expect(report.delta).toBe(80);
    expect(report.activeDays).toBe(3);
    expect(report.series).toHaveLength(7);
    expect(report.series.find((p) => p.key === "2026-10-21")?.count).toBe(0);
    expect(report.series.at(-1)?.cumulative).toBe(140);
    expect(report.paths.reduce((n, p) => n + p.xp, 0)).toBe(report.xp);
  });
  it("includes a partial final week and month in long-range series", () => {
    let c = sample();
    c.createdAt = new Date(2025, 0, 1).toISOString();
    c = complete(c, objectives(c)[0], now);
    const weekly = journeyReport(c, "90", now),
      monthly = journeyReport(c, "all", now);
    expect(weekly.series.reduce((n, p) => n + p.xp, 0)).toBe(30);
    expect(weekly.series.at(-1)?.count).toBe(1);
    expect(monthly.series.reduce((n, p) => n + p.xp, 0)).toBe(30);
    expect(monthly.series.at(-1)?.key).toBe("2026-10");
  });
  it("uses twelve Monday-aligned weeks and counts multiple actions on one day", () => {
    let c = sample();
    c = complete(c, objectives(c)[0], now);
    c = complete(
      c,
      objectives(c).find((o) => o.id === "reading-daily")!,
      now,
    );
    const calendar = activityCalendar(c, now);
    expect(calendar.length).toBeLessThanOrEqual(84);
    expect(calendar[0].weekday).toBe(1);
    expect(calendar.at(-1)?.count).toBe(2);
    expect(calendar.at(-1)?.key).toBe("2026-10-26");
  });
  it("accepts old backups and rejects malformed event records", () => {
    const c = sample();
    expect(validateCharacter(c)).toBe(true);
    expect(
      validateCharacter({
        ...c,
        journeyEvents: [
          {
            id: "event",
            at: now.toISOString(),
            kind: "rank",
            title: "Promoted to E rank",
          },
        ],
      }),
    ).toBe(true);
    expect(
      validateCharacter({
        ...c,
        journeyEvents: [{ id: "event", at: "bad", kind: "rank", title: "x" }],
      }),
    ).toBe(false);
    expect(
      validateCharacter({
        ...c,
        journeyEvents: [
          { id: "event", at: now.toISOString(), kind: "invented", title: "x" },
        ],
      }),
    ).toBe(false);
  });
});
