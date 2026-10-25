import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const output = "docs/usability-1.11";
await mkdir(output, { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    timezoneId: "America/Denver",
    reducedMotion: "reduce",
  });
  const errors = [],
    screens = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      key = "the-guild.character.v1";
    let c = JSON.parse(localStorage.getItem(key));
    c.demo = false;
    const start = new Date();
    start.setDate(start.getDate() - 29);
    c.createdAt = start.toISOString();
    c.completions = [];
    for (let day = 1; day <= 25; day++) {
      const at = new Date();
      at.setDate(at.getDate() - day);
      c.completions.push({
        id: "u-walk-brisk",
        title: "Brisk walk",
        at: at.toISOString(),
        period: d.period("daily", at),
        xp: 40,
        gold: 8,
        classId: "warrior",
        scope: "universal",
        stat: "CON",
        rank: "E",
      });
      if (day % 2)
        c.completions.push({
          id: "warrior-daily",
          title: "Warrior commission",
          at: at.toISOString(),
          period: d.period("daily", at),
          xp: 60,
          gold: 12,
          classId: "warrior",
          scope: "class",
          stat: "STR",
          rank: "D",
        });
    }
    c.assessmentHistory = [20, 28, 32].map((pushups, i) => {
      const at = new Date();
      at.setDate(at.getDate() - [28, 14, 0][i]);
      return {
        at: at.toISOString(),
        stats: c.baseStats,
        assessment: {
          ...c.baseline.assessment,
          pushups,
          walkMetres: [550, 580, 620][i],
        },
      };
    });
    for (const id of [
      "u-walk-5",
      "u-read-5",
      "habit-walk-weekly-f",
      "habit-walk-monthly-f",
    ])
      c = d.takeRequest(c, id);
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  const nav = async (name) => {
    const menu = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    if (await menu.isVisible()) await menu.click();
    await page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("button", { name, exact: true })
      .click();
  };
  const axe = await readFile(
    "/tmp/guild-ui-audit/node_modules/axe-core/axe.min.js",
    "utf8",
  );
  const shot = async (name, fullPage = true) => {
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage });
    await page.addScriptTag({ content: axe });
    const evidence = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      });
      const cards = [...document.querySelectorAll(".compact-request")];
      return {
        width: innerWidth,
        overflow: document.documentElement.scrollWidth > innerWidth,
        visibleWholeCards: cards.filter((e) => {
          const r = e.getBoundingClientRect();
          return r.top >= 80 && r.bottom < innerHeight - 64;
        }).length,
        violations: result.violations.map((v) => ({
          id: v.id,
          count: v.nodes.length,
          examples: v.nodes
            .slice(0, 5)
            .map((n) => ({ target: n.target, failure: n.failureSummary })),
        })),
      };
    });
    screens.push({ name, ...evidence });
    if (evidence.overflow) throw Error(`Page overflow: ${name}`);
    console.log(`${name}: ${JSON.stringify(evidence)}`);
  };
  await shot("guild-actions-mobile");
  await nav("Objectives");
  await shot("requests-streamlined-mobile", false);
  await page.getByRole("button", { name: /^Taken/ }).click();
  await shot("requests-all-taken-mobile");
  await nav("Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page.getByRole("tab", { name: "Class", exact: true }).click();
  await shot("readable-tree-mobile");
  await nav("Journey");
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await shot("performance-reports-mobile");
  await page
    .locator(".performance-report")
    .screenshot({ path: "docs/screenshots/raw-performance.png" });
  await nav("Class Paths");
  await shot("class-next-step-mobile");
  await page.evaluate(() => {
    const key = "the-guild.character.v1",
      c = JSON.parse(localStorage.getItem(key));
    c.completions = Array.from({ length: 70 }, (_, i) => ({
      id: `practice-${i}`,
      period: `practice-${i}`,
      title: "Practice",
      at: "2026-09-01T12:00:00Z",
      classId: "warrior",
      scope: "class",
      stat: "STR",
      xp: 150,
      rank: "C",
    }));
    c.exams = [5, 10].map((milestone, i) => ({
      id: `passed-${milestone}`,
      scope: "class",
      owner: "warrior",
      milestone,
      stat: "STR",
      at: "2026-10-01T12:00:00Z",
      status: "passed",
      protocol: "push-floor",
      value: 22 + i * 2,
      baseline: 20 + i * 2,
    }));
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await nav("Class Paths");
  await page.getByRole("button", { name: "Examinations", exact: true }).click();
  await page
    .getByRole("button", { name: "Open Warrior exam", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Maintain mastery", exact: true })
    .click();
  await shot("mastery-exam-mobile");
  await writeFile(
    `${output}/screens.json`,
    JSON.stringify(
      { version: "1.11.0", timezone: "America/Denver", errors, screens },
      null,
      2,
    ) + "\n",
  );
  if (errors.length) throw Error(errors.join("\n"));
} finally {
  await browser.close();
}
