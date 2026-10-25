import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const out = process.env.AUDIT_OUTPUT || "docs/reviews/2026-10-24";
await mkdir(out, { recursive: true });
try {
  const page = await browser.newPage({ timezoneId: "America/Denver" });
  await page.goto("http://127.0.0.1:5173");
  const results = await page.evaluate(async () => {
    const d = await import("/src/domain.ts");
    const { recordJourney } = await import("/src/journey-events.ts");
    const { journeyReport } = await import("/src/journey.ts");
    const { validateCharacter } = await import("/src/storage.ts");
    const { campaign, startBattle, act } = await import("/src/rpg.ts");
    const { PLACES } = await import("/src/world-catalog.ts");
    const { continueAdventure } = await import("/src/world.ts");
    const { physicalPass, mentalPass } = await import("/src/exam-rules.ts");
    const now = new Date();
    const measure = (fn) => {
      fn();
      const ms = [];
      for (let i = 0; i < 5; i++) {
        const before = performance.now();
        fn();
        ms.push(performance.now() - before);
      }
      ms.sort((a, b) => a - b);
      return Math.round(ms[2] * 100) / 100;
    };
    const histories = [];
    for (const days of [30, 365, 1095]) {
      let c = d.demoCharacter();
      const created = new Date(now);
      created.setDate(created.getDate() - days);
      c = {
        ...c,
        demo: false,
        createdAt: created.toISOString(),
        completions: [],
        journeyEvents: [],
        takenRequests: [],
        milestones: {},
      };
      // Synthetic six-completions/day history, not a retention or balance simulation.
      for (let day = 0; day < days; day++) {
        const at = new Date(created);
        at.setDate(at.getDate() + day);
        for (let task = 0; task < 6; task++)
          c.completions.push({
            id: `audit-${task}`,
            period: d.period("daily", at),
            at: at.toISOString(),
            title: `Audit request ${task}`,
            xp: 40,
            gold: 8,
            stat: task < 3 ? "STR" : "INT",
            classId: "warrior",
            scope: task < 3 ? "class" : "universal",
            rank: "E",
            cadence: "daily",
            classCredits: task >= 3 ? { warrior: 10 } : undefined,
          });
      }
      const next = { ...c, name: "Audit Rename" };
      const data = JSON.stringify(c);
      histories.push({
        days,
        completions: c.completions.length,
        bytes: new Blob([data]).size,
        valid: validateCharacter(c),
        medianMs: {
          stats: measure(() => d.stats(c)),
          objectives: measure(() => d.objectives(c)),
          recordJourney: measure(() => recordJourney(c, next)),
          journeyReport30: measure(() => journeyReport(c, "30", now)),
          journeyReportAll: measure(() => journeyReport(c, "all", now)),
          validate: measure(() => validateCharacter(c)),
          serializeAndWrite: measure(() =>
            localStorage.setItem("guild.audit.temporary", JSON.stringify(c)),
          ),
        },
      });
      localStorage.removeItem("guild.audit.temporary");
    }
    const fixtures = [];
    for (const companions of [[], ["mira", "orin"]]) {
      let c = d.demoCharacter();
      c = {
        ...c,
        campaign: { ...campaign(c), roster: companions, party: companions },
      };
      c = startBattle(c, PLACES[0].stages[0]);
      const rounds = [];
      for (let stage = 0; stage < 4; stage++) {
        let actions = 0;
        while (campaign(c).battle?.phase === "player" && actions < 100) {
          const b = campaign(c).battle;
          c = act(c, {
            kind: "attack",
            target: b.enemies.findIndex((e) => e.hp > 0),
          });
          actions++;
        }
        const b = campaign(c).battle;
        rounds.push({
          phase: b?.phase,
          rounds: b?.round,
          actions,
          heroHp: b?.party[0].hp,
        });
        if (b?.phase !== "won" || stage === 3) break;
        c = continueAdventure(c);
      }
      fixtures.push({ companions: companions.length, stages: rounds });
    }
    let balance = 30;
    const balanceMilestones = [];
    for (let i = 0; i < 10; i++) {
      balance = Math.max(balance * 1.05, balance + 1);
      balanceMilestones.push(Math.round(balance * 10) / 10);
    }
    return {
      histories,
      firstPlaceAttackOnly: fixtures,
      examCeilings: {
        balanceStartingAt30: balanceMilestones,
        protocolLimit: 45,
        mentalPerfectScorePassAtEqualTime: mentalPass(
          { answers: [0], durationMs: 60000 },
          { answers: [0], durationMs: 60000 },
          () => 5,
        ),
        physicalMustImprove: physicalPass(30, 30),
      },
    };
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const throttled = await page.evaluate(async () => {
    const { recordJourney } = await import("/src/journey-events.ts");
    const { demoCharacter } = await import("/src/domain.ts");
    const base = demoCharacter(),
      now = new Date();
    const result = [];
    for (const count of [180, 2190, 6570]) {
      const c = {
        ...base,
        completions: Array.from({ length: count }, (_, i) => ({
          id: `audit-${i}`,
          period: `audit-${i}`,
          at: now.toISOString(),
          title: "Audit work",
          xp: 40,
          stat: "STR",
          classId: "warrior",
          scope: "class",
          rank: "E",
        })),
      };
      recordJourney(c, { ...c, name: "Rename" });
      const before = performance.now();
      recordJourney(c, { ...c, name: "Rename" });
      result.push({
        completions: count,
        recordJourneyMs: Math.round((performance.now() - before) * 10) / 10,
      });
    }
    return result;
  });
  const result = {
    environment:
      "Desktop Linux Chromium; function timings use dev module imports, warmed five-run medians. 4x CPU figures are single-run diagnostics, not Android measurements.",
    ...results,
    throttled4x: throttled,
  };
  await writeFile(
    `${out}/history-evidence.json`,
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
