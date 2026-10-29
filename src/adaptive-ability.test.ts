import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createCharacter,
  EMPTY_BASELINE,
  objectives,
  takeRequest,
  takenObjectives,
  stats,
  totalXP,
} from "./domain";
import type { Character, Objective } from "./domain";
import { EMPTY_ASSESSMENT } from "./metrics";
import {
  abilityBrief,
  abilityDomain,
  recordAbilityCheck,
  abilityRecommendation,
  validAbilityCheck,
  validPracticeEvidence,
} from "./adaptive-ability";
import type { PracticeEvidence } from "./adaptive-ability";
import { recommendedRequest } from "./proficiency";
import { groupRequests } from "./objective-catalog";
import { completeWithResult, validActivityResult } from "./activity-results";
import { personalizedWorkout, defaultTrainingPlan } from "./training-regimen";
import {
  validWorkoutPrescription,
  canonicalWorkout,
} from "./training-prescriptions";
import type { WorkoutPrescription } from "./training-prescriptions";
import { validateCharacter } from "./storage";
import { examTargets, submitFitnessExam, workProtocolId } from "./exams";
import { professionLevel } from "./domain";
import { CAREER_CATEGORIES, VOCATIONS, careerCategory } from "./careers";
import { PROFESSIONS } from "./professions";
const day = (n = 0) => new Date(2027, 1, 1 + n, 12);
const sample = (
  level: PracticeEvidence["level"] = "D",
  subject = "Current subject",
  source = "Same source v1",
): PracticeEvidence => ({
  level,
  subject,
  source,
  independent: true,
  unfamiliar: true,
  criteriaMet: 4,
  criteriaTotal: 4,
});
function actor() {
  vi.useFakeTimers();
  vi.setSystemTime(day());
  return createCharacter(
    "Adaptive fixture",
    { ...EMPTY_BASELINE, assessment: { ...EMPTY_ASSESSMENT } },
    "scholar",
    "Teacher",
  );
}
const request = (c: Character, id: string) =>
  objectives(c).find((o) => o.id === id)!;
