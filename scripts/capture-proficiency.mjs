import { chromium } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const out = "docs/proficiency-1.26/screens";
await mkdir(out, { recursive: true });
const axe = await readFile(
  "/tmp/guild-ui-audit/node_modules/axe-core/axe.min.js",
  "utf8",
);
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const errors = [],
  scans = [];
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
  const shot = async (name, selector) => {
    if (selector)
      await page
        .locator(selector)
        .first()
        .evaluate((el) =>
          window.scrollTo({
            top: el.getBoundingClientRect().top + scrollY - 100,
            behavior: "instant",
          }),
        );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${out}/${name}.png` });
    await page.addScriptTag({ content: axe });
    const result = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      });
      return {
        width: innerWidth,
        overflow: document.documentElement.scrollWidth > innerWidth,
        violations: r.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      };
    });
    scans.push({ name, ...result });
  };
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Register character", exact: true })
    .click();
  await page.getByLabel("Adventurer name").fill("Sample adventurer");
  await page
    .getByRole("button", { name: "Continue to assessment", exact: true })
    .click();
  await page
    .getByLabel("Maximum consecutive pushups (repetitions)", { exact: true })
    .fill("35");
  await page.getByLabel("Mile minutes", { exact: true }).fill("12");
  await page.getByLabel("Mile seconds", { exact: true }).fill("30");
  await shot(
    "mile-assessment",
    ".assessment-grid:has([aria-label='Mile minutes'])",
  );
  await page
    .getByRole("button", { name: "Next: INT check", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start INT check", exact: true })
    .click();
  await shot("reasoning", ".assessment-tabs");
  await page.getByRole("button", { name: "CHA", exact: true }).click();
  await page
    .getByRole("button", { name: "Start CHA check", exact: true })
    .click();
  await shot("communication", ".assessment-tabs");
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      m = await import("/src/metrics.ts"),
      b = await import("/e2e/browser-store.ts");
    const c = d.createCharacter(
      "Sample adventurer",
      {
        ...d.EMPTY_BASELINE,
        assessment: { ...m.EMPTY_ASSESSMENT, pushups: 35 },
      },
      "warrior",
      "Registered Nurse",
      true,
    );
    c.trainingPlan = {
      version: 1,
      rank: "D",
      environment: "home",
      pushLevel: 4,
      movementLevels: { squat: 3, hinge: 3, core: 3 },
      walkMinutes: 15,
      startedOn: "2026-10-28",
    };
    c.proficiencies = {
      "career:healthcare:Registered Nurse": {
        rank: "C",
        topic: "Structured handoffs in fictional cases",
        criterion:
          "Accurate observations, uncertainty, priority and next action, using the same handoff rubric.",
        reviewedAt: new Date().toISOString(),
      },
    };
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await page.locator(".app-shell").waitFor();
  await nav("Objectives");
  await page.getByRole("button", { name: "Regimen", exact: true }).click();
  await shot("experienced-regimen", ".regimen-session");
  await page
    .getByRole("button", { name: "Ability settings", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Practice area", exact: true })
    .selectOption("career:healthcare:Registered Nurse");
  await shot("career-proficiency", ".ability-settings");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await shot("career-proficiency-desktop", ".ability-settings");
  await writeFile(
    `${out}/scans.json`,
    JSON.stringify({ errors, scans }, null, 2) + "\n",
  );
  if (errors.length || scans.some((s) => s.overflow || s.violations.length))
    throw Error("Review screen scan findings");
  console.log(`${scans.length} screen scans pass`);
} finally {
  await browser.close();
}
