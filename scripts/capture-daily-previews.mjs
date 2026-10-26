import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const dir = "docs/daily-1.15";
await mkdir(dir, { recursive: true });
const axe = await readFile(
  "/tmp/guild-ui-audit/node_modules/axe-core/axe.min.js",
  "utf8",
);
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const screens = [],
  errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    timezoneId: "America/Denver",
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const nav = async (name) => {
    const menu = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    if (await menu.isVisible()) await menu.click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name, exact: true })
      .click();
  };
  const shot = async (name) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/screenshots/${name}.png` });
    await page.addScriptTag({ content: axe });
    const scan = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      });
      return {
        width: innerWidth,
        height: innerHeight,
        overflow: document.documentElement.scrollWidth > innerWidth,
        violations: result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      };
    });
    screens.push({ name, ...scan });
  };
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      a = await import("/src/activity-results.ts");
    const key = "the-guild.character.v1";
    let c = JSON.parse(localStorage.getItem(key));
    const today = new Date();
    c.createdAt = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 7,
      10,
    ).toISOString();
    for (const [i, days] of [5, 3, 1].entries()) {
      const at = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - days,
        18,
      );
      c = d.takeRequest(c, "u-walk-5", at);
      c = a.completeWithResult(
        c,
        d.objectives(c).find((o) => o.id === "u-walk-5"),
        {
          exercise: "Walking",
          minutes: 5 + i * 2,
          distanceKm: 0.35 + i * 0.15,
          output: "Canal route",
        },
        at,
      );
    }
    for (const id of [
      "u-walk-5",
      "warrior-daily",
      "habit-walk-weekly-f",
      "habit-walk-monthly-f",
    ])
      c = d.takeRequest(c, id);
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await shot("daily-hub-mobile");
  await page
    .getByLabel("Current work")
    .getByRole("button", { name: /Walk for 5 minutes/ })
    .click();
  await shot("request-actions-mobile");
  await page
    .getByRole("button", { name: "Add results (optional)", exact: true })
    .click();
  await page
    .getByLabel("Exercise / variation", { exact: true })
    .fill("Walking");
  await page.getByLabel("Duration (minutes)", { exact: true }).fill("10");
  await page.getByLabel("Distance (km)", { exact: true }).fill("0.8");
  await page
    .getByLabel("Result / technique note", { exact: true })
    .fill("Canal route; steady pace");
  await page
    .getByLabel("Activity results", { exact: true })
    .evaluate((el) => el.scrollIntoView({ block: "start" }));
  await shot("request-results-mobile");
  await page
    .getByRole("button", { name: "Submit completed request", exact: true })
    .click();
  await nav("Journey");
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page
    .getByLabel("Practice results", { exact: true })
    .scrollIntoViewIfNeeded();
  await shot("practice-results-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByLabel("Practice results", { exact: true })
    .evaluate((el) => el.scrollIntoView({ block: "start" }));
  await shot("practice-results-mobile");
  await nav("Adventures");
  await page.getByRole("button", { name: /STAGE 1/ }).click();
  await page.getByRole("button", { name: /^Guard/ }).click();
  await page.getByRole("button", { name: "Attack", exact: true }).click();
  await page.getByRole("button", { name: /^Iron Cleave/ }).click();
  for (
    let i = 0;
    i < 40 &&
    !(await page
      .getByRole("heading", { name: "Victory", exact: true })
      .isVisible());
    i++
  )
    await page.getByRole("button", { name: "Attack", exact: true }).click();
  await page
    .getByRole("button", { name: "Return to map", exact: false })
    .click();
  await page.getByLabel("Expedition resources").scrollIntoViewIfNeeded();
  await shot("party-reserves-mobile");
  // Include the depleted state in contrast/overflow screening.
  await page.evaluate(() => {
    const key = "the-guild.character.v1",
      c = JSON.parse(localStorage.getItem(key));
    for (const member of Object.values(c.campaign.vitals.members)) {
      member.hp = 0;
      member.mp = 0;
    }
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page.getByLabel("Expedition resources").scrollIntoViewIfNeeded();
  await shot("party-exhausted-mobile");
  await writeFile(
    `${dir}/screens.json`,
    JSON.stringify({ screens, errors }, null, 2) + "\n",
  );
  console.log(JSON.stringify({ screens, errors }, null, 2));
  if (errors.length || screens.some((s) => s.overflow || s.violations.length))
    process.exitCode = 1;
} finally {
  await browser.close();
}
