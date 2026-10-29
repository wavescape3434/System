import { describe, it, expect, vi, afterEach } from "vitest";
import {
  demoCharacter,
  classLevel,
  classXP,
  professionXP,
  careerXP,
  totalXP,
  walletXP,
  stats,
} from "./domain";
import type { Character } from "./domain";
import { progressionLedger, progressionChanged } from "./progression-ledger";
import { recordJourney } from "./journey-events";
import {
  masteryStandard,
  examTargets,
  submitFitnessExam,
  beginExam,
  submitMentalExam,
  usedExamForms,
} from "./exams";
import { nextMentalForm, mentalForm } from "./exam-bank";
import { performanceHistory } from "./performance-history";
import {
  packCloudSnapshot,
  unpackCloudSnapshot,
  validCloudSnapshot,
  CLOUD_CHUNK_SIZE,
} from "./cloud-backup";
import {
  saveCharacter,
  localRecovery,
  STORAGE_KEY,
  RECOVERY_KEY,
  validateCharacter,
} from "./storage";
import { reminderPlan } from "./reminders";
import { takeRequest, objectives } from "./domain";

const now = new Date("2026-10-24T18:00:00Z");
function ready(id = "warrior") {
  const c = demoCharacter();
  c.activeClass = id;
  c.unlockedClasses = [id];
  c.completions = Array.from({ length: 70 }, (_, i) => ({
    id: `practice-${i}`,
    period: `practice-${i}`,
    title: "Practice",
    at: "2026-09-01T12:00:00Z",
    classId: id,
    scope: "class",
    stat: id === "scholar" ? "INT" : "STR",
    xp: 150,
    rank: "C",
  })) as Character["completions"];
  return c;
}
afterEach(() => vi.unstubAllGlobals());
describe("indexed progression retains credit rules", () => {
  it("matches own, shared, profession, vocation and wallet totals with migration offsets", () => {
    const c = ready();
    c.completions = [
      { ...c.completions[0], xp: 100, classCredits: { scholar: 25 } },
      {
        ...c.completions[1],
        scope: "universal",
        xp: 80,
        classCredits: { warrior: 40, scholar: 20 },
        professionCredit: { name: "Analyst", category: "business", xp: 20 },
        vocationCredit: { id: "networking", category: "technology", xp: 20 },
      },
      {
        ...c.completions[2],
        scope: "profession",
        profession: "Analyst",
        careerCategory: "business",
        xp: 60,
      },
    ];
    expect(totalXP(c)).toBe(240);
    expect(classXP(c, "warrior")).toBe(140);
    expect(classXP(c, "scholar")).toBe(45);
    expect(professionXP(c)).toBe(80);
    expect(careerXP(c, "technology")).toBe(20);
    expect(careerXP(c, "business")).toBe(80);
    expect(walletXP(c, "combat")).toBe(140);
    expect(walletXP(c, "universal")).toBe(80);
    expect(progressionLedger(c)).toBe(
      progressionLedger({ ...c, name: "Changed" }),
    );
    c.completions.push({ ...c.completions[0], id: "new", xp: 25 });
    expect(totalXP(c)).toBe(265);
  });
  it("does not manufacture milestones for cosmetic, reminder or battle-only changes", () => {
    const c = ready(),
      next = {
        ...c,
        name: "New name",
        appearance: "moonsilk-dancer",
        preferences: { ...c.preferences!, reduceMotion: true },
      };
    expect(progressionChanged(c, next)).toBe(false);
    expect(recordJourney(c, next)).toBe(next);
    expect(
      progressionChanged(c, { ...c, earnedSkills: [...c.earnedSkills, "new"] }),
    ).toBe(true);
  });
});
describe("earned mastery examinations", () => {
  it("requires two improved milestones on the same test, retains the best standard and a later day", () => {
    let c = ready();
    for (const [milestone, value] of [
      [5, 22],
      [10, 24],
    ])
      c.exams = [
        ...(c.exams || []),
        {
          id: `passed-${milestone}`,
          scope: "class",
          owner: "warrior",
          milestone,
          stat: "STR",
          at: "2026-10-01T12:00:00Z",
          status: "passed",
          protocol: "push-floor",
          value,
          baseline: value - 2,
        },
      ];
    const target = examTargets(c)[0];
    expect(target.milestone).toBe(15);
    expect(masteryStandard(c, target, "push-floor").eligible).toBe(true);
    expect(masteryStandard(c, target, "push-wall").eligible).toBe(false);
    expect(
      submitFitnessExam(c, target, "push-wall", 24, "", now, "mastery"),
    ).toBe(c);
    expect(
      submitFitnessExam(
        c,
        target,
        "push-floor",
        23,
        "",
        now,
        "mastery",
      ).exams!.at(-1)!.status,
    ).toBe("failed");
    expect(
      submitFitnessExam(
        c,
        target,
        "push-floor",
        24,
        "",
        new Date("2026-10-01T20:00:00Z"),
        "mastery",
      ).exams!.at(-1)!.status,
    ).toBe("failed");
    const passed = submitFitnessExam(
      c,
      target,
      "push-floor",
      24,
      "",
      now,
      "mastery",
    );
    expect(passed.exams!.at(-1)!.route).toBe("mastery");
    expect(classLevel(passed, "warrior")).toBeGreaterThanOrEqual(15);
    expect(stats(passed).STR).toBeGreaterThan(stats(c).STR);
    expect(validateCharacter(passed)).toBe(true);
  });
  it("allows a new perfect mental form without an ever-faster timer after two improved milestones", () => {
    let c = ready("scholar");
    c.exams = [5, 10].map((milestone, i) => {
      const form = mentalForm("INT", `int-v3-${i}-c1`);
      return {
        id: `mental-${milestone}`,
        scope: "class",
        owner: "scholar",
        stat: "INT",
        milestone,
        status: "passed",
        at: "2026-10-01T12:00:00Z",
        mental: {
          formId: form.id,
          answers: form.questions.map((q) => q.answer),
          completedAt: "2026-10-01T12:00:00Z",
          durationMs: 60000,
        },
      };
    });
    const t = examTargets(c)[0],
      form = nextMentalForm("INT", usedExamForms(c));
    c = beginExam(c, t, form, now);
    const passed = submitMentalExam(
      c,
      t,
      {
        formId: form.id,
        answers: form.questions.map((q) => q.answer),
        completedAt: now.toISOString(),
        durationMs: 120000,
      },
      now,
      "mastery",
    );
    expect(passed.exams!.at(-1)!.status).toBe("passed");
    expect(classLevel(passed, "scholar")).toBeGreaterThanOrEqual(15);
    expect(validateCharacter(passed)).toBe(true);
  });
});
describe("raw performance history", () => {
  it("keeps equipment and protocol variants separate, converts units, and excludes future records", () => {
    const c = demoCharacter(),
      baseline = c.baseline.assessment!;
    c.preferences = { ...c.preferences!, units: "imperial" };
    c.assessmentHistory = [
      {
        at: "2026-10-01T12:00:00Z",
        stats: c.baseStats,
        assessment: {
          ...baseline,
          strengthTest: "pushups",
          pushupStyle: "floor",
          pushups: 20,
          walkMetres: 550,
        },
      },
      {
        at: "2026-10-10T12:00:00Z",
        stats: c.baseStats,
        assessment: {
          ...baseline,
          strengthTest: "pushups",
          pushupStyle: "wall",
          pushups: 30,
          walkMetres: 600,
        },
      },
      {
        at: "2026-11-01T12:00:00Z",
        stats: c.baseStats,
        assessment: { ...baseline, pushups: 50 },
      },
    ];
    const series = performanceHistory(c, new Date("2026-10-01"), now);
    expect(
      series.find((g) => g.id === "push-floor")!.points.map((p) => p.value),
    ).toEqual([20]);
    expect(
      series.find((g) => g.id === "push-wall")!.points.map((p) => p.value),
    ).toEqual([30]);
    expect(series.find((g) => g.id === "walk6")!.unit).toBe("yards");
    expect(series.find((g) => g.id === "walk6")!.points[1].value).toBe(656.2);
  });
});
describe("bounded cloud snapshots and recovery", () => {
  it("round-trips a backup larger than a Firestore document, including Unicode at chunk boundaries", async () => {
    const input = {
      id: "long-lived-character",
      text: `${"x".repeat(CLOUD_CHUNK_SIZE - 42)}⚔️${"😀🌿".repeat(280000)}`,
    };
    const packed = await packCloudSnapshot(input);
    expect(packed.chunks.length).toBeGreaterThan(50);
    expect(packed.chunks.every((p) => p.length <= CLOUD_CHUNK_SIZE)).toBe(true);
    expect(validCloudSnapshot(packed.manifest)).toBe(true);
    expect(await unpackCloudSnapshot(packed.manifest, packed.chunks)).toEqual(
      input,
    );
    await expect(
      unpackCloudSnapshot(packed.manifest, packed.chunks.slice(1)),
    ).rejects.toThrow("incomplete");
    await expect(
      unpackCloudSnapshot(packed.manifest, [
        ...packed.chunks.slice(0, -1),
        "damaged",
      ]),
    ).rejects.toThrow("integrity");
    expect(
      validCloudSnapshot({ ...packed.manifest, generation: "../../other" }),
    ).toBe(false);
  });
  it("commits progress even when an optional recovery snapshot cannot be written", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => {
        if (key === RECOVERY_KEY) throw Error("quota");
        values.set(key, value);
      },
    });
    const c = demoCharacter();
    expect(() => saveCharacter(c)).not.toThrow();
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(c);
    expect(localRecovery()).toBeNull();
  });
  it("keeps a recoverable character when the primary record is damaged", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    const c = demoCharacter();
    saveCharacter(c);
    values.set(STORAGE_KEY, "corrupt");
    expect(localRecovery()?.character.id).toBe(c.id);
  });
});
describe("late deadline acceptance", () => {
  it("schedules a fixed reminder for a last-day weekly request without postponing it on each refresh", () => {
    const accepted = new Date(2027, 1, 7, 12);
    let c = demoCharacter();
    const weekly = objectives(c).find(
      (o) => o.cadence === "weekly" && o.scope === "universal",
    )!;
    c = takeRequest(c, weekly.id, accepted);
    const first = reminderPlan(c, accepted).find(
      (n) => n.cadence === "weekly",
    )!;
    expect(first.title).toContain("end today");
    expect(first.at.getHours()).toBe(21);
    expect(
      reminderPlan(c, new Date(accepted.getTime() + 60000)).find(
        (n) => n.cadence === "weekly",
      )!.at,
    ).toEqual(first.at);
  });
});
