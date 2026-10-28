import { createServer } from "vite";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
process.env.TZ = "America/Denver";
const NativeDate = Date;
let clock = new NativeDate(2027, 1, 1, 12).getTime();
globalThis.Date = class extends NativeDate {
  constructor(...args) {
    super(...(args.length ? args : [clock]));
  }
  static now() {
    return clock;
  }
};
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
const smoke = process.argv.includes("--smoke");
try {
  const { simulateEconomy } = await server.ssrLoadModule(
      "/src/economy-simulation.ts",
    ),
    r = await server.ssrLoadModule("/src/rpg.ts"),
    w = await server.ssrLoadModule("/src/workshop.ts"),
    g = await server.ssrLoadModule("/src/equipment-progression.ts"),
    s = await server.ssrLoadModule("/src/supplies.ts"),
    { CLASSES } = await server.ssrLoadModule("/src/domain.ts");
  const workshop = {
    temper: w.temper,
    quote: w.temperQuote,
    brew: w.brew,
    use: r.useSupply,
    modifiers: g.gearModifiers,
    supplies: s.SUPPLIES,
  };
  const matrix = [];
  for (const cls of CLASSES.filter((c) => c.tier === "Basic")) {
    for (const scenario of [
      "daily",
      "calendar-career",
      "calendar-career-hunts",
    ])
      matrix.push({ classId: cls.id, scenario, encounters: 5 });
    matrix.push({
      classId: cls.id,
      scenario: "calendar-career-hunts",
      encounters: 3,
    });
  }
  const runs = [];
  await mkdir("docs/economy-1.24", { recursive: true });
  for (const m of smoke ? matrix.slice(2, 3) : matrix) {
    clock = new NativeDate(2027, 1, 1, 12).getTime();
    const options = {
      classId: m.classId,
      encounters: m.encounters,
      routine: "moderate",
      days: smoke ? 35 : 90,
      seed: 3434,
      statFixture: 10,
      priority: "equipment",
      mode: "campaign",
      calendarCareer: m.scenario !== "daily",
      ...(m.scenario.endsWith("hunts") ? { huntGrade: 2 } : {}),
    };
    const result = simulateEconomy(
      options,
      (d) => {
        clock = d.getTime();
      },
      r.useSupply,
      workshop,
    );
    const { character, ...run } = result;
    const completionCounts = Object.fromEntries(
      ["daily", "weekly", "monthly"].map((cadence) => [
        cadence,
        character.completions.filter((o) => o.cadence === cadence).length,
      ]),
    );
    const calendarReceipts = character.completions
      .filter((o) => /^(habit-|vocation-)/.test(o.id))
      .map(({ id, at, xp, gold }) => ({ id, at, xp, gold }));
    const entry = {
      scenario: m.scenario,
      ...run,
      completionCounts,
      calendarReceipts,
    };
    runs.push(entry);
    console.log(
      JSON.stringify({
        n: runs.length,
        scenario: m.scenario,
        options,
        gold: run.gold,
        wins: run.wins,
        losses: run.losses,
        limits: run.roundLimit,
        income: run.income,
        requestIncome: run.requestIncome,
        spent: run.spent,
        itemsUsed: run.itemsUsed,
      }),
    );
    if (
      !smoke &&
      ["warrior", "scholar", "bard"].includes(m.classId) &&
      m.scenario === "calendar-career-hunts" &&
      m.encounters === 5
    )
      await writeFile(
        `docs/economy-1.24/account-${m.classId}.json`,
        JSON.stringify(character, null, 2) + "\n",
      );
  }
  const sourceHashes = {};
  for (const file of [
    "src/economy-simulation.ts",
    "src/rpg.ts",
    "src/world.ts",
    "src/world-catalog.ts",
    "src/combat-identity.ts",
    "src/domain.ts",
    "src/skill-catalog.ts",
    "src/expanded-skills.ts",
    "src/combat-progression.ts",
    "src/class-catalog.ts",
    "src/class-roles.ts",
    "src/training-tasks.ts",
    "src/calendar-goals.ts",
    "src/adventure-requests.ts",
    "src/request-balance.ts",
    "src/login-rewards.ts",
    "src/workshop.ts",
    "src/equipment-progression.ts",
    "src/supplies.ts",
  ])
    sourceHashes[file] = createHash("sha256")
      .update(await readFile(file))
      .digest("hex");
  await writeFile(
    `docs/economy-1.24/${smoke ? "smoke" : "results"}.json`,
    JSON.stringify(
      {
        timezone: "America/Denver",
        start: "2027-02-01 local noon",
        sourceHashes,
        note: "Modeled reported work; no fabricated exam passes, certifications or class promotions. Purchases/materials use actual transactions. No supplies preloaded beyond new-character inventory and claimed logins.",
        runs,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await server.close();
  globalThis.Date = NativeDate;
}
