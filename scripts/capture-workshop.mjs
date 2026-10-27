import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const dir = "docs/economy-1.22/screens";
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
  await page.locator(".app-shell").waitFor();
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts"),
      r = await import("/src/rpg.ts"),
      d = await import("/src/domain.ts"),
      w = await import("/src/workshop.ts");
    let c = JSON.parse(await b.readString());
    c.campaign = r.campaign(c);
    c.campaign.gold = 2600;
    c.campaign.inventory.sunleaf = 20;
    c.campaign.inventory.softwood = 20;
    c = r.equip(r.buy(c, "alderhaven-armor"), "alderhaven-armor");
    c = r.equip(r.buy(c, "alderhaven-blade"), "alderhaven-blade");
    c = w.temper(c, "alderhaven-armor");
    c = w.brew(w.brew(c, "greater-potion", 2), "greater-ether", 2);
    const units = r.adventureParty(c);
    c.campaign.vitals = {
      day: d.period("daily"),
      members: Object.fromEntries(
        units.map((u) => [
          u.id,
          {
            hp: u.id === "hero" ? 12 : 0,
            mp: 2,
            maxHp: u.maxHp,
            maxMp: u.maxMp,
          },
        ]),
      ),
    };
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page
    .getByRole("button", { name: "Equipment & shop", exact: true })
    .click();
  const bench = page.getByRole("region", {
    name: "Tempering bench",
    exact: true,
  });
  await page.getByLabel("Temper equipment").selectOption("alderhaven-armor");
  await frame(bench);
  await shot("tempering-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await frame(bench);
  await shot("tempering-mobile");
  const apothecary = page.getByRole("region", {
    name: "Apothecary",
    exact: true,
  });
  await page.getByLabel("potion brew quantity", { exact: true }).fill("2");
  await frame(apothecary);
  await shot("apothecary-mobile");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await frame(apothecary);
  await shot("apothecary-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByLabel("potion brew grade", { exact: true })
    .selectOption("royal");
  await frame(apothecary);
  await shot("royal-brew-locked-mobile");
  await page.reload();
  await nav("Adventures");
  await page.getByRole("button", { name: /^Supplies ·/ }).click();
  await shot("brewed-supplies-mobile");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts"),
      r = await import("/src/rpg.ts");
    let c = JSON.parse(await b.readString());
    c = r.startBattle(c, "mossfall-1");
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await shot("brewed-battle-mobile");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await shot("brewed-battle-desktop");
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