function mastered(c: Character, o: Objective, quality = sample()) {
  c = recordAbilityCheck(c, o, quality, day());
  c = recordAbilityCheck(c, o, quality, day(2));
  vi.setSystemTime(day(3));
  return c;
}
afterEach(() => vi.useRealTimers());
describe("one adaptive system across different real-world abilities", () => {
  it("advances actual learning, language, writing, Scripture, judgment, communication, coordination and cycling families", () => {
    const ids = [
      "u-spaced-recall",
      "practice-language-d",
      "practice-writing-d",
      "practice-context-d",
      "practice-reflection-d",
      "practice-speech-d",
      "practice-message-craft-d",
      "practice-listening-lab-d",
      "practice-hands-d",
      "practice-footwork-d",
      "practice-joint-control-d",
      "practice-cycling-d",
      "practice-stairs-d",
    ];
    for (const id of ids) {
      let c = actor();
      const o = request(c, id);
      expect(o, id).toBeTruthy();
      c = mastered(c, o);
      const group = groupRequests(objectives(c)).find((g) =>
        g.variants.some((r) => r.id === id),
      )!;
      expect(abilityRecommendation(c, o)!.mastered, id).toBe(true);
      expect(recommendedRequest(c, group.variants).rank, id).toBe("C");
      expect(validateCharacter(c)).toBe(true);
    }
  });
  it("covers all twenty career categories and twenty-five independent vocations without awarding sample XP or stats", () => {
    for (const kind of ["career", "vocation"] as const)
      for (const entry of kind === "career" ? CAREER_CATEGORIES : VOCATIONS) {
        let c = actor();
        if (kind === "career")
          c.profession = PROFESSIONS.find(
            (p) => careerCategory(p).id === entry.id,
          )!;
        else c.vocation = entry.id;
        const o = request(
          c,
          kind === "career" ? "profession-daily" : `vocation-${entry.id}-daily`,
        );
        const before = {
          xp: totalXP(c),
          stats: stats(c),
          count: c.completions.length,
        };
        c = mastered(c, o);
        expect(abilityRecommendation(c, o)!.level, entry.id).toBe("C");
        expect(totalXP(c)).toBe(before.xp);
        expect(stats(c)).toEqual(before.stats);
        expect(c.completions.length).toBe(before.count);
        expect(abilityBrief(o, "C").criteria).toHaveLength(4);
        expect(validateCharacter(c)).toBe(true);
      }
  });
  it("uses category-specific and activity-specific outputs, rather than converting every task into generic questions", () => {
    const c = actor();
    expect(abilityBrief(request(c, "practice-language-d"), "C").task).toContain(
      "source difficulty",
    );
    expect(abilityBrief(request(c, "practice-writing-d"), "C").task).toContain(
      "decision brief",
    );
    expect(
      abilityBrief(request(c, "practice-message-craft-d"), "D").task,
    ).toContain("Draft a difficult message");
    expect(
      abilityBrief(request(c, "profession-daily"), "D").criteria,
    ).toContain("Check for a specific misconception");
    c.activeClass = "artificer";
    expect(abilityBrief(request(c, "artificer-daily"), "D").task).toContain(
      "Build or repair",
    );
  });
  it("keeps topics, competencies, sources and professions independent", () => {
    let c = actor();
    c.profession = "Network Engineer";
    c.vocation = "networking";
    const subnet = request(c, "network-subnet-daily"),
      switching = request(c, "network-switch-daily");
    c = mastered(c, subnet, sample("D", "IPv4 subnetting", "Lab bank v1"));
    expect(abilityRecommendation(c, subnet, "IPv4 subnetting")!.level).toBe(
      "C",
    );
    expect(abilityRecommendation(c, switching)).toBeUndefined();
    expect(
      abilityRecommendation(c, subnet, "Japanese listening"),
    ).toBeUndefined();
    const changed = { ...c, profession: "Baker" };
    expect(
      abilityRecommendation(changed, {
        ...subnet,
        careerCategory: "hospitality",
      }),
    ).toBeUndefined();
    c = recordAbilityCheck(
      c,
      subnet,
      sample("D", "IPv4 subnetting", "Easier memorized bank"),
      day(3),
    );
    expect(abilityRecommendation(c, subnet)!.mastered).toBe(false);
  });
  it("does not promote from one good day, copied familiar work, minutes, game stats or duplicate same-day samples", () => {
    let c = actor();
    const o = request(c, "practice-language-d");
    c.baseStats.INT = 500;
    expect(abilityRecommendation(c, o)).toBeUndefined();
    c = recordAbilityCheck(c, o, sample(), day());
    c = recordAbilityCheck(c, o, sample(), day());
    expect(abilityRecommendation(c, o)!.mastered).toBe(false);
    c = recordAbilityCheck(
      c,
      o,
      { ...sample(), independent: false, unfamiliar: false },
      day(2),
    );
    vi.setSystemTime(day(3));
    expect(abilityRecommendation(c, o)!.level).toBe("E");
    const noQuality = {
      ...actor(),
      completions: [
        {
          id: o.id,
          at: day().toISOString(),
          period: "fixture",
          xp: 60,
          title: o.title,
          stat: o.stat,
          classId: "scholar",
          family: o.family,
          scope: o.scope,
          result: { minutes: 120, topic: "Language" },
        },
      ],
    };
    expect(abilityRecommendation(noQuality, o)).toBeUndefined();
  });
  it("adapts from completed request results and prioritizes checked correctness over a generous self-rating", () => {
    let c = actor();
    const o = request(c, "practice-language-d");
    for (const n of [0, 2]) {
      vi.setSystemTime(day(n));
      c = takeRequest(c, o.id, day(n));
      const accepted = takenObjectives(c, day(n)).find((r) => r.id === o.id)!;
      c = completeWithResult(
        c,
        accepted,
        {
          practice: sample(),
          topic: "Current subject",
          attempted: 10,
          correct: 0,
        },
        day(n),
      );
    }
    vi.setSystemTime(day(3));
    expect(c.completions).toHaveLength(2);
    expect(abilityRecommendation(c, o)!.level).toBe("E");
    expect(abilityRecommendation(c, o)!.struggling).toBe(true);
  });
  it("never changes accepted work, earned progress, or supplies after new placement", () => {
    let c = actor();
    const o = request(c, "practice-language-d");
    c = takeRequest(c, o.id, day());
    const original = structuredClone(
      takenObjectives(c, day()).find((r) => r.id === o.id)!,
    );
    c = mastered(c, o);
    expect(takenObjectives(c, day()).find((r) => r.id === o.id)).toEqual(
      original,
    );
    expect(totalXP(c)).toBe(0);
  });
  it("does not escalate maintenance/recovery or accept malformed proof", () => {
    const c = actor(),
      sleep = request(c, "daily-sleep-log");
    expect(abilityDomain(sleep)).toBe("recovery");
    expect(recordAbilityCheck(c, sleep, sample())).toBe(c);
    expect(validPracticeEvidence({ ...sample(), criteriaMet: 5 })).toBe(false);
    expect(validPracticeEvidence({ ...sample(), source: "" })).toBe(false);
    const next = recordAbilityCheck(
      c,
      request(c, "profession-daily"),
      sample(),
    );
    expect(validAbilityCheck(next.abilityChecks![0])).toBe(true);
    expect(validActivityResult({ practice: sample() })).toBe(true);
  });
});
function appendWorkout(
  c: Character,
  p: WorkoutPrescription,
  n: number,
  load = 20,
  rir = 3,
): Character {
  const o = request(c, "regimen-a-d");
  return {
    ...c,
    completions: [
      ...c.completions,
      {
        id: o.id,
        at: day(n).toISOString(),
        period: `day-${n}`,
        title: "Comparable workout",
        xp: 60,
        stat: "STR",
        scope: "universal",
        classId: "scholar",
        rank: "D",
        cadence: "daily",
        family: "u-resistance",
        workout: p,
        result: {
          workout: {
            prescription: p,
            exercises: p.exercises.map((e) => ({
              id: e.id,
              variation: e.name,
              reps: Array.from({ length: e.sets }, () => e.max),
              rir,
              ...(e.load ? { loadKg: load } : {}),
            })),
          },
        },
      },
    ],
  };
}
describe("all movement patterns and equipment routes", () => {
  it("advances legs, hips and core independently after comparable top-range work", () => {
    let c = actor();
    c.trainingPlan = {
      ...defaultTrainingPlan(c),
      rank: "D",
      movementLevels: { squat: 1, hinge: 1, core: 1 },
    };
    const p = personalizedWorkout(c, "D", "A", "home");
    c = appendWorkout(c, p, 0);
    c = appendWorkout(c, p, 3);
    vi.setSystemTime(day(4));
    const next = personalizedWorkout(c, "D", "A", "home");
    expect(next.exercises[0].name).toBe("Controlled bodyweight squat");
    expect(next.exercises[3].name).toBe("Paused glute bridge");
    expect(next.exercises[4].name).toBe("Dead bug");
    expect(validWorkoutPrescription(next)).toBe(true);
    expect(canonicalWorkout(c.completions[0].workout)).toBe(
      canonicalWorkout(p),
    );
  });
  it("suggests measured load progression for all loaded movements and allows a recovery/manual plan", () => {
    for (const env of ["weights", "gym"] as const) {
      let c = actor();
      c.trainingPlan = {
        ...defaultTrainingPlan(c),
        rank: "D",
        environment: env,
      };
      const p = personalizedWorkout(c, "D", "A", env);
      c = appendWorkout(c, p, 0);
      c = appendWorkout(c, p, 3);
      vi.setSystemTime(day(4));
      const next = personalizedWorkout(c, "D", "A", env);
      for (const e of next.exercises.filter((e) => e.load))
        expect(e.suggestedLoadKg).toBe(20.5);
      expect(validWorkoutPrescription(next)).toBe(true);
      c.trainingPlan!.automaticAbility = false;
      expect(
        personalizedWorkout(c, "D", "A", env).exercises.every(
          (e) => !e.suggestedLoadKg,
        ),
      ).toBe(true);
    }
  });
  it("does not progress from changed setup/load, one day, or inadequate reserve", () => {
    let c = actor();
    c.trainingPlan = {
      ...defaultTrainingPlan(c),
      rank: "D",
      environment: "weights",
    };
    const p = personalizedWorkout(c, "D", "A", "weights");
    c = appendWorkout(c, p, 0, 20);
    c = appendWorkout(c, p, 3, 25);
    vi.setSystemTime(day(4));
    expect(
      personalizedWorkout(c, "D", "A", "weights").exercises.find(
        (e) => e.id === "row",
      )!.suggestedLoadKg,
    ).toBe(25);
    c = appendWorkout(c, p, 5, 25, 0);
    vi.setSystemTime(day(6));
    expect(
      personalizedWorkout(c, "D", "A", "weights").exercises.find(
        (e) => e.id === "row",
      )!.suggestedLoadKg,
    ).toBe(23.8);
  });
});

