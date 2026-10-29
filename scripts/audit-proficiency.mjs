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
const out = "docs/proficiency-1.26";
await mkdir(out, { recursive: true });
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const d = await server.ssrLoadModule("/src/domain.ts"),
    m = await server.ssrLoadModule("/src/metrics.ts"),
    p = await server.ssrLoadModule("/src/proficiency.ts"),
    t = await server.ssrLoadModule("/src/training-regimen.ts"),
    a = await server.ssrLoadModule("/src/activity-results.ts"),
    c = await server.ssrLoadModule("/src/careers.ts"),
    s = await server.ssrLoadModule("/src/storage.ts"),
    groups = await server.ssrLoadModule("/src/objective-catalog.ts");
  const runs = [];
  let duplicatesRejected = 0,
    roundtrips = 0;
  for (const kind of ["profession", "vocation"])
    for (const entry of kind === "profession"
      ? c.CAREER_CATEGORIES
      : c.VOCATIONS)
      for (const rank of ["F", "C"]) {
        time = new NativeDate(2027, 1, 1, 12).getTime();
        const role =
          kind === "profession"
            ? d.PROFESSIONS.find(
                (name) => c.careerCategory(name).id === entry.id,
              )
            : "Registered Nurse";
        let actor = d.createCharacter(
          "Scripted proficiency ledger",
          { ...d.EMPTY_BASELINE, assessment: { ...m.EMPTY_ASSESSMENT } },
          "scholar",
          role,
        );
        if (kind === "vocation") actor.vocation = entry.id;
        const base = JSON.stringify(d.stats(actor));
        const baseId =
          kind === "profession"
            ? "profession-daily"
            : `vocation-${entry.id}-daily`;
        const original = d.objectives(actor).find((o) => o.id === baseId);
        const key = p.proficiencyKey(actor, original),
          topic = `${entry.name} independent sample`;
        actor.proficiencies = {
          [key]: {
            rank,
            topic,
            criterion:
              "Check an unfamiliar fictional example against a named, unchanged source and rubric",
            reviewedAt: new Date().toISOString(),
          },
        };
        const examples = [];
        for (let day = 0; day < 30; day++) {
          time = new NativeDate(2027, 1, 1 + day, 12).getTime();
          const now = new Date();
          const variants = groups
            .groupRequests(d.objectives(actor))
            .find((g) => g.variants.some((o) => o.id === baseId)).variants;
          const chosen = p.recommendedRequest(actor, variants);
          assert.equal(chosen.rank, rank);
          if (day === 0)
            examples.push(
              ...variants.map((o) => ({
                rank: o.rank,
                id: o.id,
                xp: o.xp,
                gold: o.gold,
                minutes: o.minutes,
                description: o.description,
              })),
            );
          actor = d.takeRequest(actor, chosen.id, now);
          const accepted = d
            .takenObjectives(actor, now)
            .find((o) => o.id === chosen.id);
          assert.ok(accepted);
          const before = actor.completions.length;
          actor = a.completeWithResult(
            actor,
            accepted,
            {
              topic,
              attempted: 10,
              correct: 8,
              minutes: rank === "F" ? 8 : 40,
              output:
                "Scripted ledger result only; no observed human work or improvement",
            },
            now,
          );
          assert.equal(actor.completions.length, before + 1);
          const same = a.completeWithResult(
            actor,
            accepted,
            { topic, attempted: 10, correct: 8 },
            now,
          );
          assert.equal(same, actor);
          duplicatesRejected++;
          assert.equal(JSON.stringify(d.stats(actor)), base); // no exams or special rewards in these routines
          assert.ok(s.validateCharacter(JSON.parse(JSON.stringify(actor))));
          roundtrips++;
        }
        runs.push({
          kind,
          category: entry.id,
          name: entry.name,
          profession: role,
          vocation: actor.vocation,
          chosenRank: rank,
          completions: actor.completions.length,
          xp: d.totalXP(actor),
          professionLevel: d.professionLevel(actor),
          vocationLevel: d.vocationLevel(actor),
          feedback: p.proficiencyFeedback(actor, original),
          examples,
        });
      }
  const physical = [];
  for (const max of [0, 4, 12, 20, 35, 60]) {
    const actor = d.createCharacter(
      "Push capacity fixture",
      {
        ...d.EMPTY_BASELINE,
        assessment: { ...m.EMPTY_ASSESSMENT, pushups: max },
      },
      "warrior",
      "Baker",
    );
    const choices = d
        .objectives(actor)
        .filter((o) => o.family === "u-push" && o.cadence === "daily"),
      chosen = p.recommendedRequest(actor, choices);
    physical.push({
      floorPushupMax: max,
      suggestedPushLevel: t.assessedPushLevel(actor),
      boardRank: chosen.rank,
      boardWork: chosen.description,
      regimen: t.regimenRequests(actor).map((o) => ({
        rank: o.rank,
        session: o.workout.session,
        push: o.workout.exercises.find((e) => e.id === "push"),
      })),
    });
  }
  const sources = {};
  for (const path of [
    "src/proficiency.ts",
    "src/ability-checks.ts",
    "src/training-prescriptions.ts",
    "src/training-regimen.ts",
    "src/training-tasks.ts",
    "src/metrics.ts",
    "scripts/audit-proficiency.mjs",
  ])
    sources[path] = createHash("sha256")
      .update(await readFile(path))
      .digest("hex");
  const result = {
    version: "1.26.0",
    assumptions:
      "Ninety fictional 30-day ledger cases with declared F/C subject proficiency, source and 8/10 check results. Continuous daily attendance; no exams, weekly/monthly or Adventures. Software verification only. No claim of learning, fitness efficacy or year-long balance.",
    cases: runs.length,
    accountDays: runs.length * 30,
    duplicatesRejected,
    roundtrips,
    sources,
    runs,
    physical,
  };
  await writeFile(
    `${out}/ledger-results.json`,
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      cases: result.cases,
      accountDays: result.accountDays,
      duplicatesRejected,
      roundtrips,
      physicalCases: physical.length,
    }),
  );
} finally {
  await server.close();
  globalThis.Date = NativeDate;
}
