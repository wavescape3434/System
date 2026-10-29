import { createServer } from "vite";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
process.env.TZ = "America/Denver";
const NativeDate = Date;
let time = new NativeDate(2027, 1, 1, 12).getTime();
globalThis.Date = class extends NativeDate {
  constructor(...args) {
    super(...(args.length ? args : [time]));
  }
  static now() {
    return time;
  }
};
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
const out = "docs/adaptive-1.27";
await mkdir(out, { recursive: true });
try {
  const d = await server.ssrLoadModule("/src/domain.ts"),
    m = await server.ssrLoadModule("/src/metrics.ts"),
    a = await server.ssrLoadModule("/src/adaptive-ability.ts"),
    p = await server.ssrLoadModule("/src/proficiency.ts"),
    r = await server.ssrLoadModule("/src/activity-results.ts"),
    s = await server.ssrLoadModule("/src/storage.ts"),
    careers = await server.ssrLoadModule("/src/careers.ts"),
    g = await server.ssrLoadModule("/src/objective-catalog.ts"),
    t = await server.ssrLoadModule("/src/training-regimen.ts");
  const specs = [
    ...careers.CAREER_CATEGORIES.map((e) => ({
      kind: "profession",
      id: e.id,
      name: e.name,
      role: d.PROFESSIONS.find(
        (role) => careers.careerCategory(role).id === e.id,
      ),
      request: "profession-daily",
    })),
    ...careers.VOCATIONS.map((e) => ({
      kind: "vocation",
      id: e.id,
      name: e.name,
      role: "Teacher",
      vocation: e.id,
      request: `vocation-${e.id}-daily`,
    })),
    ...[
      "u-spaced-recall",
      "practice-language-d",
      "practice-writing-d",
      "practice-context-d",
      "practice-reflection-d",
      "practice-speech-d",
      "practice-hands-d",
      "practice-footwork-d",
      "practice-cycling-d",
      "practice-stairs-d",
    ].map((id) => ({
      kind: "universal",
      id,
      name: id,
      role: "Teacher",
      request: id,
    })),
  ];
  const runs = [];
  let saves = 0,
    duplicates = 0;
  const rows = [];
  for (const spec of specs)
    for (const scenario of ["experienced", "rebuilding"]) {
      time = new NativeDate(2027, 1, 1, 12).getTime();
      let c = d.createCharacter(
        "Declared ability scenario",
        { ...d.EMPTY_BASELINE, assessment: { ...m.EMPTY_ASSESSMENT } },
        "scholar",
        spec.role,
      );
      if (spec.vocation) c.vocation = spec.vocation;
      const initial = d.objectives(c).find((o) => o.id === spec.request);
      assert.ok(initial, spec.request);
      const subject = `${spec.name} specific practice`,
        source = `${spec.id} comparison rubric v1`;
      c = a.recordAbilityCheck(c, initial, {
        level: scenario === "experienced" ? "C" : "D",
        subject,
        source,
        unfamiliar: true,
        independent: true,
        criteriaMet: scenario === "experienced" ? 4 : 1,
        criteriaTotal: 4,
      });
      assert.equal(d.totalXP(c), 0);
      const base = JSON.stringify(d.stats(c)),
        trace = [];
      for (let day = 0; day < 45; day++) {
        time = new NativeDate(2027, 1, 1 + day, 12).getTime();
        const now = new Date();
        const variants = g
          .groupRequests(d.objectives(c))
          .find((group) =>
            group.variants.some((o) => o.id === spec.request),
          ).variants;
        const chosen = p.recommendedRequest(c, variants),
          level = chosen.rank;
        assert.ok(["F", "E", "D", "C"].includes(level));
        const ceiling =
          scenario === "experienced" ? 3 : day >= 30 ? 2 : day >= 15 ? 1 : 0;
        const index = ["F", "E", "D", "C"].indexOf(level);
        const criteriaMet =
          index <= ceiling ? 4 : index === ceiling + 1 ? 3 : 1;
        c = d.takeRequest(c, chosen.id, now);
        const accepted = d
          .takenObjectives(c, now)
          .find((o) => o.id === chosen.id);
        assert.ok(accepted);
        const before = c.completions.length;
        c = r.completeWithResult(
          c,
          accepted,
          {
            topic: subject,
            minutes: { F: 8, E: 15, D: 25, C: 40 }[level],
            practice: {
              subject,
              source,
              level,
              independent: true,
              unfamiliar: true,
              criteriaMet,
              criteriaTotal: 4,
            },
          },
          now,
        );
        assert.equal(c.completions.length, before + 1);
        assert.equal(r.completeWithResult(c, accepted, undefined, now), c);
        duplicates++;
        assert.equal(JSON.stringify(d.stats(c)), base);
        assert.ok(s.validateCharacter(JSON.parse(JSON.stringify(c))));
        saves++;
        const entry = {
          day: day + 1,
          rank: level,
          criteriaMet,
          xp: d.totalXP(c),
          suggestedNext: a.abilityRecommendation(c, initial, subject)?.level,
        };
        trace.push(entry);
        rows.push([spec.kind, spec.id, scenario, ...Object.values(entry)]);
      }
      if (scenario === "experienced")
        assert.ok(trace.every((x) => x.rank === "C"));
      runs.push({
        ...spec,
        scenario,
        initialPlacement: c.abilityChecks[0],
        finalXp: d.totalXP(c),
        retainedStats: d.stats(c),
        checkpoints: [1, 7, 15, 30, 45].map((n) => trace[n - 1]),
        firstWork: a.abilityBrief(initial, trace[0].rank),
        lastWork: a.abilityBrief(initial, trace.at(-1).rank),
        trace,
      });
    }
  const workouts = [];
  for (const environment of ["home", "weights", "gym"])
    for (const scenario of ["progress", "variable-effort"]) {
      time = new NativeDate(2027, 1, 1, 12).getTime();
      let c = d.createCharacter(
        "Movement scenario",
        { ...d.EMPTY_BASELINE, assessment: { ...m.EMPTY_ASSESSMENT } },
        "warrior",
        "Chef",
      );
      if (environment !== "home") c.preferences.equipment.push(environment);
      c.trainingPlan = {
        ...t.defaultTrainingPlan(c),
        rank: "E",
        environment,
        automaticAbility: true,
        movementLevels: { squat: 1, hinge: 1, core: 1 },
      };
      const trace = [];
      for (let day = 0; day < 60; day++) {
        time = new NativeDate(2027, 1, 1 + day, 12).getTime();
        const now = new Date();
        if (![0, 3].includes(day % 7)) continue;
        const id = `regimen-${day % 7 === 0 ? "a" : "b"}-e`;
        c = d.takeRequest(c, id, now);
        const o = d.takenObjectives(c, now).find((o) => o.id === id);
        assert.ok(o);
        const result = {
          workout: {
            prescription: o.workout,
            exercises: o.workout.exercises.map((e) => ({
              id: e.id,
              variation: e.name,
              reps: Array.from({ length: e.sets }, () =>
                scenario === "variable-effort" && day % 2 ? e.min : e.max,
              ),
              rir: scenario === "variable-effort" && day % 2 ? 0 : 3,
              ...(e.load ? { loadKg: e.suggestedLoadKg || 20 } : {}),
            })),
          },
        };
        c = r.completeWithResult(c, o, result, now);
        assert.ok(s.validateCharacter(JSON.parse(JSON.stringify(c))));
        saves++;
        trace.push({
          day: day + 1,
          session: o.workout.session,
          movements: result.workout.exercises.map((e, i) => ({
            id: e.id,
            name: o.workout.exercises[i].name,
            load: e.loadKg,
            reps: e.reps,
            reserve: e.rir,
          })),
        });
      }
      workouts.push({ environment, scenario, sessions: trace.length, trace });
    }
  const hashes = {};
  for (const path of [
    "src/adaptive-ability.ts",
    "src/ability-rubrics.ts",
    "src/proficiency.ts",
    "src/workout-calibration.ts",
    "src/training-prescriptions.ts",
    "src/training-regimen.ts",
    "src/training-tasks.ts",
    "src/domain.ts",
    "src/activity-results.ts",
    "src/storage.ts",
    "scripts/simulate-adaptive-ability.mjs",
  ])
    hashes[path] = createHash("sha256")
      .update(await readFile(path))
      .digest("hex");
  const result = {
    version: "1.27.0",
    assumptions:
      "Fictional declared capability and rubric outcomes; not observed human learning. Experienced samples start at C. Rebuilding scores improve at days 15/30 by scenario assumption. One daily chosen activity, no exam passes, credentials, calendar bonuses or Adventures. Workout fixtures report the selected sets/effort and use actual acceptance/result APIs.",
    contexts: specs.length,
    dailyCases: runs.length,
    dailyAccountDays: runs.length * 45,
    regimenCases: workouts.length,
    regimenAccountDays: workouts.length * 60,
    validatedSaves: saves,
    duplicatesRejected: duplicates,
    sourceSha256: hashes,
    runs,
    workouts,
  };
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(result, null, 2) + "\n",
  );
  await writeFile(
    `${out}/daily.csv`,
    "kind,context,scenario,day,rank,criteria_met,total_xp,next_rank\n" +
      rows.map((r) => r.join(",")).join("\n") +
      "\n",
  );
  console.log(
    JSON.stringify({
      contexts: result.contexts,
      dailyCases: result.dailyCases,
      dailyAccountDays: result.dailyAccountDays,
      regimenCases: result.regimenCases,
      regimenAccountDays: result.regimenAccountDays,
      validatedSaves: saves,
      duplicatesRejected: duplicates,
    }),
  );
} finally {
  await server.close();
  globalThis.Date = NativeDate;
}
