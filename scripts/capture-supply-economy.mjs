import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const dir = "docs/economy-1.21/screens";
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
  const frame = async () =>
    page.getByLabel("Career fieldwork", { exact: true }).evaluate((el) =>
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 90,
        behavior: "instant",
      }),
    );
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts"),
      r = await import("/src/rpg.ts"),
      d = await import("/src/domain.ts"),
      w = await import("/src/world.ts");
    let c = JSON.parse(await b.readString());
    c.campaign = r.campaign(c);
    c.campaign.gold = 500;
    c.campaign.inventory.softwood = 6;
    c.campaign.world.stock.alderhaven = { potion: 8, ether: 6 };
    const units = r.adventureParty(c);
    c.campaign.vitals = {
      day: d.period("daily"),
      members: Object.fromEntries(
        units.map((u, i) => [
          u.id,
          {
            hp: i === 0 ? Math.max(1, u.maxHp - 45) : 0,
            mp: i === 0 ? Math.max(0, u.maxMp - 12) : 0,
            maxHp: u.maxHp,
            maxMp: u.maxMp,
          },
        ]),
      ),
    };
    c = w.takeWorldContract(c, "alderhaven-ore");
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page.getByRole("button", { name: /^Supplies ·/ }).click();
  await shot("supply-satchel-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("supply-satchel-mobile");
  await page.getByLabel("Supply target").selectOption("mira");
  await shot("fallen-supplies-mobile");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Equipment & shop", exact: true })
    .click();
  await page.getByLabel("Potion quantity").fill("3");
  await page
    .getByRole("heading", { name: "General store", exact: true })
    .evaluate((el) =>
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 90,
        behavior: "instant",
      }),
    );
  await shot("bulk-supplies-mobile");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page
    .getByRole("heading", { name: "General store", exact: true })
    .evaluate((el) =>
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 90,
        behavior: "instant",
      }),
    );
  await shot("bulk-supplies-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  const seal = page
    .getByRole("group", { name: "Blacksmith recipes", exact: true })
    .locator("article")
    .filter({
      has: page.getByRole("heading", { name: "Woodland Seal", exact: true }),
    });
  await seal.evaluate((el) =>
    window.scrollTo({
      top: el.getBoundingClientRect().top + scrollY - 90,
      behavior: "instant",
    }),
  );
  await shot("cha-seal-mobile");
  await page
    .getByRole("button", { name: "Guild requests", exact: true })
    .click();
  const card = page.locator(".pixel-contract-grid article").filter({
    has: page.getByRole("heading", {
      name: "Alderhaven smith's commission",
      exact: true,
    }),
  });
  await card.getByText("Smith recipes affected · 6", { exact: true }).click();
  await card.evaluate((el) =>
    window.scrollTo({
      top: el.getBoundingClientRect().top + scrollY - 90,
      behavior: "instant",
    }),
  );
  await shot("delivery-tradeoff-mobile");
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts"),
      w = await import("/src/world.ts"),
      catalog = await import("/src/world-catalog.ts");
    let c = JSON.parse(await b.readString());
    c.campaign.cleared = [...catalog.PLACES[0].stages];
    c = w.explore(c, "mossfall-path", () => 0.75);
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page.getByRole("button", { name: /^Supplies ·/ }).click();
  await shot("expedition-supplies-mobile");
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
