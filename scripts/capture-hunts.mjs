import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const dir = "docs/hunts-1.23/screens";
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
    screens.push({
      name,
      ...(await page.evaluate(async () => {
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
      })),
    });
  };
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await nav("Adventures");
  await page
    .getByRole("button", { name: "Guild requests", exact: true })
    .click();
  await page.getByRole("button", { name: "Elite hunts", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await frame(page.locator(".elite-hunts"));
  await shot("hunts-locked-mobile");
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts"),
      r = await import("/src/rpg.ts"),
      w = await import("/src/world-catalog.ts");
    let c = JSON.parse(await b.readString());
    c.baseStats = {
      STR: 100,
      DEX: 100,
      CON: 100,
      INT: 100,
      WIS: 100,
      CHA: 100,
    };
    c.campaign = r.campaign(c);
    c.campaign.cleared = [...w.PLACES[0].stages];
    c.campaign.inventory["royal-potion"] = 2;
    c.campaign.inventory["greater-ether"] = 2;
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page
    .getByRole("button", { name: "Guild requests", exact: true })
    .click();
  await page.getByRole("button", { name: "Elite hunts", exact: true }).click();
  await frame(page.locator(".elite-hunts"));
  await shot("hunts-veteran-mobile");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await frame(page.locator(".elite-hunts"));
  await shot("hunts-veteran-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Calamity", exact: true }).click();
  await frame(page.locator(".elite-hunts"));
  await shot("hunts-calamity-mobile");
  await page.getByRole("button", { name: "Mythic", exact: true }).click();
  await page.getByRole("button", { name: "Begin hunt", exact: true }).click();
  await shot("hunts-battle-mobile");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await shot("hunts-battle-desktop");
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts");
    const c = JSON.parse(await b.readString());
    c.campaign.battle.round = 3;
    c.campaign.battle.enemies[0].hp = Math.floor(
      c.campaign.battle.enemies[0].maxHp * 0.35,
    );
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("hunts-enrage-mobile");
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts");
    const c = JSON.parse(await b.readString());
    c.campaign.battle.phase = "won";
    c.campaign.battle.enemies.forEach((e) => (e.hp = 0));
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await frame(page.getByRole("heading", { name: "Victory", exact: true }));
  await shot("hunts-victory-mobile");
  await writeFile(
    `${dir}/scans.json`,
    JSON.stringify({ screens, errors }, null, 2) + "\n",
  );
  console.log(JSON.stringify({ screens, errors }, null, 2));
  if (errors.length || screens.some((s) => s.overflow || s.violations.length))
    process.exitCode = 1;
} finally {
  await browser.close();
}
