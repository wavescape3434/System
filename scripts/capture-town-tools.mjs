import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const dir = "docs/town-1.20";
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
      u = await import("/src/career-payoffs.ts"),
      r = await import("/src/rpg.ts"),
      w = await import("/src/world.ts"),
      catalog = await import("/src/world-catalog.ts"),
      d = await import("/src/domain.ts");
    let c = JSON.parse(await b.readString());
    c.earnedSkills.push(...u.CAREER_UTILITIES.map((u) => u.skills[0]));
    c.campaign = r.campaign(c);
    c.campaign.gold = 200;
    c.campaign.inventory.sunleaf = 8;
    c.campaign.inventory.softwood = 1;
    c.campaign.cleared = [
      ...catalog.PLACES.find((p) => p.id === "mossfall-path").stages,
    ];
    c = w.completeWorldContract(
      w.takeWorldContract(c, "alderhaven-herbs"),
      "alderhaven-herbs",
    );
    const old = new Date();
    old.setDate(old.getDate() - 32);
    c.campaign.world.receipts.push({
      id: "sample-older-receipt",
      contractId: "alderhaven-herbs",
      at: old.toISOString(),
      gold: 25,
    });
    const units = r.adventureParty(c);
    c.campaign.vitals = {
      day: d.period("daily"),
      members: Object.fromEntries(
        units.map((u, i) => [
          u.id,
          { hp: i === 0 ? 1 : 0, mp: 0, maxHp: u.maxHp, maxMp: u.maxMp },
        ]),
      ),
    };
    c = w.takeWorldContract(c, "alderhaven-monster");
    c.campaign.world.areas["mossfall-path"] = {
      visits: 12,
      sinceBoss: 3,
      ignored: 0,
      bossVictories: 1,
    };
    c.campaign.world.journal = [
      {
        id: "marker",
        at: new Date().toISOString(),
        placeId: "mossfall-path",
        kind: "landmark",
        text: "Charted a quiet passage",
        resolved: true,
      },
    ];
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page.locator(".map-fieldwork > summary").click();
  await page
    .getByLabel("Field competency", { exact: true })
    .selectOption("folio");
  await frame();
  await shot("route-folio-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [id, name] of [
    ["folio", "route-folio-mobile"],
    ["exchange", "delivery-exchange-mobile"],
    ["register", "receipt-register-mobile"],
    ["concierge", "town-concierge-mobile"],
    ["work-order", "forge-order-mobile"],
    ["departure", "departure-check-mobile"],
  ]) {
    await page.getByLabel("Field competency", { exact: true }).selectOption(id);
    if (id === "exchange")
      await page.getByLabel("Exchange material").selectOption("softwood");
    if (id === "concierge")
      await page.getByLabel("Concierge town").selectOption("brassford");
    if (id === "work-order") {
      await page.getByLabel("Plan Woodland Blade", { exact: true }).check();
      await page.getByLabel("Plan Woodland Armor", { exact: true }).check();
    }
    await frame();
    await shot(name);
  }
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts"),
      w = await import("/src/world.ts");
    let c = JSON.parse(await b.readString());
    c = w.explore(c, "mossfall-path", () => 0.75);
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page.getByRole("button", { name: "Fieldwork", exact: true }).click();
  await page
    .getByLabel("Field competency", { exact: true })
    .selectOption("concierge");
  await page.getByLabel("Concierge town").selectOption("brassford");
  await shot("expedition-concierge-mobile");
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
