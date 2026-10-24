import { createServer } from "vite";
import { writeFile, mkdir } from "node:fs/promises";
process.env.TZ = "America/Denver";
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { SIMULATION_PROFILES, simulateAccount, simulateEarlyClaims } =
    await server.ssrLoadModule("/src/balance-simulation.ts");
  const { RANKS, objectives } = await server.ssrLoadModule("/src/domain.ts");
  const { requestReward } = await server.ssrLoadModule(
    "/src/request-balance.ts",
  );
  const runs = SIMULATION_PROFILES.map((p) => simulateAccount(p, 30));
  const results = {
    generatedAt: new Date().toISOString(),
    timezone: "America/Denver",
    start: "2027-01-25",
    end: "2027-02-23",
    ranks: RANKS,
    rewards: Object.fromEntries(
      ["daily", "weekly", "monthly"].map((c) => [
        c,
        Object.fromEntries(
          ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"]
            .filter((r, i) => i <= { daily: 3, weekly: 5, monthly: 8 }[c])
            .map((r) => [r, requestReward(r, c)]),
        ),
      ]),
    ),
    earlyClaims: simulateEarlyClaims(),
    accounts: runs.map(({ character, ...data }) => data),
  };
  await mkdir("docs/balance", { recursive: true });
  await writeFile(
    "docs/balance/simulation-results.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  await writeFile(
    "docs/balance/daily-progress.csv",
    "profile,day,xp,gold,rank,player_level,class_level,profession_level,completed\n" +
      runs
        .flatMap((r) =>
          r.history.map((d) =>
            [
              r.profile,
              d.day,
              d.xp,
              d.gold,
              d.rank,
              d.playerLevel,
              d.classLevel,
              d.professionLevel,
              d.completed,
            ].join(","),
          ),
        )
        .join("\n") +
      "\n",
  );
  for (const run of runs)
    await writeFile(
      `docs/balance/account-${run.profile}.json`,
      JSON.stringify(run.character, null, 2) + "\n",
    );
  const sample = runs[0].character,
    catalog = objectives(sample);
  console.log(
    JSON.stringify(
      {
        accounts: results.accounts.map(
          ({ profile, day7, day30, projectedDaysToGold, byCadence }) => ({
            profile,
            day7,
            day30,
            projectedDaysToGold,
            byCadence,
          }),
        ),
        earlyClaims: results.earlyClaims,
        catalog: Object.fromEntries(
          ["daily", "weekly", "monthly"].map((c) => [
            c,
            catalog.filter((o) => o.cadence === c).length,
          ]),
        ),
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}
