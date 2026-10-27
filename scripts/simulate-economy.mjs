import { createServer } from "vite";
import {
  mkdir,
  writeFile,
  readFile,
  mkdtemp,
  cp,
  symlink,
  rm,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
process.env.TZ = "America/Denver";
const workshopPass = process.argv.includes("--workshop");
const baseline = process.argv.includes("--baseline"),
  phase = baseline ? "baseline" : "candidate",
  baseCommit = workshopPass
    ? "f1d3ad850c91896c829831c9f7b53e048296c44f"
    : "76d9167dc198df8758f038b474cd64a4c3524007",
  cwd = process.cwd(),
  RealDate = Date;
let clock = new RealDate(2027, 1, 1, 12).getTime(),
  scratch;
class FixtureDate extends RealDate {
  constructor(...args) {
    super(...(args.length ? args : [clock]));
  }
  static now() {
    return clock;
  }
}
globalThis.Date = FixtureDate;
let server;
try {
  let root = cwd;
  if (baseline) {
    scratch = await mkdtemp("/tmp/guild-economy-");
    root = scratch;
    const archive = execFileSync(
      "git",
      [
        "archive",
        baseCommit,
        "src",
        "package.json",
        "tsconfig.json",
        "vite.config.ts",
      ],
      { maxBuffer: 16 * 1024 * 1024 },
    );
    execFileSync("tar", ["-x", "-C", root], { input: archive });
    await cp(
      resolve(cwd, "src/economy-simulation.ts"),
      resolve(root, "src/economy-simulation.ts"),
    );
    await symlink(
      resolve(cwd, "node_modules"),
      resolve(root, "node_modules"),
      "dir",
    );
  }
  server = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "custom",
  });
  const { simulateEconomy } = await server.ssrLoadModule(
      "/src/economy-simulation.ts",
    ),
    { CLASSES } = await server.ssrLoadModule("/src/domain.ts"),
    api = await server.ssrLoadModule("/src/rpg.ts");
  let workshop;
  if (workshopPass && !baseline) {
    const w = await server.ssrLoadModule("/src/workshop.ts"),
      g = await server.ssrLoadModule("/src/equipment-progression.ts"),
      s = await server.ssrLoadModule("/src/supplies.ts");
    workshop = {
      temper: w.temper,
      quote: w.temperQuote,
      brew: w.brew,
      use: api.useSupply,
      modifiers: g.gearModifiers,
      supplies: s.SUPPLIES,
    };
  }
  const runs = [],
    matrix = [];
  for (const cls of CLASSES.filter((c) => c.tier === "Basic"))
    for (const routine of ["login", "moderate"])
      for (const priority of ["commissions", "equipment"])
        for (const encounters of [3, 5])
          matrix.push({
            classId: cls.id,
            routine,
            priority,
            encounters,
            seed: 3434,
            statFixture: 10,
            mode: "campaign",
          });
  for (const classId of ["warrior", "scholar", "bard"])
    for (const statFixture of [30, 100])
      for (const mode of ["campaign", "exploration"])
        matrix.push({
          classId,
          routine: "moderate",
          priority: "equipment",
          encounters: 5,
          seed: 3434,
          statFixture,
          mode,
        });
  for (const classId of ["warrior", "bard"])
    for (const seed of [13, 89])
      matrix.push({
        classId,
        routine: "moderate",
        priority: "equipment",
        encounters: 5,
        seed,
        statFixture: 10,
        mode: "exploration",
      });
  for (const options of matrix) {
    clock = new RealDate(2027, 1, 1, 12).getTime();
    const run = simulateEconomy(
      { ...options, days: 30 },
      (now) => {
        clock = now.getTime();
      },
      !baseline || workshopPass ? api.useSupply : undefined,
      workshop,
    );
    runs.push(run);
    console.log(
      JSON.stringify({
        options,
        gold: run.gold,
        wins: run.wins,
        losses: run.losses,
        stockBlocks: run.stockBlocks,
        day7: run.day7.cleared,
        day30: run.day30.cleared,
        income: run.income,
        spent: run.spent,
      }),
    );
  }
  const out = resolve(
    cwd,
    workshopPass ? "docs/economy-1.22" : "docs/economy-1.21",
    phase,
  );
  await mkdir(out, { recursive: true });
  const sourceHashes = {};
  for (const file of [
    "src/rpg.ts",
    "src/world.ts",
    "src/world-catalog.ts",
    "src/login-rewards.ts",
    "src/economy-simulation.ts",
    ...(workshopPass && !baseline
      ? ["src/workshop.ts", "src/equipment-progression.ts", "src/supplies.ts"]
      : []),
  ])
    sourceHashes[file] = createHash("sha256")
      .update(await readFile(resolve(root, file)))
      .digest("hex");
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(
      {
        phase,
        baselineCommit: baseCommit,
        timezone: "America/Denver",
        manualSupplyPolicy: !baseline || workshopPass,
        workshopPolicy: !!workshop,
        encounterBudgets: [3, 5],
        sourceHashes,
        runs: runs.map(({ character, ...r }) => r),
      },
      null,
      2,
    ) + "\n",
  );
  for (const run of runs.filter(
    (r) =>
      ["warrior", "bard", "scholar"].includes(r.options.classId) &&
      r.options.routine === "moderate" &&
      r.options.encounters === 5 &&
      r.options.priority === "equipment" &&
      r.options.statFixture === 10 &&
      r.options.mode === "campaign",
  ))
    await writeFile(
      `${out}/account-${run.options.classId}.json`,
      JSON.stringify(run.character, null, 2) + "\n",
    );
} finally {
  if (server) await server.close();
  if (scratch) await rm(scratch, { recursive: true, force: true });
  globalThis.Date = RealDate;
}
