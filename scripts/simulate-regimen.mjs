import { createServer } from "vite";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
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
try {
  const d = await server.ssrLoadModule("/src/domain.ts"),
    m = await server.ssrLoadModule("/src/metrics.ts"),
    r = await server.ssrLoadModule("/src/rpg.ts"),
    a = await server.ssrLoadModule("/src/activity-results.ts"),
    v = await server.ssrLoadModule("/src/storage.ts"),
    t = await server.ssrLoadModule("/src/training-regimen.ts");
  const runs = [];
  for (const rank of ["F", "E", "D", "C"])
    for (const environment of ["home", "weights", "gym"])
      for (const credit of ["class", "universal"]) {
        time = new NativeDate(2027, 1, 1, 12).getTime();
        let c = d.createCharacter(
          "Regimen ledger fixture",
          { ...d.EMPTY_BASELINE, assessment: { ...m.EMPTY_ASSESSMENT } },
          "warrior",
          "Analyst",
        );
        c.trainingPlan = {
          version: 1,
          rank,
          environment,
          startedOn: "2027-02-01",
          walkMinutes: rank === "F" ? 5 : rank === "E" ? 15 : 30,
        };
        if (environment !== "home")
          c.preferences.equipment.push(
            environment === "gym" ? "gym" : "weights",
          );
        const base = JSON.stringify(d.stats(c)),
          history = [];
        let blockedDuplicates = 0;
        const get = (id) => d.objectives(c).find((o) => o.id === id);
        const finish = (id, now, result) => {
          const o = d.takenObjectives(c, now).find((o) => o.id === id);
          if (
            !o ||
            d.isComplete(c, o, now) ||
            d.taskRequirements(c, o, now).length
          )
            return false;
          if (o.checklist)
            c = {
              ...c,
              milestones: {
                ...c.milestones,
                [`${id}:${d.objectivePeriod(o, now)}`]: o.checklist.map(
                  (_, i) => i,
                ),
              },
            };
          const next = a.completeWithResult(c, o, result, now);
          if (next === c) return false;
          c = next;
          return true;
        };
        for (let day = 0; day < 60; day++) {
          const now = new NativeDate(2027, 1, 1 + day, 12);
          time = now.getTime();
          for (const cadence of ["weekly", "monthly"])
            c = d.takeRequest(
              c,
              `regimen-${cadence}-${rank.toLowerCase()}`,
              now,
            );
          const offset = day % 7;
          if (offset === 0 || offset === 3) {
            const type = offset === 0 ? "a" : "b",
              id =
                credit === "class"
                  ? "warrior-daily"
                  : `regimen-${type}-${rank.toLowerCase()}`;
            c = d.takeRequest(c, id, now);
            const o = d.takenObjectives(c, now).find((o) => o.id === id);
            if (!o?.workout) throw Error("Missing accepted workout");
            const p = o.workout,
              result = {
                workout: {
                  prescription: p,
                  exercises: p.exercises.map((e) => ({
                    id: e.id,
                    variation: e.name,
                    reps: Array.from({ length: e.sets }, () => e.max),
                    rir: 3,
                    ...(e.load ? { loadKg: 10 } : {}),
                  })),
                },
              };
            if (!finish(id, now, result))
              throw Error("Planned session could not complete");
            const xp = d.totalXP(c),
              gold = r.campaign(c).gold;
            if (a.completeWithResult(c, o, result, now) !== c)
              throw Error("Duplicate paid");
            if (
              d.takeRequest(
                c,
                `regimen-${type === "a" ? "b" : "a"}-${rank.toLowerCase()}`,
                now,
              ) !== c
            )
              throw Error("Recovery bypass");
            if (d.totalXP(c) !== xp || r.campaign(c).gold !== gold)
              throw Error("Duplicate changed rewards");
            blockedDuplicates++;
          }
          if ([0, 1, 2, 4, 5].includes(offset)) {
            const id =
              rank === "F"
                ? "u-walk-5"
                : rank === "E"
                  ? "u-walk-15"
                  : "u-walk-brisk";
            c = d.takeRequest(c, id, now);
            if (
              !finish(id, now, {
                exercise: rank === "F" ? "Comfortable walk" : "Walking block",
                minutes: c.trainingPlan.walkMinutes,
              })
            )
              throw Error("Walking blocked by strength");
          }
          for (const cadence of ["weekly", "monthly"])
            finish(`regimen-${cadence}-${rank.toLowerCase()}`, now);
          c = { ...c, campaign: r.campaign(c) };
          const saved = JSON.parse(JSON.stringify(c));
          if (!v.validateCharacter(saved))
            throw Error(`Invalid day ${day + 1}`);
          c = saved;
          const earned = c.completions.reduce((n, x) => n + (x.gold || 0), 0);
          if (r.campaign(c).gold !== earned) throw Error("Unreconciled gold");
          if (JSON.stringify(d.stats(c)) !== base)
            throw Error("Unexpected base-stat reward without exams");
          history.push({
            day: day + 1,
            at: now.toISOString(),
            xp: d.totalXP(c),
            gold: r.campaign(c).gold,
            rank: d.characterRank(c).name,
            playerLevel: d.level(d.adventurerXP(c)),
            strengthDays: c.completions.filter((x) => x.workout).length,
            weekly: c.completions.filter((x) => x.cadence === "weekly").length,
            monthly: c.completions.filter((x) => x.cadence === "monthly")
              .length,
          });
        }
        const end = history.at(-1);
        if (end.strengthDays !== 18 || end.weekly !== 9 || end.monthly !== 2)
          throw Error("Wrong cadence counts");
        runs.push({
          rank,
          environment,
          credit,
          days: 60,
          blockedDuplicates,
          history,
          day7: history[6],
          day30: history[29],
          day60: end,
          baseStats: d.stats(c),
          rankReview: t.planProgress(c, c.trainingPlan),
        });
        console.log(
          JSON.stringify({ trainingRank: rank, environment, credit, ...end }),
        );
      }
  const sourceHashes = {};
  for (const f of [
    "src/class-practice.ts",
    "src/training-prescriptions.ts",
    "src/training-regimen.ts",
    "src/training-tasks.ts",
    "src/training-guidance.ts",
    "src/domain.ts",
    "src/adventure-requests.ts",
    "src/calendar-goals.ts",
    "src/activity-results.ts",
    "src/storage.ts",
    "src/request-balance.ts",
  ])
    sourceHashes[f] = createHash("sha256")
      .update(await readFile(f))
      .digest("hex");
  await mkdir("docs/training-1.25", { recursive: true });
  await writeFile(
    "docs/training-1.25/ledger-results.json",
    JSON.stringify(
      {
        note: "Scripted completion logs to verify ledger/calendar/progression rules. Top-range reps, RIR and loads are supplied inputs, not predicted or observed physiological gains.",
        timezone: "America/Denver",
        sourceHashes,
        count: runs.length,
        accountDays: runs.length * 60,
        runs,
      },
      null,
      2,
    ) + "\n",
  );
  await writeFile(
    "docs/training-1.25/checkpoints.csv",
    "training_rank,environment,credit,day,player_xp,gold,guild_rank,player_level,strength_days,weekly_goals,monthly_goals\n" +
      runs
        .flatMap((run) =>
          [7, 30, 60].map((day) => {
            const x = run.history[day - 1];
            return [
              run.rank,
              run.environment,
              run.credit,
              day,
              x.xp,
              x.gold,
              x.rank,
              x.playerLevel,
              x.strengthDays,
              x.weekly,
              x.monthly,
            ].join(",");
          }),
        )
        .join("\n") +
      "\n",
  );
  console.log(
    JSON.stringify({
      accounts: runs.length,
      accountDays: runs.length * 60,
      workouts: runs.reduce((n, x) => n + x.day60.strengthDays, 0),
      duplicateAttemptsBlocked: runs.reduce(
        (n, x) => n + x.blockedDuplicates,
        0,
      ),
    }),
  );
} finally {
  await server.close();
  globalThis.Date = NativeDate;
}
