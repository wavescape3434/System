import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const dir = "docs/builds-1.24/screens";
await mkdir(dir, { recursive: true });
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
  const frame = async (locator) =>
    locator.evaluate((el) =>
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
      const b = await import("/e2e/browser-store.ts"),
        r = await import("/src/rpg.ts");
      let c = JSON.parse(await b.readString());
      c.activeClass =
        mode === "martial"
          ? "warrior"
          : mode === "paladin"
            ? "paladin"
            : "scholar";
      c.baseStats = { STR: 30, DEX: 30, CON: 30, INT: 30, WIS: 30, CHA: 30 };
      const ids =
        mode === "martial"
          ? [
              "martial-sword-2",
              "martial-spear-2",
              "martial-axe-3",
              "martial-unarmed-2",
            ]
          : mode === "paladin"
            ? ["focus-paladin-1"]
            : ["element-fire-0", "element-ice-0", "element-storm-0"];
      c.earnedSkills = [...new Set([...c.earnedSkills, ...ids])];
      c.campaign = {
        ...r.campaign(c),
        battle: undefined,
        vitals: undefined,
        equippedSkills: ids,
        party: ["mira"],
      };
      c.campaign.world.expedition = undefined;
      await b.replaceString(JSON.stringify(c));
    }, mode);
    await page.reload();
    await nav("Adventures");
  };
  await seed("martial");
  await page
    .getByRole("button", { name: "Skill loadout", exact: true })
    .click();
  await frame(page.locator(".loadout-header"));
  await shot("builds-martial-mobile");
  await seed("elements");
  await nav("Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page
    .getByRole("button", { name: "Find Frostcraft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rime Shard: learned", exact: true })
    .click();
  await shot("builds-frost-tree-mobile");
  await nav("Adventures");
  await page.locator(".pixel-stage-enter").click();
  await shot("builds-elements-battle-mobile");
  await page.getByText("Technique details", { exact: true }).click();
  await frame(page.locator(".battle-technique-guide"));
  await shot("builds-techniques-mobile");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await frame(page.locator(".battlefield"));
  await shot("builds-elements-desktop");
  await seed("paladin");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Skill loadout", exact: true })
    .click();
  await frame(page.locator(".signature-loadout"));
  await shot("builds-prestige-mobile");
  await writeFile(
    `${dir}/scans.json`,
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
