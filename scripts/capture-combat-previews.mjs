import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const dir = "docs/combat-1.14";
await mkdir(dir, { recursive: true });
const axe = await readFile(
    "/tmp/guild-ui-audit/node_modules/axe-core/axe.min.js",
    "utf8",
  ),
  screens = [],
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
            failure: n.failureSummary,
          })),
        })),
      };
    });
    screens.push({ name, ...scan });
    console.log(name, JSON.stringify(scan));
  };
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      r = await import("/src/rpg.ts"),
      c = d.demoCharacter();
    c.activeClass = "scholar";
    c.examGrandfather = {
      classes: { ...c.examGrandfather?.classes, scholar: 7 },
      professions: c.examGrandfather?.professions || {},
    };
    c.completions = Array.from({ length: 12 }, (_, i) => ({
      id: "scholar-daily",
      title: "Scholar commission",
      at: `2026-09-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
      period: `2026-09-${i + 1}`,
      xp: 200,
      scope: "class",
      classId: "scholar",
      stat: "INT",
    }));
    c.earnedSkills.push(
      "opening-mage-0-0",
      "opening-mage-0-1",
      "opening-mage-1-1",
    );
    c.skillPurchases = [
      { id: "opening-mage-0-0", wallet: "combat", cost: 1 },
      { id: "opening-mage-0-1", wallet: "combat", cost: 3 },
      { id: "opening-mage-1-1", wallet: "combat", cost: 3 },
    ];
    c.campaign = { ...r.campaign(c), equippedSkills: ["opening-mage-0-0"] };
    localStorage.setItem("the-guild.character.v1", JSON.stringify(c));
  });
  await page.reload();
  await nav("Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page
    .getByRole("button", { name: "Spark: Control: learned", exact: true })
    .click();
  await shot("ranked-spark-control", true);
  await page
    .getByRole("button", { name: "Close skill details", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Spark: Refinement: available", exact: true })
    .click();
  await shot("ranked-spark-refinement-mobile");
  await page
    .getByRole("complementary", { name: "Selected skill" })
    .getByRole("button", { name: /Purchase skill/ })
    .click();
  await nav("Adventures");
  await page
    .getByRole("button", { name: "Skill loadout", exact: true })
    .click();
  await shot("upgraded-loadout-mobile", true);
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page.locator(".pixel-stage-enter").click();
  await shot("ranked-skill-battle-mobile", true);
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      r = await import("/src/rpg.ts"),
      c = d.demoCharacter();
    c.campaign = { ...r.campaign(c), cleared: ["mossfall-1", "mossfall-2"] };
    localStorage.setItem("the-guild.character.v1", JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page.locator(".pixel-stage-enter").click();
  await shot("briar-shell-mobile", true);
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      r = await import("/src/rpg.ts"),
      { PLACES } = await import("/src/world-catalog.ts"),
      c = d.demoCharacter();
    c.campaign = { ...r.campaign(c), cleared: PLACES[0].stages.slice(0, 9) };
    localStorage.setItem("the-guild.character.v1", JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page.locator(".pixel-stage-enter").click();
  for (let i = 0; i < 2; i++)
    await page.getByRole("button", { name: /^Guard/ }).click();
  await shot("guardian-windup-mobile", true);
  await page.setViewportSize({ width: 1440, height: 1100 });
  for (let i = 0; i < 2; i++)
    await page.getByRole("button", { name: /^Guard/ }).click();
  await shot("guardian-cleave", true);
  await writeFile(
    `${dir}/screens.json`,
    JSON.stringify(
      { version: "1.14.0", timezone: "America/Denver", errors, screens },
      null,
      2,
    ) + "\n",
  );
  if (errors.length || screens.some((s) => s.overflow || s.violations.length))
    throw Error("Combat UI screening found issues");
} finally {
  await browser.close();
}
