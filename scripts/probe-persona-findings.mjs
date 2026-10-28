import { createServer } from "vite";
import { readFile, writeFile } from "node:fs/promises";
import { PROFILES } from "./persona-profiles.mjs";
const NativeDate = Date;
let time = new NativeDate("2027-02-01T19:00:00Z").getTime();
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
  const [d, m, k, e, s] = await Promise.all(
    ["domain", "metrics", "careers", "exams", "storage"].map((x) =>
      server.ssrLoadModule(`/src/${x}.ts`),
    ),
  );
  const fresh = (role = "UX Designer") =>
    d.awardSkills(
      d.createCharacter(
        "Read-only mechanics probe",
        { ...d.EMPTY_BASELINE, assessment: { ...m.EMPTY_ASSESSMENT } },
        "bard",
        role,
      ),
    );
  const model = fresh("Network Engineer");
  const classScopes = d.CLASSES.map((p) => {
    const o = d
      .objectives({ ...model, activeClass: p.id, vocation: "networking" })
      .find((o) => o.id === `${p.id}-daily`);
    return { classId: p.id, scope: o?.scope || "missing", stat: o?.stat };
  });
  const mismatches = classScopes.filter((x) => x.scope !== "class");
  const professionStats = PROFILES.map((p) => {
    const c = { ...fresh(p.profession), vocation: p.vocation },
      o = d.objectives(c).find((x) => x.id === "profession-daily");
    return {
      role: p.profession,
      category: k.careerCategory(p.profession).id,
      categoryStat: k.careerCategory(p.profession).stat,
      requestStat: o.stat,
    };
  });
  let cross = { ...fresh(), vocation: "software" };
  const v = d.objectives(cross).find((x) => x.id === "vocation-software-daily");
  cross = d.takeRequest(cross, v.id);
  cross = d.completeTaken(cross, v);
  const credit = {
    role: cross.profession,
    professionCategory: k.careerCategory(cross.profession).id,
    vocationCategory: d.activeVocation(cross).category,
    professionXP: d.professionXP(cross),
    creativeCareerXP: d.careerXP(cross, "creative"),
    technologyCareerXP: d.careerXP(cross, "technology"),
    receipt: cross.completions.at(-1),
  };
  // A separate declared 0–100 rubric ceiling fixture. No progression is forced or backfilled.
  let bounded = fresh("Graphic Designer");
  for (let day = 0; day < 14; day++) {
    time = new NativeDate(2027, 1, 1 + day, 12).getTime();
    bounded = d.takeRequest(bounded, "profession-daily");
    bounded = d.completeTaken(
      bounded,
      d.objectives(bounded).find((o) => o.id === "profession-daily"),
    );
  }
  const target = e
      .examTargets(bounded)
      .find((x) => x.scope === "profession" && x.ready),
    note =
      "Fixed fictional work rubric scored out of 100; the starting result is already 100.",
    protocol = e.workProtocolId(target.stat, note);
  time = new NativeDate(2027, 1, 16, 12).getTime();
  bounded = e.submitFitnessExam(bounded, target, protocol, 100, note);
  const baseline = bounded.exams.at(-1).status;
  time = new NativeDate(2027, 1, 17, 12).getTime();
  bounded = e.submitFitnessExam(bounded, target, protocol, 100, note);
  const repeat = bounded.exams.at(-1).status;
  time = new NativeDate(2027, 1, 18, 12).getTime();
  const mastery = e.submitFitnessExam(
    bounded,
    target,
    protocol,
    100,
    note,
    new Date(),
    "mastery",
  );
  if (
    !s.validateCharacter(bounded) ||
    mismatches.length !== 1 ||
    mismatches[0].classId !== "network-weaver" ||
    credit.professionXP !== 60 ||
    baseline !== "baseline" ||
    repeat !== "failed" ||
    mastery !== bounded
  )
    throw Error("Mechanics probe changed; review expectations");
  const wallets = [];
  for (const id of [
    "maya",
    "priya",
    "theo",
    "theo-with-exams",
    "elena",
    "quinn",
    "noah",
  ]) {
    const c = JSON.parse(
      await readFile(`docs/personas-1.25/accounts/${id}.json`, "utf8"),
    );
    if (!s.validateCharacter(c)) throw Error(`Invalid saved account ${id}`);
    const cats = [
      ...new Set(
        [
          k.careerCategory(c.profession).id,
          d.activeVocation(c)?.category,
        ].filter(Boolean),
      ),
    ];
    for (const cat of cats) {
      const wallet = `profession:${cat}`,
        nodes = d.SKILLS.filter(
          (x) =>
            !x.legacy &&
            !x.automatic &&
            x.category === "profession" &&
            d.skillWallet(c, x) === wallet,
        );
      wallets.push({
        id,
        wallet,
        earned: d.skillPointsEarned(c, wallet),
        available: d.skillPointsAvailable(c, wallet),
        purchased: c.skillPurchases.filter((x) => x.wallet === wallet).length,
        catalogNodes: nodes.length,
        unownedCurrentlyLearnable: nodes.filter(
          (x) => !d.hasSkill(c, x) && !d.skillRequirements(c, x).length,
        ).length,
      });
    }
  }
  const results = {
    note: "Supplementary deterministic mechanics probes, separate from the 35 annual scenarios. Class scope inspection substitutes a render context only; it does not award or claim to earn those classes. The bounded rubric is a deliberately isolated plateau input.",
    classScopes,
    scopeMismatches: mismatches,
    professionStats,
    statMismatches: professionStats.filter(
      (x) => x.categoryStat !== x.requestStat,
    ),
    crossCategoryCredit: credit,
    boundedRubric: {
      stat: target.stat,
      baselineStatus: baseline,
      repeated100Status: repeat,
      masteryAttemptAccepted: mastery !== bounded,
      level: d.professionLevel(bounded),
      potential: d.professionTrainingLevel(bounded),
      assumption:
        "This fixture declares 100 as its rubric maximum. A harder rubric could be established instead; this is not a claim that every user plateaus.",
    },
    wallets,
  };
  await writeFile(
    "docs/personas-1.25/mechanics-probes.json",
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      {
        scopeMismatches: mismatches,
        statMismatches: results.statMismatches.length,
        crossCategoryProfessionXP: credit.professionXP,
        boundedRubric: results.boundedRubric,
        wallets,
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
  globalThis.Date = NativeDate;
}
