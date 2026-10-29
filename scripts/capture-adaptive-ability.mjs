import { chromium } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const out = "docs/adaptive-1.27/screens";
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
  await page.clock.install({ time: new Date("2027-02-04T12:00:00-07:00") });
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
    const scan = await page.evaluate(async () => {
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
    scans.push({ name, ...scan });
  };
  const seed = async (mode) => {
    await page.evaluate(async (mode) => {
      const d = await import("/src/domain.ts"),
        m = await import("/src/metrics.ts"),
        a = await import("/src/adaptive-ability.ts"),
        r = await import("/src/training-regimen.ts"),
        b = await import("/e2e/browser-store.ts");
      let c = d.createCharacter(
        "Sample adventurer",
        { ...d.EMPTY_BASELINE, assessment: { ...m.EMPTY_ASSESSMENT } },
        mode === "gym" ? "warrior" : "scholar",
        mode === "chef" ? "Chef" : "Teacher",
        true,
      );
      if (mode === "language") {
        const o = d.objectives(c).find((o) => o.id === "practice-language-d");
        for (const ago of [3, 1])
          c = a.recordAbilityCheck(
            c,
            o,
            {
              subject: "Spanish listening and speaking · B1",
              source: "Course B1, comprehension and response rubric v1",
              level: "D",
              criteriaMet: 4,
              criteriaTotal: 4,
              independent: true,
              unfamiliar: true,
            },
            new Date(Date.now() - ago * 86400000),
          );
      }
      if (mode === "gym") {
        c.preferences.units = "metric";
        c.preferences.equipment.push("gym");
        c.trainingPlan = {
          version: 1,
          rank: "D",
          environment: "gym",
          startedOn: "2027-02-04",
          automaticAbility: true,
        };
        const p = r.personalizedWorkout(c, "D", "A", "gym");
        c.completions = [5, 2].map((ago, i) => ({
          id: "regimen-a-d",
          title: "Sample gym session",
          at: new Date(Date.now() - ago * 86400000).toISOString(),
          period: `sample-${i}`,
          xp: 60,
          stat: "STR",
          classId: "warrior",
          scope: "universal",
          rank: "D",
          cadence: "daily",
          family: "u-resistance",
          workout: p,
          result: {
            workout: {
              prescription: p,
              exercises: p.exercises.map((e) => ({
                id: e.id,
                variation: e.name,
                reps: Array.from({ length: e.sets }, () => e.max),
                rir: 3,
                ...(e.load ? { loadKg: 20 } : {}),
              })),
            },
          },
        }));
      }
      if (mode === "chef")
        c.completions = Array.from({ length: 15 }, (_, i) => ({
          id: "profession-daily",
          title: "Sample profession work",
          xp: 150,
          period: `sample-${i}`,
          at: new Date(Date.now() - (20 - i) * 86400000).toISOString(),
          classId: "scholar",
          stat: "DEX",
          scope: "profession",
          profession: "Chef",
          cadence: "daily",
          rank: "C",
        }));
      await b.replaceString(JSON.stringify(c));
    }, mode);
    await page.reload();
    await page.locator(".app-shell").waitFor();
  };
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.locator(".app-shell").waitFor();
  await seed("teacher");
  await nav("Objectives");
  await page
    .getByRole("button", { name: "View Profession practice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Check current ability", exact: true })
    .click();
  await page.getByLabel("Sample difficulty", { exact: true }).selectOption("C");
  await page
    .getByLabel("Ability sample subject", { exact: true })
    .fill("Fraction lesson design");
  await page
    .getByLabel("Ability sample source", { exact: true })
    .fill("Lesson and misconception rubric v1");
  await page.locator(".modal").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await shot("teacher-work-sample");
  await page.keyboard.press("Escape");
  await seed("language");
  await nav("Objectives");
  await page
    .getByRole("button", { name: "Open Intelligence board", exact: true })
    .click();
  const group = await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      b = await import("/e2e/browser-store.ts");
    return d
      .objectives(JSON.parse(await b.readString()))
      .find((o) => o.id === "practice-language-d").groupTitle;
  });
  await page
    .getByRole("button", { name: `View ${group}`, exact: true })
    .click();
  await shot("adapted-language");
  await page.keyboard.press("Escape");
  await seed("gym");
  await nav("Objectives");
  await page.getByRole("button", { name: "Regimen", exact: true }).click();
  await shot("separate-gym-loads", ".regimen-session");
  await seed("chef");
  await nav("Class Paths");
  await page.getByRole("button", { name: "Examinations", exact: true }).click();
  await page
    .getByRole("button", { name: "Open Chef exam", exact: true })
    .click();
  await shot("chef-milestone");
  await page.keyboard.press("Escape");
  await nav("Objectives");
  await page
    .getByRole("button", { name: "Ability settings", exact: true })
    .click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await shot("ability-settings-desktop", ".ability-settings");
  await writeFile(
    `${out}/scans.json`,
    JSON.stringify({ errors, scans }, null, 2) + "\n",
  );
  if (errors.length || scans.some((s) => s.overflow || s.violations.length))
    throw Error("Review screen findings");
  console.log(`${scans.length} screen scans pass`);
} finally {
  await browser.close();
}
