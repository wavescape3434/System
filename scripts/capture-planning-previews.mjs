import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const dir = "docs/planning-1.16";
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
    viewport: { width: 1440, height: 1100 },
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
  const shot = async (name, fullPage = false) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage });
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
    screens.push({ name, ...scan });
  };
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  const older = await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      p = await import("/src/skill-plans.ts"),
      a = await import("/src/activity-results.ts");
    let c = JSON.parse(localStorage.getItem("the-guild.character.v1"));
    for (const id of [
      "martial-spear-3",
      d.SKILLS.find(
        (s) =>
          s.owner === "technology" &&
          s.category === "profession" &&
          !s.legacy &&
          !s.automatic,
      ).id,
      d.SKILLS.find(
        (s) =>
          s.category === "universal" &&
          !s.legacy &&
          !s.automatic &&
          s.id !== "universal-root",
      ).id,
    ]) {
      const skill = d.SKILLS.find((s) => s.id === id);
      c = p.setPlanGoal(c, p.skillTreeKey(skill), id);
    }
    c = p.setPlanView(c, "class:fighter", {
      style: "Spearcraft",
      listMode: false,
    });
    const older = structuredClone(c);
    c = d.takeRequest(c, "warrior-daily");
    c = a.completeWithResult(
      c,
      d.objectives(c).find((o) => o.id === "warrior-daily"),
      { exercise: "Floor pushups", sets: 3, reps: 10 },
    );
    localStorage.setItem("the-guild.character.v1", JSON.stringify(c));
    return older;
  });
  await page.reload();
  await nav("Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page.locator(".planner-goals summary").click();
  await page.getByLabel("Fit skill tree", { exact: true }).click();
  await shot("saved-plans-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".planner-goals")
    .evaluate((el) =>
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 90,
        behavior: "instant",
      }),
    );
  await shot("saved-plans-mobile");
  await page.evaluate(() => {
    const key = "the-guild.character.v1",
      c = JSON.parse(localStorage.getItem(key));
    c.earnedSkills.push(
      "martial-spear-1",
      "martial-spear-2",
      "martial-spear-3",
    );
    c.skillPlans.views["class:fighter"].listMode = true;
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await nav("Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page
    .locator(".atlas-goal")
    .evaluate((el) =>
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 95,
        behavior: "instant",
      }),
    );
  await shot("goal-reached-mobile");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "older-character.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(older)),
    });
  await page
    .getByRole("dialog", { name: "Restore this character?", exact: true })
    .waitFor();
  await shot("restore-comparison-mobile");
  await page
    .getByRole("button", { name: "Restore character", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Restore this character?", exact: true })
    .waitFor({ state: "hidden" });
  await page.getByLabel("Open account settings", { exact: true }).click();
  await page
    .getByRole("button", { name: "Device recovery copies", exact: true })
    .click();
  await page.getByText("Before restore", { exact: true }).waitFor();
  await shot("device-recovery-mobile");
  await page.getByLabel("Close dialog", { exact: true }).click();
  await page.getByLabel("Open account settings", { exact: true }).click();
  await page
    .getByRole("button", { name: "Create your own character", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create character", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Register character", exact: true })
    .waitFor();
  await shot("registration-restore-mobile", true);
  await page
    .getByRole("button", { name: "Restore a character", exact: true })
    .click();
  const record = page
    .locator(".device-recovery article")
    .filter({ has: page.getByText("Before new character", { exact: true }) });
  await record
    .getByRole("button", { name: "Review copy", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restore character", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Restore this character?", exact: true })
    .waitFor({ state: "hidden" });
  await page.evaluate(() =>
    localStorage.setItem("the-guild.character.v1", "damaged primary fixture"),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload();
  await page
    .getByRole("heading", { name: "Saved data needs recovery.", exact: true })
    .waitFor();
  await shot("recovery-options-desktop");
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
