import { describe, expect, it } from "vitest";
import {
  objectives,
  takeRequest,
  takenObjectives,
  completeTaken,
  totalXP,
  objectivePeriod,
  isComplete,
  upgradeBalance,
  characterRank,
  RANKS,
} from "./domain";
import type { Character } from "./domain";
import { taskRequirements, requestProgress } from "./training-tasks";
import { allowedRanks, requestReward } from "./request-balance";
import { validateCharacter } from "./storage";
import {
  SIMULATION_START,
  simulationCharacter as currentSimulationCharacter,
  simulateAccount,
  simulateEarlyClaims,
} from "./balance-simulation";
const simulationCharacter = (name: string) => {
  const c = currentSimulationCharacter(name);
  delete c.calendarVersion;
  return c;
};
const at = (day: number) =>
  new Date(SIMULATION_START.getTime() + day * 86400000);
const current = (c: Character, id: string) =>
  objectives(c).find((o) => o.id === id)!;
const take = (c: Character, id: string, day = 0) => takeRequest(c, id, at(day));
function finish(c: Character, id: string, day: number) {
  const o = takenObjectives(c, at(day)).find((o) => o.id === id)!;
  if (o.checklist)
    c = {
      ...c,
      milestones: {
        ...c.milestones,
        [`${id}:${objectivePeriod(o, at(day))}`]: o.checklist.map((_, i) => i),
      },
    };
  return completeTaken(c, o, at(day));
}
function practice(c: Character, id: string, days: number[]) {
  for (const d of days) c = finish(take(c, id, d), id, d);
  return c;
}
describe("request cadence and rewards", () => {
  it("enforces rank ceilings, longer monthly spans, and rewards for every generated request", () => {
    const c = simulationCharacter("Catalog");
    for (const o of objectives(c)) {
      expect(allowedRanks(o.cadence)).toContain(o.rank);
      expect(o.xp).toBe(requestReward(o.rank!, o.cadence).xp);
      expect(o.gold).toBe(requestReward(o.rank!, o.cadence).gold);
      if (o.cadence === "monthly") {
        expect(o.minimumDays).toBeGreaterThanOrEqual(28);
        expect(o.minimumSessions).toBeGreaterThanOrEqual(8);
      }
    }
    expect(
      objectives(c).some((o) => o.cadence === "weekly" && o.rank === "F"),
    ).toBe(true);
    expect(
      objectives(c).some((o) => o.cadence === "monthly" && o.rank === "F"),
    ).toBe(true);
    expect(current(c, "u-pullup-20").cadence).toBe("monthly");
    expect(current(c, "u-pullup-12").cadence).toBe("weekly");
  });
  it("pays longer commitments more at the same rank, with bounded daily prices", () => {
    expect(requestReward("C", "daily")).toEqual({ xp: 150, gold: 30 });
    expect(requestReward("C", "weekly")).toEqual({ xp: 600, gold: 120 });
    expect(requestReward("C", "monthly")).toEqual({ xp: 2700, gold: 540 });
  });
  it("keeps a monthly adventure, original checklist, and dated practice across a month boundary", () => {
    let c = take(simulationCharacter("Carry"), "habit-walk-monthly-f");
    const o = takenObjectives(c, at(0))[0],
      key = `${o.id}:${objectivePeriod(o, at(0))}`;
    c.milestones[key] = [0];
    c = practice(c, "u-walk-5", [0, 3, 6, 9, 12, 15, 18, 21]);
    const carried = takenObjectives(c, at(28)).find((x) => x.id === o.id)!;
    expect(objectivePeriod(carried, at(28))).toBe(objectivePeriod(o, at(0)));
    expect(c.milestones[key]).toEqual([0]);
    expect(requestProgress(c, carried, at(28))).toMatchObject({
      days: 28,
      sessions: 8,
    });
    expect(completeTaken(c, carried, at(28))).toBe(c);
    c = finish(c, o.id, 28);
    expect(totalXP(c)).toBe(80 + 180);
    expect(isComplete(c, carried, at(29))).toBe(true);
    expect(validateCharacter(JSON.parse(JSON.stringify(c)))).toBe(true);
  });
  it("requires explicit repeat acceptance and new preparation, with no carried checklist reward", () => {
    let c = take(simulationCharacter("Repeat"), "habit-walk-monthly-f");
    c = practice(c, "u-walk-5", [0, 3, 6, 9, 12, 15, 18, 21]);
    c = finish(c, "habit-walk-monthly-f", 28);
    const old = current(c, "habit-walk-monthly-f"),
      xp = totalXP(c);
    expect(completeTaken(c, old, at(28))).toBe(c);
    c = take(c, old.id, 28);
    const fresh = current(c, old.id);
    expect(fresh.instanceId).not.toBe(old.instanceId);
    expect(
      c.milestones[`${fresh.id}:${objectivePeriod(fresh, at(28))}`],
    ).toBeUndefined();
    expect(requestProgress(c, fresh, at(28))).toMatchObject({
      days: 0,
      sessions: 0,
    });
    expect(completeTaken(c, { ...fresh, xp: 999999 }, at(28))).toBe(c);
    expect(totalXP(c)).toBe(xp);
  });
  it("prevents accepting concurrent variants of the same monthly habit", () => {
    const c = take(simulationCharacter("One route"), "habit-walk-monthly-f");
    expect(take(c, "habit-walk-monthly-d")).toBe(c);
  });
  it("pays one weekly habit variant per training group and allows a fresh choice next week", () => {
    let c = take(simulationCharacter("Weekly variants"), "habit-walk-weekly-f");
    expect(take(c, "habit-walk-weekly-e")).toBe(c);
    c = practice(c, "u-walk-5", [0, 1, 2]);
    c = finish(c, "habit-walk-weekly-f", 2);
    expect(take(c, "habit-walk-weekly-e", 3)).toBe(c);
    expect(take(c, "habit-walk-weekly-e", 7)).not.toBe(c);
  });
  it("counts relevant practice on distinct dates, not unrelated work or a checked box", () => {
    let c = take(simulationCharacter("Relevant"), "habit-walk-monthly-f");
    c = practice(c, "u-mobility-5", [0, 1, 2, 3, 4, 5, 6, 7]);
    expect(
      requestProgress(c, current(c, "habit-walk-monthly-f"), at(28)).sessions,
    ).toBe(0);
    expect(
      taskRequirements(c, current(c, "habit-walk-monthly-f"), at(28)),
    ).toContain("Dated practice days: 0/8");
  });
  it("saves large completed S and SSS adventure rewards and keeps legendary commitments one-time", () => {
    for (const [id, days, count, xp, gold] of [
      ["u-learning-capstone", 56, 24, 32400, 6480],
      ["u-learning-sss", 168, 72, 180000, 36000],
    ] as const) {
      let c = take(simulationCharacter("Long reward"), id);
      c = practice(
        c,
        "u-spaced-recall",
        Array.from({ length: count }, (_, i) => i * 2),
      );
      c = finish(c, id, days);
      expect(c.completions.at(-1)).toMatchObject({ id, xp, gold });
      expect(validateCharacter(JSON.parse(JSON.stringify(c)))).toBe(true);
      if (id.endsWith("sss")) expect(take(c, id, days + 1)).toBe(c);
    }
  });
  it("blocks unaccepted and day-one adventure claims even with every box checked and forged reward fields", () => {
    const c = simulationCharacter("No shortcut"),
      o = current(c, "habit-walk-monthly-f");
    expect(completeTaken(c, o, at(0))).toBe(c);
    expect(simulateEarlyClaims()).toMatchObject({ xp: 0, gold: 0, rank: "F" });
  });
});
describe("rank migration and time scale", () => {
  it("uses exponential promotion prices while keeping guild and player XP separate on migration", () => {
    let c = simulationCharacter("Existing");
    delete c.balanceVersion;
    c.completions = [
      {
        id: "retained",
        period: "once",
        at: at(0).toISOString(),
        xp: 1800,
        stat: "INT",
        classId: "warrior",
        title: "Retained work",
        cadence: "monthly",
      },
    ];
    c = upgradeBalance(c);
    expect(characterRank(c).name).toBe("D");
    expect(totalXP(c)).toBe(1800);
    expect(c.rankLegacyCredit).toBeGreaterThan(0);
    expect(upgradeBalance(c)).toBe(c);
    expect(validateCharacter(c)).toBe(true);
    expect(RANKS.find((r) => r.name === "A")!.xp).toBe(161094);
  });
  it("migrates an older accepted monthly checklist without losing its original start or period", () => {
    let c = take(simulationCharacter("Old commitment"), "habit-walk-monthly-f");
    const r = c.takenRequests![0];
    delete c.balanceVersion;
    c.takenRequests = [
      {
        ...r,
        instanceId: undefined,
        persistent: undefined,
        takenPeriod: "2027-02",
      },
    ];
    c.milestones[`${r.id}:2027-02`] = [0, 1];
    c = upgradeBalance(c);
    const o = takenObjectives(c, at(28))[0];
    expect(o.instanceId).toBe("2027-02");
    expect(c.milestones[`${r.id}:2027-02`]).toEqual([0, 1]);
    expect(c.takenRequests![0].takenAt).toBe(r.takenAt);
    expect(validateCharacter(c)).toBe(true);
  });
  it("runs four fresh accounts through day 7 and day 30 with actual request and save rules", () => {
    const results = ["light", "moderate", "intensive", "intermittent"].map(
      (p) => simulateAccount(p as Parameters<typeof simulateAccount>[0], 30),
    );
    for (const r of results) {
      expect(r.day7).toBeDefined();
      expect(r.day30).toBeDefined();
      expect(r.day7.rank).not.toMatch(/^[AB]|^S/);
      expect(r.day30.rank).not.toMatch(/^A|^S/);
      expect(validateCharacter(r.character)).toBe(true);
    }
    const moderate = results[1];
    expect(moderate.projectedDaysToGold).toBeGreaterThanOrEqual(270);
    expect(moderate.projectedDaysToGold).toBeLessThanOrEqual(366);
    expect(results[2].last.xp).toBeGreaterThan(moderate.last.xp);
  }, 60000);
});
