import { afterEach, describe, expect, it, vi } from "vitest";
import { simulationCharacter } from "./balance-simulation";
import {
  objectives,
  takeRequest,
  takenObjectives,
  stats,
  totalXP,
  isTaken,
} from "./domain";
import {
  campaign,
  startBattle,
  act,
  adventureParty,
  refreshAdventure,
  newCampaign,
} from "./rpg";
import { leaveBattle, returnToMap, continueAdventure } from "./world";
import { validateCharacter } from "./storage";
import {
  EMPTY_RESULT,
  parseResult,
  validActivityResult,
  completeWithResult,
  activityResultHistory,
  creditedGoals,
  resultSummary,
} from "./activity-results";
import { requestProgress } from "./training-tasks";
import { journeyItems } from "./journey";

afterEach(() => vi.useRealTimers());
const clock = () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2027, 2, 14, 23, 55));
};
function fighting() {
  const c = simulationCharacter("Reserves");
  c.campaign = newCampaign();
  c.activeClass = "warrior";
  return startBattle(c, "mossfall-1");
}
function wounded() {
  let c = fighting();
  c = act(c, { kind: "ability", abilityId: "signature-warrior", target: 0 });
  c = act(c, { kind: "ability", abilityId: "mira-skill", target: 0 });
  return c;
}
describe("persistent expedition reserves", () => {
  it("carries damage and MP across retreat, reload and re-entry", () => {
    clock();
    let c = wounded();
    const party = campaign(c).battle!.party.map((u) => ({
      id: u.id,
      hp: u.hp,
      mp: u.mp,
    }));
    c = act(c, { kind: "flee", target: 0 });
    c = returnToMap(c);
    expect(validateCharacter(JSON.parse(JSON.stringify(c)))).toBe(true);
    c = startBattle(JSON.parse(JSON.stringify(c)), "mossfall-1");
    expect(
      campaign(c).battle!.party.map((u) => ({ id: u.id, hp: u.hp, mp: u.mp })),
    ).toEqual(party);
    expect(
      party.some(
        (u) =>
          u.mp < campaign(c).battle!.party.find((x) => x.id === u.id)!.maxMp,
      ),
    ).toBe(true);
  });
  it("claims and continues without restoring resources or awarding real-world XP", () => {
    clock();
    let c = wounded();
    for (let i = 0; i < 80 && campaign(c).battle?.phase === "player"; i++)
      c = act(c, {
        kind: "attack",
        target: campaign(c).battle!.enemies.findIndex((u) => u.hp > 0),
      });
    expect(campaign(c).battle?.phase).toBe("won");
    const before = campaign(c).battle!.party.map((u) => [u.hp, u.mp]);
    const base = stats(c),
      xp = totalXP(c);
    c = continueAdventure(c);
    expect(campaign(c).battle!.party.map((u) => [u.hp, u.mp])).toEqual(before);
    expect(stats(c)).toEqual(base);
    expect(totalXP(c)).toBe(xp);
  });
  it("restores at local midnight once, including an offline return and an active fight", () => {
    clock();
    let c = wounded();
    const enemy = structuredClone(campaign(c).battle!.enemies);
    expect(refreshAdventure(c)).toBe(c);
    vi.setSystemTime(new Date(2027, 2, 15, 0, 0));
    c = refreshAdventure(c);
    expect(
      campaign(c).battle!.party.every(
        (u) => u.hp === u.maxHp && u.mp === u.maxMp,
      ),
    ).toBe(true);
    expect(campaign(c).battle!.enemies).toEqual(enemy);
    expect(refreshAdventure(c)).toBe(c);
    c = act(c, { kind: "ability", abilityId: "signature-warrior", target: 1 });
    const spent = campaign(c).battle!.party[0].mp;
    expect(spent).toBeLessThan(campaign(c).battle!.party[0].maxMp);
    expect(campaign(refreshAdventure(c)).battle!.party[0].mp).toBe(spent);
    vi.setSystemTime(new Date(2027, 2, 18, 9));
    expect(
      adventureParty(JSON.parse(JSON.stringify(c))).every(
        (u) => u.hp === u.maxHp && u.mp === u.maxMp,
      ),
    ).toBe(true);
  });
  it("keeps benched and defeated members depleted and refuses an exhausted retry", () => {
    clock();
    let c = wounded();
    c = act(c, { kind: "flee", target: 0 });
    c = leaveBattle(c);
    const mira = campaign(c).vitals!.members.mira;
    c.campaign = { ...campaign(c), party: [] };
    c = startBattle(c, "mossfall-1");
    c = returnToMap(act(c, { kind: "flee", target: 0 }));
    c.campaign = { ...campaign(c), party: ["mira"] };
    expect(adventureParty(c)[1].mp).toBe(mira.mp);
    for (const u of Object.values(c.campaign.vitals!.members)) u.hp = 0;
    expect(startBattle(c, "mossfall-1")).toBe(c);
    vi.setSystemTime(new Date(2027, 2, 15, 0));
    expect(startBattle(c, "mossfall-1")).not.toBe(c);
  });
  it("initializes older battles from their saved resources without a refill", () => {
    clock();
    const c = wounded();
    const hp = campaign(c).battle!.party[0].hp;
    const mp = campaign(c).battle!.party[0].mp;
    delete c.campaign!.vitals;
    const migrated = refreshAdventure(c);
    expect(adventureParty(migrated)[0]).toMatchObject({ hp, mp });
    expect(validateCharacter(migrated)).toBe(true);
    migrated.campaign!.vitals!.members.hero.hp = -1;
    expect(validateCharacter(migrated)).toBe(false);
  });
});

