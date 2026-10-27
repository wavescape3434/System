import { createServer } from "vite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { simulateHunt } = await server.ssrLoadModule(
      "/src/hunt-simulation.ts",
    ),
    { CLASSES } = await server.ssrLoadModule("/src/domain.ts"),
    { WORLD_REGIONS } = await server.ssrLoadModule("/src/world-catalog.ts"),
    matrix = [];
  const basic = CLASSES.filter((p) => p.tier === "Basic").map((p) => p.id);
  for (const classId of basic)
    for (const base of [10, 30, 100])
      for (const grade of [1, 2, 3, 4])
        for (const style of ["attack", "tactical"])
          for (const party of ["solo", "trio"])
            for (const supplies of [false, true])
              matrix.push({
                classId,
                base,
                grade,
                style,
                party,
                supplies,
                region: "mossfall",
                playerLevel: 1,
              });
  for (const r of WORLD_REGIONS.slice(1))
    for (const classId of ["warrior", "scholar", "bard"])
      for (const base of [10, 30, 100])
        for (const grade of [1, 2, 3, 4])
          for (const supplies of [false, true])
            matrix.push({
              classId,
              base,
              grade,
              style: "tactical",
              party: "trio",
              supplies,
              region: r.id,
              playerLevel: 1,
            });
  for (const classId of ["warrior", "scholar", "bard"])
    for (const playerLevel of [1, 10, 30, 100])
      for (const party of ["solo", "mira", "trio"])
        for (const grade of [1, 2, 3, 4])
          matrix.push({
            classId,
            base: 10,
            grade,
            style: "tactical",
            party,
            supplies: false,
            region: "mossfall",
            playerLevel,
            group: "companion",
          });
  for (const classId of basic)
    for (const base of [30, 100])
      for (const grade of [1, 2, 3, 4])
        for (const supplies of [false, true])
          matrix.push({
            classId,
            base,
            grade,
            style: "tactical",
            party: "trio",
            supplies,
            region: "mossfall",
            playerLevel: 1,
            learned: true,
            group: "learned",
          });
  for (const classId of ["warrior", "scholar", "bard"])
    for (const grade of [1, 2, 3, 4])
      for (const learned of [false, true])
        matrix.push({
          classId,
          base: 100,
          grade,
          style: "tactical",
          party: "trio",
          supplies: true,
          region: "mossfall",
          playerLevel: 1,
          focused: true,
          learned,
          group: "focused",
        });
  const results = [];
  for (const o of matrix) {
    results.push(simulateHunt(o));
    if (results.length % 100 === 0)
      console.log("Completed", results.length, "/", matrix.length);
  }
  const hashes = {};
  for (const file of [
    "src/rpg.ts",
    "src/enemy-tactics.ts",
    "src/world-catalog.ts",
    "src/world-state.ts",
    "src/hunt-simulation.ts",
    "src/supplies.ts",
    "src/companion-tactics.ts",
  ])
    hashes[file] = createHash("sha256")
      .update(await readFile(file))
      .digest("hex");
  await mkdir("docs/hunts-1.23", { recursive: true });
  await writeFile(
    "docs/hunts-1.23/results.json",
    JSON.stringify(
      {
        timezone: "America/Denver",
        fixtureNote:
          "Synthetic combat snapshots, not earned accounts or adherence simulations",
        sourceHashes: hashes,
        count: results.length,
        results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
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
