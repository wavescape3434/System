import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const output = "docs/atlas-1.13";
await mkdir(output, { recursive: true });
const axe = await readFile(
    "/tmp/guild-ui-audit/node_modules/axe-core/axe.min.js",
    "utf8",
  ),
  screens = [],
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
  const shot = async (name, fullPage = false) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage });
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
    screens.push({ name, ...result });
    console.log(name, JSON.stringify(result));
  };
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await nav("Objectives");
  await page
    .locator(".universal-board-hall")
    .evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.evaluate(() => window.scrollBy(0, -85));
  await shot("universal-boards-mobile");
  await page
    .getByRole("button", { name: "Open Wisdom board", exact: true })
    .click();
  await shot("wisdom-board-mobile", true);
  await nav("Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page.getByRole("tab", { name: "Class", exact: true }).click();
  await page.getByLabel("Fit skill tree").click();
  await page.locator(".skill-tree-window").scrollIntoViewIfNeeded();
  await shot("constellation-mobile");
  await page
    .getByRole("button", { name: "Find Spearcraft", exact: true })
    .click();
  await page.getByLabel("Fit skill tree").click();
  await page
    .getByRole("button", { name: "Braced Point: locked", exact: true })
    .click();
  await shot("skill-inspector-mobile");
  await page
    .getByRole("button", { name: "Close skill details", exact: true })
    .click();
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.getByRole("button", { name: "All paths", exact: true }).click();
  await page.getByLabel("Fit skill tree").click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await shot("constellation-desktop", true);
  await page
    .getByRole("button", { name: "Find Spearcraft", exact: true })
    .click();
  await page.getByLabel("Fit skill tree").click();
  await page
    .getByRole("button", { name: "Braced Point: locked", exact: true })
    .click();
  await shot("skill-inspector-desktop", true);
  await page
    .getByRole("button", { name: "Close skill details", exact: true })
    .click();
  await page.getByRole("tab", { name: "Universal", exact: true }).click();
  await page.getByLabel("Fit skill tree").click();
  await shot("universal-constellation", true);
  await page.getByRole("tab", { name: "Profession", exact: true }).click();
  await page.getByLabel("Fit skill tree").click();
  await shot("career-constellation", true);
  await writeFile(
    `${output}/screens.json`,
    JSON.stringify(
      { version: "1.13.0", timezone: "America/Denver", errors, screens },
      null,
      2,
    ) + "\n",
  );
  if (errors.length || screens.some((s) => s.overflow || s.violations.length))
    throw Error("UI screening found issues");
} finally {
  await browser.close();
}