describe("frontier checks and retained context", () => {
  it("requires fresh lower-tier work after an unsuccessful harder attempt", () => {
    let c = actor();
    const o = request(c, "practice-language-d");
    for (const n of [0, 1]) c = recordAbilityCheck(c, o, sample("D"), day(n));
    vi.setSystemTime(day(2));
    expect(abilityRecommendation(c, o)!.level).toBe("C");
    c = recordAbilityCheck(c, o, { ...sample("C"), criteriaMet: 1 }, day(2));
    c = recordAbilityCheck(c, o, sample("D"), day(3));
    vi.setSystemTime(day(3));
    expect(abilityRecommendation(c, o)!.level).toBe("D");
    c = recordAbilityCheck(c, o, sample("D"), day(4));
    vi.setSystemTime(day(4));
    expect(abilityRecommendation(c, o)!.level).toBe("C");
  });
  it("can switch subjects without inheriting or discarding the other subject's evidence", () => {
    let c = actor();
    const o = request(c, "practice-language-d");
    c = recordAbilityCheck(c, o, sample("C", "Japanese"), day());
    c = recordAbilityCheck(c, o, sample("F", "French"), day(1));
    vi.setSystemTime(day(1));
    expect(abilityRecommendation(c, o, "Japanese")!.level).toBe("C");
    expect(abilityRecommendation(c, o, "French")!.level).toBe("F");
    expect(c.abilityChecks).toHaveLength(2);
  });
  it("binds quality evidence to the accepted rank and original class after a switch", () => {
    let c = actor();
    const o = request(c, "scholar-daily-proficiency-f");
    c = takeRequest(c, o.id, day());
    const taken = takenObjectives(c, day()).find((r) => r.id === o.id)!;
    expect(
      completeWithResult(
        c,
        { ...taken, rank: "C" },
        { practice: sample("C") },
        day(),
      ),
    ).toBe(c);
    c = {
      ...c,
      activeClass: "warrior",
      unlockedClasses: ["warrior", "scholar"],
    };
    c = completeWithResult(c, taken, { practice: sample("F") }, day());
    expect(c.completions.at(-1)!.classId).toBe("scholar");
    expect(
      Object.keys(c.proficiencies!).some((k) => k.startsWith("class:scholar:")),
    ).toBe(true);
    expect(
      Object.keys(c.proficiencies!).some((k) => k.startsWith("class:warrior:")),
    ).toBe(false);
  });
  it("honors exact walking targets and uses separate initial pull/balance evidence", () => {
    const c = actor();
    c.trainingPlan = { ...defaultTrainingPlan(c), walkMinutes: 20 };
    expect(request(c, "u-walk-20").description).toContain("20 minutes");
    expect(request(c, "u-walk-20").xp).toBe(37);
    c.baseline.assessment!.pullups = 12;
    c.baseline.assessment!.balanceSeconds = 35;
    c.assessmentHistory = [];
    const pull = groupRequests(objectives(c)).find((g) =>
      g.variants.some((o) => o.id === "u-pullup-3"),
    )!;
    const balance = groupRequests(objectives(c)).find((g) =>
      g.variants.some((o) => o.id === "u-balance-practice"),
    )!;
    expect(recommendedRequest(c, pull.variants).rank).toBe("C");
    expect(recommendedRequest(c, balance.variants).rank).toBe("D");
  });
  it("uses assessed chair and bar work to suggest relevant setups without inferring hip or core mastery", () => {
    const c = actor();
    c.assessmentHistory = [];
    c.baseline.assessment = {
      ...EMPTY_ASSESSMENT,
      strengthTest: "chair",
      chairStands: 28,
      chairAssisted: false,
      pullups: 12,
    };
    c.preferences!.equipment.push("pullup-bar");
    const p = personalizedWorkout(c, "E", "A", "home");
    expect(p.exercises.find((e) => e.id === "squat")!.name).not.toContain(
      "chair",
    );
    expect(p.exercises.find((e) => e.id === "row")!.name).toBe(
      "Slow-tempo strict pullup",
    );
    expect(p.calibration?.levels?.hinge).toBeUndefined();
    expect(p.calibration?.levels?.core).toBeUndefined();
    expect(validWorkoutPrescription(p)).toBe(true);
    expect(JSON.parse(canonicalWorkout(p))).toEqual(p);
    expect(request(c, "regimen-a-e").equipment).toBe("pullup-bar");
    const taken = takeRequest(c, "regimen-a-e");
    expect(validateCharacter(taken)).toBe(true);
    expect(
      takenObjectives(taken).find((o) => o.id === "regimen-a-e")?.workout,
    ).toEqual(p);
    c.preferences!.equipment = c.preferences!.equipment.filter(
      (e) => e !== "pullup-bar",
    );
    expect(
      personalizedWorkout(c, "E", "A", "home").calibration?.pullLevel,
    ).toBeUndefined();
  });
});

