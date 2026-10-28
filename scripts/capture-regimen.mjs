import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
await mkdir("docs/training-1.25/screens", { recursive: true });
const axe = await readFile(
  "/tmp/guild-ui-audit/node_modules/axe-core/axe.min.js",
  "utf8",
);
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const scans = [],
  errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    timezoneId: "America/Denver",
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install({ time: new Date("2027-02-01T19:00:00Z") });
  const nav = async (name) => {
    await page.locator(".app-shell").waitFor();
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
  const frame = async (selector) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) =>
        window.scrollTo({
          top: el.getBoundingClientRect().top + scrollY - 90,
          behavior: "instant",
        }),
      );
  const shot = async (name) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/screenshots/${name}.png` });
    await page.addScriptTag({ content: axe });
    const scan = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      });
      return {
        width: innerWidth,
        height: innerHeight,
        overflow: document.documentElement.scrollWidth > innerWidth,
        violations: r.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      };
    });
    scans.push({ name, ...scan });
  };
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.locator(".app-shell").waitFor();
  const seed = async (mode) => {
    await page.evaluate(async (mode) => {
      const d = await import("/src/domain.ts"),
        m = await import("/src/metrics.ts"),
        b = await import("/e2e/browser-store.ts");
      const c = d.createCharacter(
        "Training sample",
        { ...d.EMPTY_BASELINE, assessment: { ...m.EMPTY_ASSESSMENT } },
        "warrior",
        "Analyst",
        true,
      );
      if (mode !== "home") {
        c.preferences.equipment.push("gym");
        c.preferences.units = mode === "imperial" ? "imperial" : "metric";
        c.trainingPlan = {
          version: 1,
          rank: "E",
          environment: "gym",
          startedOn: "2027-02-01",
          walkMinutes: 10,
        };
      }
      await b.replaceString(JSON.stringify(c));
    }, mode);
    await page.reload();
    await nav("Objectives");
    await page.getByRole("button", { name: "Regimen", exact: true }).click();
  };
  await seed("home");
  await frame(".regimen-settings");
  await shot("regimen-settings-mobile");
  await page.getByRole("button", { name: "Start plan", exact: true }).click();
  await frame(".regimen-week");
  await shot("regimen-home-mobile");
  await page
    .getByText("Technique & progression", { exact: true })
    .first()
    .click();
  await frame(".regimen-exercises");
  await shot("regimen-technique-mobile");
  await page
    .getByRole("button", { name: "Take strength session", exact: true })
    .click();
  await frame(".workout-record");
  await page
    .getByRole("spinbutton", {
      name: "Chair sit-to-stand set 1 reps",
      exact: true,
    })
    .fill("8");
  await shot("regimen-log-mobile");
  await page
    .getByRole("button", {
      name: "Strength week · 2 days · 40 XP",
      exact: true,
    })
    .click();
  await shot("regimen-goal-mobile");
  await page.keyboard.press("Escape");
  await seed("gym");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await frame(".regimen-week");
  await shot("regimen-gym-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await seed("imperial");
  await page
    .getByRole("button", { name: "Take strength session", exact: true })
    .click();
  await frame(".workout-record");
  await page
    .getByRole("spinbutton", { name: "Leg press load", exact: true })
    .fill("22");
  await shot("regimen-imperial-mobile");
  await page.addStyleTag({ content: "html { font-size: 125% !important; }" });
  await frame(".regimen-week");
  await shot("regimen-large-text-mobile");
  await writeFile(
    "docs/training-1.25/screens/scans.json",
    JSON.stringify({ screens: scans, errors }, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      screens: scans.length,
      overflow: scans.filter((s) => s.overflow).length,
      violations: scans.reduce((n, s) => n + s.violations.length, 0),
      errors,
    }),
  );
  if (errors.length || scans.some((s) => s.overflow || s.violations.length))
    process.exitCode = 1;
} finally {
  await browser.close();
}
