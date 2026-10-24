import { describe, it, expect } from "vitest";
import {
  demoCharacter,
  objectives,
  takeRequest,
  isTaken,
  takenObjectives,
  suggestedObjectives,
  completeTaken,
  releaseRequest,
  totalXP,
  stats,
  switchClass,
  classXP,
  professionXP,
  period,
} from "./domain";
import { validateCharacter } from "./storage";
const today = new Date(2026, 9, 20, 12),
  tomorrow = new Date(2026, 9, 21, 12);
const strength = (c = demoCharacter()) =>
  objectives(c).find((o) => o.id === "warrior-daily")!;
describe("guild request commitments", () => {
  it("requires explicit acceptance, stores one commitment, and grants no XP for taking it", () => {
    const c = demoCharacter(),
      o = strength(c),
      next = takeRequest(c, o.id, today);
    expect(completeTaken(c, o, today)).toBe(c);
    expect(isTaken(next, o, today)).toBe(true);
    expect(totalXP(next)).toBe(0);
    expect(stats(next)).toEqual(stats(c));
    expect(takeRequest(next, o.id, today)).toBe(next);
    expect(takeRequest(c, "invented", today)).toBe(c);
    expect(validateCharacter(next)).toBe(true);
  });
  it("credits the accepted class after switching classes, using canonical rewards", () => {
    let c = takeRequest(demoCharacter(), "warrior-daily", today);
    c = switchClass(c, "bard");
    const o = takenObjectives(c, today)[0];
    c = completeTaken(c, { ...o, xp: 9999 }, today);
    expect(classXP(c, "warrior")).toBe(30);
    expect(classXP(c, "bard")).toBe(0);
    expect(totalXP(c)).toBe(30);
    expect(completeTaken(c, o, today)).toBe(c);
    expect(validateCharacter(c)).toBe(true);
  });
  it("retains the accepted profession and vocation when the current focus changes", () => {
    let c = takeRequest(demoCharacter(), "vocation-networking-daily", today);
    c = { ...c, profession: "Teacher", vocation: "education-practice" };
    const o = takenObjectives(c, today)[0];
    c = completeTaken(c, o, today);
    expect(professionXP(c, "Analyst")).toBe(30);
    expect(professionXP(c, "Teacher")).toBe(0);
    expect(c.completions[0].careerCategory).toBe("technology");
    expect(c.completions[0].vocationId).toBe("networking");
  });
  it("expires at the calendar boundary and suggests rather than auto-accepting the next occurrence", () => {
    let c = takeRequest(demoCharacter(), "warrior-daily", today);
    c = completeTaken(c, strength(c), today);
    expect(takenObjectives(c, tomorrow)).toHaveLength(0);
    expect(isTaken(c, strength(c), tomorrow)).toBe(false);
    expect(
      suggestedObjectives(c, tomorrow).some((o) => o.id === "warrior-daily"),
    ).toBe(true);
    expect(completeTaken(c, strength(c), tomorrow)).toBe(c);
    c = takeRequest(c, "warrior-daily", tomorrow);
    expect(takenObjectives(c, tomorrow)).toHaveLength(1);
    c = completeTaken(c, strength(c), tomorrow);
    expect(totalXP(c)).toBe(60);
  });
  it("releases a request without erasing completion history or granting another reward", () => {
    let c = takeRequest(demoCharacter(), "warrior-daily", today);
    c = completeTaken(c, strength(c), today);
    c = releaseRequest(c, "warrior-daily");
    expect(c.completions).toHaveLength(1);
    expect(takeRequest(c, "warrior-daily", today)).toBe(c);
    expect(totalXP(c)).toBe(30);
  });
  it("keeps weekly and monthly commitments only within their own calendar periods", () => {
    let c = takeRequest(demoCharacter(), "warrior-weekly", today);
    c = takeRequest(c, "warrior-monthly", today);
    expect(takenObjectives(c, new Date(2026, 9, 25))).toHaveLength(2);
    expect(takenObjectives(c, new Date(2026, 9, 26))).toHaveLength(1);
    expect(takenObjectives(c, new Date(2026, 10, 1))).toHaveLength(0);
    const o = objectives(c).find((o) => o.id === "warrior-monthly")!;
    expect(completeTaken(c, o, today)).toBe(c);
    c.milestones[`${o.id}:${period("monthly", today)}`] = [0, 1, 2];
    expect(totalXP(completeTaken(c, o, today))).toBe(400);
  });
  it("validates request contexts and survives backup round trips", () => {
    const c = takeRequest(demoCharacter(), "warrior-daily", today);
    expect(validateCharacter(JSON.parse(JSON.stringify(c)))).toBe(true);
    expect(
      validateCharacter({
        ...c,
        takenRequests: [{ ...c.takenRequests![0], classId: "invalid" }],
      }),
    ).toBe(false);
    expect(
      validateCharacter({
        ...c,
        takenRequests: [{ ...c.takenRequests![0], takenPeriod: "2030-01-01" }],
      }),
    ).toBe(false);
    expect(
      validateCharacter({
        ...c,
        takenRequests: [...c.takenRequests!, ...c.takenRequests!],
      }),
    ).toBe(false);
  });
});
