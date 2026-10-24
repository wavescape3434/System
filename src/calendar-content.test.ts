import { describe, it, expect } from "vitest";
import { simulationCharacter } from "./balance-simulation";
import type { Character } from "./domain";
import {
  objectives,
  takeRequest,
  takenObjectives,
  completeTaken,
  isComplete,
  objectivePeriod,
  totalXP,
  suggestedObjectives,
  releaseRequest,
  upgradeCalendar,
  stats,
} from "./domain";
import { groupRequests } from "./objective-catalog";
import { requestProgress } from "./training-tasks";
import { campaign } from "./rpg";
import { takeWorldContract, completeWorldContract } from "./world";
import { validateCharacter } from "./storage";
import { periodStart, periodEnd } from "./calendar-goals";
const date = (day: number, month = 1) =>
  new Date(Date.UTC(2027, month, day, 18));
const find = (c: Character, id: string) =>
  objectives(c).find((o) => o.id === id)!;
function claim(c: Character, id: string, at: Date) {
  c = takeRequest(c, id, at);
  const o = takenObjectives(c, at).find((o) => o.id === id);
  if (!o) return c;
  if (o.checklist)
    c = {
      ...c,
      milestones: {
        ...c.milestones,
        [`${id}:${objectivePeriod(o, at)}`]: o.checklist.map((_, i) => i),
      },
    };
  return completeTaken(c, o, at);
}
function walks(c: Character, days: number[], month = 1) {
  for (const day of days) c = claim(c, "u-walk-5", date(day, month));
  return c;
}
describe("calendar requests and rank groups", () => {
  it("groups comparable difficulties while retaining unique rank-specific achievements", () => {
    const c = simulationCharacter("Catalog"),
      all = objectives(c),
      groups = groupRequests(all);
    const push = groups.find((g) => g.title === "Pushup practice")!;
    expect(push.variants.map((o) => o.rank)).toEqual(["F", "E", "D", "C"]);
    expect(
      groups.filter((g) => g.variants.some((o) => o.id === "u-marathon"))[0]
        .variants,
    ).toHaveLength(1);
    expect(
      all.filter((o) => o.id.startsWith("practice-")).length,
    ).toBeGreaterThanOrEqual(64);
    expect(
      all
        .filter((o) => o.cadence === "monthly")
        .every((o) => o.calendarBound && !o.persistent),
    ).toBe(true);
    expect(groups.length).toBeLessThan(all.length);
  });
  it("allows one chosen rank per group and one reward for its calendar period", () => {
    let c = simulationCharacter("Choose");
    c = takeRequest(c, "u-wall-push", date(1));
    expect(takeRequest(c, "u-floor-push-20", date(1))).toBe(c);
    c = claim(c, "u-wall-push", date(1));
    expect(isComplete(c, find(c, "u-floor-push-20"), date(1))).toBe(true);
    expect(takeRequest(c, "u-floor-push-20", date(1))).toBe(c);
    expect(totalXP(c)).toBe(10);
  });
  it("lets an uncompleted rank be released and replaced without losing prior calendar evidence", () => {
    let c = walks(simulationCharacter("Rechoose"), [1, 2, 3, 4, 5]);
    c = takeRequest(c, "habit-walk-weekly-f", date(6));
    c = releaseRequest(c, "habit-walk-weekly-f");
    c = takeRequest(c, "habit-walk-weekly-e", date(6));
    expect(
      requestProgress(c, find(c, "habit-walk-weekly-e"), date(6)).sessions,
    ).toBe(5);
    expect(validateCharacter(c)).toBe(true);
  });
  it("counts walking earlier this week before acceptance and excludes previous weeks", () => {
    let c = walks(simulationCharacter("Week"), [27, 28], 0);
    c = walks(c, [1, 2, 3]);
    c = takeRequest(c, "habit-walk-weekly-f", date(6));
    expect(
      requestProgress(c, find(c, "habit-walk-weekly-f"), date(6)),
    ).toMatchObject({ days: 5, sessions: 3 });
    const before = totalXP(c);
    c = claim(c, "habit-walk-weekly-f", date(6));
    expect(totalXP(c) - before).toBe(40);
    expect(
      takenObjectives(c, date(8)).some((o) => o.id === "habit-walk-weekly-f"),
    ).toBe(false);
  });
  it("counts earlier activity in the month, expires acceptance and preserves history at the boundary", () => {
    let c = walks(simulationCharacter("Month"), [1, 3, 5, 7, 9, 11, 13, 15]);
    c = takeRequest(c, "habit-walk-monthly-f", date(21));
    expect(
      requestProgress(c, find(c, "habit-walk-monthly-f"), date(21)).sessions,
    ).toBe(8);
    const before = totalXP(c);
    c = claim(c, "habit-walk-monthly-f", date(21));
    expect(totalXP(c) - before).toBe(180);
    const old = totalXP(c);
    expect(
      takenObjectives(c, date(1, 2)).some(
        (o) => o.id === "habit-walk-monthly-f",
      ),
    ).toBe(false);
    expect(
      suggestedObjectives(c, date(1, 2)).some(
        (o) => o.id === "habit-walk-monthly-f",
      ),
    ).toBe(true);
    c = takeRequest(c, "habit-walk-monthly-f", date(1, 2));
    expect(
      requestProgress(c, find(c, "habit-walk-monthly-f"), date(1, 2)).sessions,
    ).toBe(0);
    expect(totalXP(c)).toBe(old);
    expect(validateCharacter(c)).toBe(true);
  });
  it("does not carry an unfinished checklist into the next month", () => {
    let c = takeRequest(
      simulationCharacter("Checklist"),
      "warrior-monthly",
      date(1),
    );
    c.milestones["warrior-monthly:2027-02"] = [0, 1];
    expect(
      takenObjectives(c, date(1, 2)).some((o) => o.id === "warrior-monthly"),
    ).toBe(false);
    c = takeRequest(c, "warrior-monthly", date(1, 2));
    expect(c.milestones["warrior-monthly:2027-03"]).toBeUndefined();
    expect(c.milestones["warrior-monthly:2027-02"]).toEqual([0, 1]);
  });
  it("migrates older saved adventure starts and checklists without awarding or deleting XP", () => {
    let c = simulationCharacter("Migration");
    delete c.calendarVersion;
    c = walks(c, [1, 2]);
    c = takeRequest(c, "habit-walk-monthly-f", date(3));
    const r = c.takenRequests!.find((r) => r.id === "habit-walk-monthly-f")!;
    c.milestones[`${r.id}:${r.takenPeriod}`] = [0];
    const before = totalXP(c),
      attributes = stats(c);
    c = upgradeCalendar(c);
    expect(c.calendarVersion).toBe(1);
    expect(c.milestones[`${r.id}:2027-02`]).toEqual([0]);
    expect(totalXP(c)).toBe(before);
    expect(stats(c)).toEqual(attributes);
    expect(takenObjectives(c, date(1, 2)).some((o) => o.id === r.id)).toBe(
      false,
    );
    expect(validateCharacter(c)).toBe(true);
  });
  it("uses local Monday and month boundaries, including short February", () => {
    expect(periodStart("weekly", date(7)).getDate()).toBe(1);
    expect(periodEnd("weekly", date(7)).getDate()).toBe(8);
    expect(periodStart("monthly", date(27)).getDate()).toBe(1);
    expect(periodEnd("monthly", date(27)).getMonth()).toBe(2);
    const high = find(simulationCharacter("Expert"), "u-learning-sss");
    expect(high.minimumDays).toBeLessThan(28);
    expect(high.preparationDays).toBe(168);
    expect(high.preparationSessions).toBe(72);
  });
  it("can complete a prepared legendary outcome within February while keeping prior qualification separate", () => {
    let c = simulationCharacter("Prepared expert");
    c.createdAt = "2026-07-01T18:00:00Z";
    for (let i = 0; i < 72; i++)
      c = claim(
        c,
        "u-spaced-recall",
        new Date(Date.UTC(2026, 6, 1 + i * 3, 18)),
      );
    for (let day = 1; day <= 24; day++)
      c = claim(c, "u-spaced-recall", date(day));
    const before = totalXP(c);
    c = claim(c, "u-learning-sss", date(28));
    expect(totalXP(c) - before).toBe(180000);
    expect(c.completions.at(-1)!.period).toBe("2027-02");
    expect(validateCharacter(c)).toBe(true);
    expect(takeRequest(c, "u-learning-sss", date(1, 2))).toBe(c);
  });
  it("keeps technical content scoped to the chosen profession or vocation", () => {
    const c = {
      ...simulationCharacter("Teacher"),
      profession: "Teacher",
      vocation: null,
    };
    expect(objectives(c).some((o) => o.id.startsWith("network-lab-"))).toBe(
      false,
    );
    expect(objectives(c).some((o) => o.tags?.includes("Career"))).toBe(true);
  });
});
describe("adventure requirements and bonuses", () => {
  function prepared() {
    let c = simulationCharacter("Hybrid");
    for (const d of [1, 2, 3]) c = claim(c, "u-bible-recall", date(d));
    return c;
  }
  function herbs(c: Character) {
    c.campaign = {
      ...campaign(c),
      inventory: { ...campaign(c).inventory, sunleaf: 6 },
    };
    c = takeWorldContract(c, "alderhaven-herbs", date(4));
    return completeWorldContract(c, "alderhaven-herbs", date(4));
  }
  it("holds a required hybrid reward until both real practice and the linked guild request are complete", () => {
    let c = prepared();
    c = takeRequest(c, "hybrid-chapel", date(6));
    const o = find(c, "hybrid-chapel");
    c.milestones[`${o.id}:${objectivePeriod(o, date(6))}`] = [0, 1];
    const before = totalXP(c);
    expect(completeTaken(c, o, date(6))).toBe(c);
    c = herbs(c);
    c = completeTaken(c, o, date(6));
    expect(totalXP(c) - before).toBe(600);
    expect(validateCharacter(c)).toBe(true);
  });
  it("pays an optional bonus only when the linked commission is recorded in this period", () => {
    const fixture = () => {
      let c = walks(simulationCharacter("Bonus"), [1, 2, 3]);
      c = takeRequest(c, "hybrid-trail", date(6));
      const o = find(c, "hybrid-trail");
      c.milestones[`${o.id}:${objectivePeriod(o, date(6))}`] = [0, 1];
      return { c, o };
    };
    let { c, o } = fixture();
    let next = completeTaken(c, o, date(6));
    expect(totalXP(next) - totalXP(c)).toBe(600);
    ({ c, o } = fixture());
    c.campaign = {
      ...campaign(c),
      world: {
        ...campaign(c).world!,
        receipts: [
          {
            id: "receipt",
            contractId: "alderhaven-hunt",
            at: date(4).toISOString(),
            gold: 120,
          },
        ],
      },
    };
    next = completeTaken(c, o, date(6));
    expect(totalXP(next) - totalXP(c)).toBe(750);
    expect(next.completions.at(-1)!.bonusXP).toBe(150);
    expect(completeTaken(next, o, date(6))).toBe(next);
    expect(validateCharacter(next)).toBe(true);
  });
  it("leaves ordinary Bible and walking requests usable without adventure progress", () => {
    const c = simulationCharacter("Ordinary");
    expect(find(c, "u-bible-short").adventureRequirement).toBeUndefined();
    expect(find(c, "u-walk-5").adventureRequirement).toBeUndefined();
    expect(totalXP(claim(c, "u-bible-short", date(1)))).toBe(10);
  });
});