describe("optional request results", () => {
  const now = new Date(2027, 1, 10, 18);
  const walk = (c: ReturnType<typeof simulationCharacter>) =>
    objectives(c).find((o) => o.id === "u-walk-5")!;
  it("submits measured or unmeasured work for the same reward, once", () => {
    const c = takeRequest(simulationCharacter("Measured"), "u-walk-5", now);
    const o = walk(c),
      before = stats(c);
    const plain = completeWithResult(c, o, undefined, now);
    const measured = completeWithResult(
      c,
      o,
      { minutes: 6, distanceKm: 0.4, exercise: "Walking" },
      now,
    );
    expect(plain.completions.at(-1)!.xp).toBe(measured.completions.at(-1)!.xp);
    expect(plain.completions.at(-1)!.gold).toBe(
      measured.completions.at(-1)!.gold,
    );
    expect(stats(measured)).toEqual(before);
    expect(completeWithResult(measured, o, { minutes: 6 }, now)).toBe(measured);
    expect(
      completeWithResult(simulationCharacter("Untaken"), o, { minutes: 6 }, now)
        .completions,
    ).toHaveLength(0);
    expect(validateCharacter(JSON.parse(JSON.stringify(measured)))).toBe(true);
  });
  it("validates optional entries and normalizes imperial values", () => {
    const parsed = parseResult(
      {
        ...EMPTY_RESULT,
        exercise: "Bench press",
        sets: "3",
        reps: "8",
        loadKg: "100",
        distanceKm: "1",
        minutes: "12.5",
      },
      true,
    );
    expect(parsed.error).toBeUndefined();
    expect(parsed.result!.loadKg).toBeCloseTo(45.359237);
    expect(parsed.result!.distanceKm).toBeCloseTo(1.609344);
    expect(parseResult({ ...EMPTY_RESULT })).toEqual({});
    expect(
      parseResult({ ...EMPTY_RESULT, exercise: "Floor pushups" }).result,
    ).toEqual({ exercise: "Floor pushups" });
    for (const value of [
      { minutes: NaN },
      { minutes: -2 },
      { reps: 5 },
      { exercise: "Floor pushups", sets: 1.5 },
      { output: "x".repeat(281) },
      { minutes: 10, xp: 999 },
    ])
      expect(validActivityResult(value)).toBe(false);
    const c = takeRequest(simulationCharacter("Invalid"), "u-walk-5", now);
    expect(completeWithResult(c, walk(c), { minutes: -10 }, now)).toBe(c);
  });
  it("credits one practice day to each relevant accepted calendar goal without paying it", () => {
    let c = simulationCharacter("Stacking");
    for (const id of [
      "habit-walk-weekly-f",
      "habit-walk-monthly-f",
      "u-walk-5",
    ])
      c = takeRequest(c, id, now);
    const goals = takenObjectives(c, now).filter((o) => o.cadence !== "daily");
    expect(goals).toHaveLength(2);
    expect(
      creditedGoals(c, walk(c), now)
        .map((o) => o.id)
        .sort(),
    ).toEqual(goals.map((o) => o.id).sort());
    c = completeWithResult(c, walk(c), { minutes: 5 }, now);
    expect(c.completions).toHaveLength(1);
    for (const goal of goals)
      expect(requestProgress(c, goal, now).sessions).toBe(1);
    expect(creditedGoals(c, walk(c), now)).toHaveLength(0);
    const later = new Date(2027, 2, 1, 18);
    expect(takenObjectives(c, later)).toHaveLength(0);
    expect(isTaken(c, walk(c), later)).toBe(false);
  });
  it("keeps activity volume separate from assessments and exposes results in Journey", () => {
    let c = takeRequest(simulationCharacter("Charts"), "u-walk-5", now);
    c = completeWithResult(
      c,
      walk(c),
      {
        exercise: "Walking",
        minutes: 6,
        distanceKm: 0.4,
        output: "Riverside loop",
      },
      now,
    );
    expect(
      journeyItems(c).find((x) => x.kind === "completion")!.detail,
    ).toContain("Riverside loop");
    expect(resultSummary(c.completions[0].result)).toContain("0.4 km");
    const series = activityResultHistory(c, new Date(2027, 1, 1), now);
    expect(series.map((x) => x.unit).sort()).toEqual(["km", "min"]);
    c.preferences!.units = "imperial";
    expect(
      activityResultHistory(c, new Date(2027, 1, 1), now).find(
        (x) => x.unit === "mi",
      )!.points[0].value,
    ).toBe(0.25);
    const invalid = structuredClone(c);
    invalid.completions[0].result!.minutes = Infinity;
    expect(validateCharacter(invalid)).toBe(false);
  });
});
