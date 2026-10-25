import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const output = "docs/presentation-1.12";
await mkdir(output, { recursive: true });
const axe = await readFile(
  "/tmp/guild-ui-audit/node_modules/axe-core/axe.min.js",
  "utf8",
);
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
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("button", { name, exact: true })
      .click();
  };
  const shot = async (name, fullPage = false) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage });
    await page.addScriptTag({ content: axe });
    const evidence = await page.evaluate(async () => {
      const scan = await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      });
      const modal = document.querySelector(".request-paper");
      return {
        width: innerWidth,
        height: innerHeight,
        overflow: document.documentElement.scrollWidth > innerWidth,
        dialogOverflow: modal ? modal.scrollWidth > modal.clientWidth : false,
        currentStagePanels: document.querySelectorAll(".pixel-current-stage")
          .length,
        statIcons: [
          ...new Set(
            [...document.querySelectorAll(".request-focus-icon")].map((e) =>
              e.getAttribute("data-stat"),
            ),
          ),
        ],
        violations: scan.violations.map((v) => ({
          id: v.id,
          count: v.nodes.length,
          examples: v.nodes
            .slice(0, 5)
            .map((n) => ({ target: n.target, failure: n.failureSummary })),
        })),
      };
    });
    screens.push({ name, ...evidence });
    console.log(name, JSON.stringify(evidence));
    if (evidence.overflow || evidence.dialogOverflow)
      throw Error(`Overflow: ${name}`);
  };
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await shot("guild-emblem-mobile");
  await nav("Objectives");
  await shot("request-stat-icons-mobile");
  await page.getByLabel("Search requests").fill("Pushup");
  await page
    .getByRole("button", {
      name: "Show details for Pushup practice",
      exact: true,
    })
    .click();
  await page.getByLabel("Choose request rank").selectOption("u-floor-push-20");
  await shot("parchment-request-mobile");
  await page
    .getByRole("button", { name: "Take request", exact: true })
    .scrollIntoViewIfNeeded();
  await shot("parchment-request-instructions-mobile");
  await page.keyboard.press("Escape");
  await nav("Adventures");
  await page.locator(".pixel-current-stage").scrollIntoViewIfNeeded();
  await shot("current-stage-mobile");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await shot("current-stage-desktop", true);
  await nav("Objectives");
  await page.getByLabel("Search requests").fill("");
  await shot("request-stat-icons-desktop", true);
  await page.getByLabel("Search requests").fill("Pushup");
  await page
    .getByRole("button", {
      name: "Show details for Pushup practice",
      exact: true,
    })
    .click();
  await page.getByLabel("Choose request rank").selectOption("u-floor-push-20");
  await shot("parchment-request-desktop");
  await page.keyboard.press("Escape");
  await page.evaluate(async () => {
    const { PLACES } = await import("/src/world-catalog.ts"),
      { campaign } = await import("/src/rpg.ts"),
      key = "the-guild.character.v1",
      c = JSON.parse(localStorage.getItem(key));
    c.campaign = {
      ...campaign(c),
      battle: undefined,
      cleared: PLACES[0].stages.slice(0, 9),
    };
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page.locator(".pixel-current-stage").scrollIntoViewIfNeeded();
  await shot("current-stage-guardian", true);
  await writeFile(
    `${output}/screens.json`,
    JSON.stringify(
      {
        version: "1.12.0",
        timezone: "America/Denver",
        errors,
        screens,
      },
      null,
      2,
    ) + "\n",
  );
  if (errors.length) throw Error(errors.join("\n"));
  if (screens.some((s) => s.violations.length))
    throw Error("Accessibility scan found issues");
} finally {
  await browser.close();
}