it("checks trade/hospitality profession progress with actual work samples rather than a fitness proxy", () => {
  let c = actor();
  c.profession = "Chef";
  c.completions = Array.from({ length: 15 }, (_, i) => ({
    id: "profession-daily",
    at: day(i - 20).toISOString(),
    period: `fixture-${i}`,
    xp: 150,
    title: "Profession work",
    classId: "scholar",
    stat: "DEX",
    scope: "profession",
    profession: "Chef",
    cadence: "daily",
    rank: "C",
  }));
  const t = examTargets(c).find(
    (t) => t.scope === "profession" && t.owner === "Chef",
  )!;
  expect(t.stat).toBe("DEX");
  expect(t.ready).toBe(true);
  const note =
    "Fictional service planning, same ten-minute case type and four-part hospitality rubric v1";
  c = submitFitnessExam(c, t, workProtocolId(t.stat, note), 10, note, day());
  expect(c.exams!.at(-1)!.status).toBe("baseline");
  c = submitFitnessExam(c, t, workProtocolId(t.stat, note), 11, note, day(2));
  expect(c.exams!.at(-1)!.status).toBe("passed");
  expect(professionLevel(c, "Chef")).toBeGreaterThanOrEqual(5);
  expect(validateCharacter(c)).toBe(true);
});
