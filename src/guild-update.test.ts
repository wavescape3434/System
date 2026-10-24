import { describe, it, expect } from "vitest";
import {
  demoCharacter,
  legacyDemoCharacter,
  upgradeTraining,
  upgradeExams,
  classLevel,
  classTrainingLevel,
  professionLevel,
  stats,
  totalXP,
  objectives,
  takeRequest,
  completeTaken,
  awardSkills,
  CLASSES,
  available,
  learnSkill,
  SKILLS,
} from "./domain";
import type { Character } from "./domain";
import { nextMentalForm, mentalForm, formScore } from "./exam-bank";
import {
  checkScore,
  displayAssessmentResults,
  EMPTY_ASSESSMENT,
} from "./metrics";
import {
  examTargets,
  submitFitnessExam,
  submitMentalExam,
  beginExam,
  usedExamForms,
  workProtocolId,
} from "./exams";
import { mentalPass } from "./exam-rules";
import { campaign, buy } from "./rpg";
import { validateCharacter } from "./storage";
import { notificationFeed, notificationUnread } from "./Notifications";
const now = new Date("2026-10-23T12:00:00Z");
const ready = (id = "warrior"): Character => {
  const c = demoCharacter();
  c.createdAt = "2026-09-01T12:00:00Z";
  c.activeClass = id;
  c.unlockedClasses = [id];
  c.completions = Array.from({ length: 12 }, (_, i) => ({
    id: `${id}-daily`,
    period: `2026-09-${i + 1}`,
    at: new Date(Date.UTC(2026, 8, i + 1, 12)).toISOString(),
    xp: 150,
    stat: CLASSES.find((p) => p.id === id)!.stat,
    classId: id,
    scope: "class",
    cadence: "daily",
    rank: "C",
    title: `${id} training`,
  }));
  return c;
};
const claim = (c: Character, id: string, at = now) => {
  c = takeRequest(c, id, at);
  return awardSkills(
    completeTaken(
      c,
      objectives(c).find((o) => o.id === id)!,
      at,
    ),
  );
};
describe("rotating, nonreligious assessments", () => {
  it("converts displayed forces and distances without changing the stored assessment or scores", () => {
    const a = {
      ...EMPTY_ASSESSMENT,
      strengthTest: "grip" as const,
      gripKg: 40,
      walkMetres: 550,
    };
    const metric = displayAssessmentResults(a, "metric"),
      imperial = displayAssessmentResults(a, "imperial");
    expect(imperial.find((r) => r.stat === "STR")!.raw).toBe(
      "88.2 lb · maximum grip",
    );
    expect(imperial.find((r) => r.stat === "CON")!.raw).toBe(
      "601.5 yd / 6 min",
    );
    expect(imperial.map((r) => r.value)).toEqual(metric.map((r) => r.value));
    expect(a.gripKg).toBe(40);
    expect(a.walkMetres).toBe(550);
  });
  it("has 24 distinct five-question forms for each attribute before case reuse and keeps questions out of religion", () => {
    for (const stat of ["INT", "WIS", "CHA"] as const) {
      const used: string[] = [],
        prompts = new Set<string>();
      for (let i = 0; i < 24; i++) {
        const f = nextMentalForm(stat, used);
        used.push(f.id);
        for (const q of f.questions) {
          expect(q.prompt).not.toMatch(/Bible|Scripture|James|KJV|verse/i);
          expect(new Set(q.options).size).toBe(4);
          prompts.add(q.prompt);
        }
        expect(
          formScore(
            f,
            f.questions.map((q) => q.answer),
          ),
        ).toBe(5);
      }
      expect(prompts.size).toBe(120);
    }
  });
  it("scores new form IDs while preserving recorded scores from the original assessment", () => {
    expect(checkScore("WIS", [2, 0, 1, 3, 1])).toBe(5);
    const f = mentalForm("WIS");
    expect(
      checkScore(
        "WIS",
        f.questions.map((q) => q.answer),
        f.id,
      ),
    ).toBe(5);
    const q = mentalForm("INT").questions[0];
    expect(q.options[q.answer]).toBe("10");
  });
});
describe("milestone certification", () => {
  it("holds level five and its stat reward until measured improvement, retaining all XP", () => {
    let c = ready();
    const xp = totalXP(c);
    expect(classTrainingLevel(c, "warrior")).toBe(9);
    expect(classLevel(c, "warrior")).toBe(4);
    expect(stats(c).STR).toBe(10);
    const t = examTargets(c).find((t) => t.owner === "warrior")!;
    c = submitFitnessExam(c, t, "push-floor", 20, "", now);
    expect(c.exams!.at(-1)!.status).toBe("failed");
    expect(classLevel(c, "warrior")).toBe(4);
    c = submitFitnessExam(c, t, "push-floor", 21, "", now);
    expect(c.exams!.at(-1)!.status).toBe("passed");
    expect(classLevel(c, "warrior")).toBe(9);
    expect(stats(c).STR).toBe(12);
    expect(totalXP(c)).toBe(xp);
    expect(validateCharacter(c)).toBe(true);
  });
  it("requires another exam at ten and compares against the passed five-level result", () => {
    let c = ready(),
      t = examTargets(c).find((t) => t.owner === "warrior")!;
    c = submitFitnessExam(c, t, "push-floor", 21, "", now);
    c.completions.push(
      ...c.completions
        .slice(0, 4)
        .map((o, i) => ({ ...o, id: `extra-${i}`, period: "once" })),
    );
    expect(classLevel(c, "warrior")).toBe(9);
    t = examTargets(c).find((t) => t.owner === "warrior")!;
    expect(t.milestone).toBe(10);
    const later = new Date("2026-10-30T12:00:00Z");
    c = submitFitnessExam(c, t, "push-floor", 22, "", later);
    expect(classLevel(c, "warrior")).toBe(9);
    c = submitFitnessExam(c, t, "push-floor", 23, "", later);
    expect(classLevel(c, "warrior")).toBeGreaterThanOrEqual(10);
    expect(stats(c).STR).toBe(15);
  });
  it("supports an alternate protocol but does not pay for recording a baseline or a same-day retest", () => {
    let c = ready(),
      t = examTargets(c).find((t) => t.owner === "warrior")!;
    c = submitFitnessExam(c, t, "push-wall", 30, "", now);
    expect(c.exams!.at(-1)!.status).toBe("baseline");
    c = submitFitnessExam(c, t, "push-wall", 35, "", now);
    expect(c.exams!.at(-1)!.status).toBe("failed");
    expect(classLevel(c, "warrior")).toBe(4);
    c = submitFitnessExam(
      c,
      t,
      "push-wall",
      32,
      "",
      new Date("2026-10-24T12:00:00Z"),
    );
    expect(c.exams!.at(-1)!.status).toBe("passed");
  });
  it("rotates class questions away from registration and requires improvement with at least four correct", () => {
    let c = ready("scholar");
    const old = mentalForm("INT"),
      answers = old.questions.map((q) => q.answer);
    answers[0] = (answers[0] + 1) % 4;
    answers[1] = (answers[1] + 1) % 4;
    c.baseline.assessment!.mental = {
      INT: {
        answers,
        formId: old.id,
        completedAt: "2026-09-01T12:00:00Z",
        durationMs: 120000,
      },
    };
    const t = examTargets(c).find((t) => t.owner === "scholar")!,
      f = nextMentalForm("INT", usedExamForms(c));
    expect(f.id).not.toBe(old.id);
    expect(f.questions[0].prompt).not.toBe(old.questions[0].prompt);
    c = beginExam(c, t, f, now);
    c = submitMentalExam(
      c,
      t,
      {
        answers: f.questions.map((q) => q.answer),
        formId: f.id,
        completedAt: now.toISOString(),
        durationMs: 120000,
      },
      now,
    );
    expect(c.exams!.at(-1)!.status).toBe("passed");
    expect(classLevel(c, "scholar")).toBe(9);
    expect(validateCharacter(c)).toBe(true);
  });
  it("uses an actual five percent time reduction at an accuracy ceiling, and offers a separate work-sample baseline", () => {
    const f = mentalForm("INT"),
      a = {
        answers: f.questions.map((q) => q.answer),
        formId: f.id,
        completedAt: now.toISOString(),
        durationMs: 100000,
      };
    const score = (r: typeof a) => checkScore("INT", r.answers, r.formId);
    expect(
      mentalPass({ ...a, durationMs: 96000 }, a, (r) => score(r as typeof a)),
    ).toBe(false);
    expect(
      mentalPass({ ...a, durationMs: 95000 }, a, (r) => score(r as typeof a)),
    ).toBe(true);
    let c = ready("scholar");
    const t = examTargets(c).find((t) => t.owner === "scholar")!,
      note =
        "Correct subnetting problems in ten minutes, checked against an answer key",
      id = workProtocolId("INT", note);
    c = submitFitnessExam(c, t, id, 10, note, now);
    expect(classLevel(c, "scholar")).toBe(4);
    c = submitFitnessExam(c, t, id, 11, note, new Date("2026-10-24T12:00:00Z"));
    expect(classLevel(c, "scholar")).toBe(9);
  });
  it("preserves previously earned levels and stats during the exam migration", () => {
    const c = ready();
    delete c.examVersion;
    const before = stats(c),
      lv = classLevel(c, "warrior");
    const next = upgradeExams(c);
    expect(lv).toBe(9);
    expect(classLevel(next, "warrior")).toBe(lv);
    expect(stats(next)).toEqual(before);
    expect(
      examTargets(next).find((t) => t.owner === "warrior")!.milestone,
    ).toBe(10);
    expect(upgradeExams(next)).toBe(next);
    expect(upgradeTraining(legacyDemoCharacter()).trainingVersion).toBe(3);
  });
  it("also gates career stat milestones with a career examination", () => {
    const c = ready();
    c.completions = c.completions.map((o) => ({
      ...o,
      scope: "profession",
      profession: "Analyst",
    }));
    expect(professionLevel(c)).toBe(4);
    expect(
      examTargets(c).find(
        (t) => t.scope === "profession" && t.owner === "Analyst",
      )!.ready,
    ).toBe(true);
    expect(stats(c).INT).toBe(10);
  });
});
describe("guild rewards, requirements and branches", () => {
  it("requires above-average attributes for nonbasic paths while allowing high starting advanced paths", () => {
    for (const p of CLASSES.filter((p) => p.tier !== "Basic"))
      expect(Object.values(p.requirements).every((n) => n! > 10)).toBe(true);
    const high = { STR: 100, DEX: 100, CON: 100, INT: 100, WIS: 100, CHA: 100 };
    expect(
      available(
        CLASSES.find((p) => p.id === "knight")!,
        high,
        0,
      ),
    ).toBe(true);
    for (const p of CLASSES.filter((p) =>
      ["Prestige", "Ascendant"].includes(p.tier),
    ))
      expect(available(p, high, 1e8)).toBe(false);
  });
  it("credits task gold once to the adventure wallet and settles spending without duplicating rewards", () => {
    let c = claim(demoCharacter(), "u-floor-push-20");
    expect(campaign(c).gold).toBe(30);
    expect(campaign(claim(c, "u-floor-push-20")).gold).toBe(30);
    c = buy(c, "potion");
    expect(campaign(c).gold).toBe(10);
    expect(c.campaign!.trainingGoldAccrued).toBe(30);
    c = claim(c, "u-read-5");
    expect(campaign(c).gold).toBe(12);
    expect(validateCharacter(c)).toBe(true);
  });
  it("keeps daily tasks solo and routes group hike XP to both conditioning and communication classes", () => {
    let c: Character = {
      ...demoCharacter(),
      activeClass: "sentinel",
      unlockedClasses: ["sentinel", "bard"],
    };
    const daily = objectives(c).filter((o) => o.cadence === "daily");
    expect(daily.every((o) => o.participants === "solo")).toBe(true);
    c = claim(c, "q-group-hike");
    const event = c.completions.at(-1)!;
    expect(event.trainingMix).toEqual({ CON: 0.7, CHA: 0.3 });
    expect(event.classCredits?.sentinel).toBe(52);
    expect(event.classCredits?.bard).toBe(11);
    expect(totalXP(c)).toBe(150);
  });
  it("makes full gym access satisfy weights and bar requirements", () => {
    let c = demoCharacter();
    c.preferences = {
      units: "metric",
      textSize: "standard",
      reduceMotion: false,
      equipment: ["bodyweight", "gym"],
      showLockedRequests: true,
      defaultPage: "guild",
    };
    c.baseline.assessment!.pullups = 30;
    expect(takeRequest(c, "u-pullup-20", now)).not.toBe(c);
    expect(takeRequest(c, "u-weighted-strength", now)).not.toBe(c);
    expect(validateCharacter(c)).toBe(true);
  });
  it("offers independent sword and spear routes with usable combat skills and no dependency cycles", () => {
    let c = ready();
    c = learnSkill(c, "arc-fighter-1");
    c = learnSkill(c, "martial-spear-1");
    expect(c.earnedSkills).toContain("martial-spear-1");
    expect(c.earnedSkills).not.toContain("martial-sword-1");
    expect(SKILLS.find((s) => s.id === "martial-spear-1")!.combat).toBe(
      "pierce",
    );
    const visit = (id: string, path: string[]) => {
      expect(path).not.toContain(id);
      const s = SKILLS.find((s) => s.id === id);
      expect(s).toBeDefined();
      for (const p of [...s!.parents, ...(s!.anyParents || [])])
        visit(p, [...path, id]);
    };
    for (const s of SKILLS.filter((s) => !s.legacy)) visit(s.id, []);
  });
  it("creates real reward notifications and preserves their read state", () => {
    let c = claim(demoCharacter(), "u-read-5");
    expect(notificationFeed(c).some((n) => n.detail.includes("gold"))).toBe(
      true,
    );
    expect(notificationUnread(c).length).toBeGreaterThan(0);
    c = {
      ...c,
      notificationReads: notificationFeed(c).map((n) => n.id),
      notificationsReadAt: now.toISOString(),
    };
    expect(notificationUnread(c)).toHaveLength(0);
    expect(validateCharacter(c)).toBe(true);
  });
  it("rejects malformed new exam and currency state in backups", () => {
    const c = ready();
    expect(
      validateCharacter({
        ...c,
        exams: [{ id: "bad", scope: "class", owner: "warrior", milestone: 6 }],
      }),
    ).toBe(false);
    expect(
      validateCharacter({
        ...c,
        campaign: { ...campaign(c), trainingGoldAccrued: "broken" },
      }),
    ).toBe(false);
  });
});
