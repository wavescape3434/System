import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
    timezoneId: "America/Denver",
    reducedMotion: "reduce",
  }),
  page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const shot = async (name, fullPage = false) => {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage });
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw new Error(name + ": page overflow");
};
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
  await page.evaluate(() => scrollTo(0, 0));
};
try {
  await page.goto("http://127.0.0.1:5173");
  await shot("welcome");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await nav("Settings");
  await page.getByRole("button", { name: "Training", exact: true }).click();
  await page.getByLabel("Gym equipment", { exact: true }).check();
  await shot("training-preferences");
  await page.getByRole("button", { name: "Assessment", exact: true }).click();
  await page.getByLabel("Assessment units").selectOption("imperial");
  await page.getByLabel("Height (feet)", { exact: true }).fill("5");
  await page.getByLabel("Height (inches)", { exact: true }).fill("11");
  await shot("assessment-imperial");
  await page
    .getByRole("button", { name: "Next: INT check", exact: true })
    .click();
  await shot("mental-ready");
  await page
    .getByRole("button", { name: "Start INT check", exact: true })
    .click();
  await shot("mental-check");
  await nav("Adventures");
  await page
    .getByRole("button", { name: "Guild requests", exact: true })
    .click();
  await shot("adventure-guild-requests");
  const catalog = await page.evaluate(async () => {
    const { CLASSES, ARCHETYPES } = await import("/src/class-catalog.ts"),
      { SKILLS } = await import("/src/skill-catalog.ts"),
      { CAREER_CATEGORIES } = await import("/src/careers.ts");
    return CLASSES.map((p) => ({
      ...p,
      archetypes: Object.entries(p.mix).map(
        ([id, w]) => `${w}% ${ARCHETYPES.find((a) => a.id === id).name}`,
      ),
      requirementsText:
        [
          ...Object.entries(p.requirements).map(([a, n]) => `${a} ${n}`),
          ...(p.classRequirements || []).map(
            (r) => `${CLASSES.find((c) => c.id === r.id).name} Lv. ${r.level}`,
          ),
          ...(p.requiredSkills || []).map(
            (id) => `Skill: ${SKILLS.find((s) => s.id === id)?.name || id}`,
          ),
          ...(p.professionCategories?.length
            ? [
                `Profession: ${p.professionCategories.map((id) => CAREER_CATEGORIES.find((g) => g.id === id)?.name || id).join(" / ")}`,
              ]
            : []),
        ].join("; ") || "Open to every guild member",
    }));
  });
  let markdown =
    "# Class register\n\nAll nonbasic classes require above-average stats. Advanced paths can qualify at registration; Prestige and Ascendant paths also require prior class progression. Newly entered paths require a trial after registration. Every fifth class level requires a passed improvement exam; unlocked classes and earlier progress remain available.\n";
  for (const tier of ["Basic", "Advanced", "Prestige", "Ascendant"]) {
    markdown += `\n## ${tier}\n`;
    for (const p of catalog.filter((p) => p.tier === tier))
      markdown += `\n### ${p.name}\n\n${p.description}\n\n- **Real-world goal:** ${p.goal}\n- **Archetypes:** ${p.archetypes.join(" / ")}\n- **Requirements:** ${p.requirementsText}\n- **Signature:** ${p.signature.name} — ${p.signature.description}\n`;
  }
  await writeFile("class-register.md", markdown);
  await page.evaluate(() => {
    const key = "the-guild.character.v1",
      c = JSON.parse(localStorage.getItem(key));
    c.createdAt = "2026-09-01T12:00:00Z";
    c.completions = Array.from({ length: 12 }, (_, i) => ({
      id: "warrior-daily",
      period: `2026-09-${i + 1}`,
      at: new Date(Date.UTC(2026, 8, i + 1, 12)).toISOString(),
      xp: 150,
      stat: "STR",
      classId: "warrior",
      scope: "class",
      cadence: "daily",
      rank: "C",
      title: "Sample Warrior training",
    }));
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await nav("Class Paths");
  await page.getByRole("button", { name: "Examinations", exact: true }).click();
  await shot("examinations");
  await page
    .getByRole("button", { name: "Open Warrior exam", exact: true })
    .click();
  await shot("milestone-exam");
  await page.getByLabel("Exam result").fill("21");
  await page
    .getByRole("button", { name: "Submit measured result", exact: true })
    .click();
  await shot("milestone-passed");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await shot("notifications");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  const preview = await context.newPage();
  await preview.setViewportSize({ width: 1800, height: 1200 });
  await preview.goto("http://127.0.0.1:5173");
  await preview.evaluate(async () => {
    const m = await import("/scripts/preview-guild-update.tsx");
    m.renderRankGallery();
  });
  await preview
    .locator(".rank-preview-gallery .engraved-card")
    .last()
    .waitFor();
  await preview.evaluate(() => document.fonts.ready);
  await preview.screenshot({
    path: "docs/screenshots/rank-metals.png",
    fullPage: true,
  });
  await preview.close();
  const web = await context.newPage();
  await web.setViewportSize({ width: 1450, height: 1100 });
  await web.goto("http://127.0.0.1:5173");
  await web.evaluate(async () => {
    const m = await import("/scripts/preview-guild-update.tsx");
    m.renderFighterWeb();
  });
  await web.getByRole("tab", { name: "Class", exact: true }).click();
  await web.evaluate(() => document.fonts.ready);
  await web.screenshot({
    path: "docs/screenshots/fighter-web.png",
    fullPage: true,
  });
  await web.close();
  console.log(JSON.stringify({ pageErrors: errors }));
  if (errors.length) throw new Error(errors.join("\n"));
} finally {
  await browser.close();
}
