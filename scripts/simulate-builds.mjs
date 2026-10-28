import { createServer } from "vite";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
process.env.TZ = "America/Denver";
const NativeDate = Date,
  fixedClock = new NativeDate(2027, 1, 1, 12).getTime();
globalThis.Date = class extends NativeDate {
  constructor(...args) {
    super(...(args.length ? args : [fixedClock]));
  }
  static now() {
    return fixedClock;
  }
};
const root = resolve(process.argv[2] || "."),
  phase = process.argv[3] || "current";
const server = await createServer({
  root,
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { simulateBuild } = await server.ssrLoadModule(
      "/src/build-simulation.ts",
    ),
    { CLASSES } = await server.ssrLoadModule("/src/domain.ts");
  const matrix = [];
  for (const cls of CLASSES)
    for (const focus of [30, 100])
      for (const encounter of [
        "mossfall-boss",
        "ruins-boss",
        "mossfall-hunt-2",
        "frost-hunt-2",
      ])
        for (const loadout of ["signature", "shared", "focus"])
          for (const party of ["solo", "trio"])
            matrix.push({
              group: "classes",
              classId: cls.id,
              focus,
              encounter,
              loadout,
              party,
            });
  for (const classId of ["warrior", "monk", "berserker", "knight"])
    for (const focus of [30, 100])
      for (const encounter of [
        "mossfall-boss",
        "ruins-boss",
        "mossfall-hunt-2",
      ])
        for (const loadout of ["sword", "spear", "axe", "unarmed"])
          for (const party of ["solo", "trio"])
            matrix.push({
              group: "martial",
              classId,
              focus,
              encounter,
              loadout,
              party,
            });
  if (phase === "current")
    for (const classId of [
      "scholar",
      "elementalist",
      "archmage",
      "astral-savant",
    ])
      for (const focus of [30, 100])
        for (const encounter of [
          "mossfall-hunt-2",
          "ruins-hunt-2",
          "frost-hunt-2",
        ])
          for (const loadout of ["fire", "ice", "storm"])
            for (const party of ["solo", "trio"])
              matrix.push({
                group: "elements",
                classId,
                focus,
                encounter,
                loadout,
                party,
              });
  const results = [];
  for (const o of matrix) {
    results.push({ group: o.group, ...simulateBuild(o) });
    if (results.length % 300 === 0)
      console.log(phase, results.length, "/", matrix.length);
  }
  const sourceHashes = {};
  for (const f of [
    "src/rpg.ts",
    "src/class-catalog.ts",
    "src/class-roles.ts",
    "src/skill-catalog.ts",
    "src/expanded-skills.ts",
    "src/combat-progression.ts",
    "src/build-simulation.ts",
    "src/enemy-tactics.ts",
    "src/world-catalog.ts",
    ...(phase === "current" ? ["src/combat-identity.ts"] : []),
  ])
    sourceHashes[f] = createHash("sha256")
      .update(await readFile(resolve(root, f)))
      .digest("hex");
  await mkdir("docs/builds-1.24", { recursive: true });
  await writeFile(
    `docs/builds-1.24/${phase}.json`,
    JSON.stringify(
      {
        phase,
        timezone: "America/Denver",
        fixtureNote:
          "Independent synthetic level-10 player snapshots, no earned-account or acquisition simulation; no supplies; starter gear",
        sourceHashes,
        count: results.length,
        results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
      phase,
      count: results.length,
      wins: results.filter((r) => r.phase === "won").length,
      losses: results.filter((r) => r.phase === "lost").length,
      bounded: results.filter((r) => r.phase === "player").length,
    }),
  );
} finally {
  await server.close();
  globalThis.Date = NativeDate;
}
