import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createServer } from "vite";
import { PROFILES, CONTROLS } from "./persona-profiles.mjs";
const dir = "docs/personas-1.25";
const fromSingle = process.argv.includes("--from-single");
const batches = fromSingle
  ? [JSON.parse(await readFile(`${dir}/results.json`, "utf8"))]
  : await Promise.all(
      [0, 1, 2, 3].map((i) =>
        readFile(`${dir}/results-batch-${i}.json`, "utf8").then(JSON.parse),
      ),
    );
const base = batches[0],
  hashes = JSON.stringify(base.sourceHashes);
for (const batch of batches)
  if (JSON.stringify(batch.sourceHashes) !== hashes)
    throw Error("Batches used different code");
for (const [file, hash] of Object.entries(base.sourceHashes))
  if (
    createHash("sha256")
      .update(await readFile(file))
      .digest("hex") !== hash
  )
    throw Error(`Source changed: ${file}`);
const order = [...PROFILES.map((p) => p.id), ...CONTROLS.map((p) => p.id)],
  runs = batches
    .flatMap((x) => x.runs)
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
if (
  runs.length !== 35 ||
  new Set(runs.map((x) => x.id)).size !== 35 ||
  runs.some((x) => x.days !== 365) ||
  runs.some((x) => x.combat.bounds)
)
  throw Error("Incomplete study or bounded combat");
const signatures = new Set(runs.map((r) => r.signature));
if (signatures.size !== 1) throw Error("Case fingerprints differ");
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const k = await server.ssrLoadModule("/src/careers.ts"),
    d = await server.ssrLoadModule("/src/domain.ts");
  const coverage = {
    customers: PROFILES.length,
    distinctStartingProfessions: new Set(PROFILES.map((p) => p.profession))
      .size,
    professionCategories: [
      ...new Set(PROFILES.map((p) => k.careerCategory(p.profession).id)),
    ],
    vocations: [...new Set(PROFILES.map((p) => p.vocation))],
    startingClasses: [
      ...new Set(
        runs
          .filter((x) => x.variant === "primary")
          .map((x) => x.initial.classId),
      ),
    ],
    classesUsed: [
      ...new Set(runs.flatMap((r) => r.classHistory.map((x) => x.id))),
    ],
    careerUtilities: [
      ...new Set(runs.flatMap((r) => r.utilities.map((x) => x.category))),
    ],
  };
  if (
    coverage.professionCategories.length !== 20 ||
    coverage.vocations.length !== 25
  )
    throw Error("Incomplete career coverage");
  const csvs = fromSingle
    ? [await readFile(`${dir}/daily-progress.csv`, "utf8")]
    : await Promise.all(
        [0, 1, 2, 3].map((i) =>
          readFile(`${dir}/daily-batch-${i}.csv`, "utf8"),
        ),
      );
  const header = csvs[0].split("\n")[0];
  const daily = csvs
    .flatMap((t) => t.trim().split("\n").slice(1))
    .sort((a, b) => {
      const x = a.split(","),
        y = b.split(",");
      return (
        order.indexOf(x[0]) - order.indexOf(y[0]) || Number(x[1]) - Number(y[1])
      );
    });
  if (daily.length !== 12775) throw Error("Wrong account-days");
  for (const r of runs) {
    const income = Object.values(r.income).reduce((n, x) => n + x, 0),
      spent = Object.values(r.spent).reduce((n, x) => n + x, 0);
    if (r.final.gold !== income - spent) throw Error("Final wallet mismatch");
  }
  const maya = runs.find((x) => x.id === "maya"),
    without = runs.find((x) => x.id === "maya-no-adventures");
  for (let i = 0; i < maya.checkpoints.length; i++)
    for (const key of [
      "xp",
      "playerLevel",
      "classId",
      "classLevel",
      "professionLevel",
      "vocationLevel",
      "stats",
    ])
      if (
        JSON.stringify(maya.checkpoints[i][key]) !==
        JSON.stringify(without.checkpoints[i][key])
      )
        throw Error(`Adventure counterfactual changed ${key}`);
  const primary = runs.filter((r) => r.variant === "primary");
  const totals = {
    openedDays: runs.reduce((n, r) => n + r.activeDays, 0),
    requests: runs.reduce((n, r) => n + r.final.requests, 0),
    battles: runs.reduce((n, r) => n + r.combat.attempts, 0),
    wins: runs.reduce((n, r) => n + r.combat.wins, 0),
    losses: runs.reduce((n, r) => n + r.combat.losses, 0),
    actionBounds: runs.reduce((n, r) => n + r.combat.bounds, 0),
    duplicateGuards: runs.reduce((n, r) => n + r.duplicateGuards, 0),
    expiredCommitments: runs.reduce((n, r) => n + r.expiredCommitments, 0),
    primaryPrestigeUsers: primary.filter((r) => r.firstPrestigeDay).length,
    primaryGoldUsers: primary.filter((r) => r.firstGoldDay).length,
  };
  const catalog = JSON.parse(await readFile(`${dir}/catalog.json`, "utf8"));
  catalog.roles = Object.fromEntries(
    [
      ...new Set([
        ...PROFILES.map((p) => p.profession),
        ...PROFILES.flatMap((p) =>
          p.careerChange ? [p.careerChange.profession] : [],
        ),
      ]),
    ].map((role) => [role, k.careerCategory(role).id]),
  );
  await writeFile(
    `${dir}/catalog.json`,
    JSON.stringify(catalog, null, 2) + "\n",
  );
  execFileSync("git", ["diff", "--quiet", "HEAD", "--", "src"]);
  const output = {
    ...base,
    appSourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim(),
    appSourceTree: execFileSync("git", ["rev-parse", "HEAD:src"], {
      encoding: "utf8",
    }).trim(),
    note: base.note,
    start: "2027-02-01 local noon",
    end: "2028-01-31 local noon",
    coverage,
    scenarioCount: runs.length,
    accountDays: daily.length,
    totals,
    runs,
  };
  await writeFile(
    `${dir}/results.json`,
    JSON.stringify(output, null, 2) + "\n",
  );
  await writeFile(
    `${dir}/daily-progress.csv`,
    header + "\n" + daily.join("\n") + "\n",
  );
  console.log(
    JSON.stringify(
      {
        scenarioCount: runs.length,
        accountDays: daily.length,
        coverage,
        totals,
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}
