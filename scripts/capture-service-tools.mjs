import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const dir = "docs/service-1.19";
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
    c.campaign.cleared = catalog.PLACES.find(
      (p) => p.id === "mossfall-path",
    ).stages.slice(0, 9);
    c.campaign.inventory.sunleaf = 8;
    c.campaign.world.kills = {
      "mossfall-path:slime": 12,
      "mossfall-path:wolf": 4,
      "mossfall-path": 16,
    };
    c.campaign.world.journal = [
      {
        id: "one",
        placeId: "mossfall-path",
        kind: "gather",
        at: new Date().toISOString(),
        text: "Collected Sunleaf",
        resource: "sunleaf",
        quantity: 3,
      },
      {
        id: "two",
        placeId: "mossfall-path",
        kind: "encounter",
        at: new Date().toISOString(),
        text: "Forest Slime encounter",
        resolved: true,
      },
      {
        id: "three",
        placeId: "mossfall-path",
        kind: "cache",
        at: new Date().toISOString(),
        text: "Softwood cache",
        resource: "softwood",
        quantity: 2,
      },
    ];
    const units = r.adventureParty(c);
    c.campaign.vitals = {
      day: d.period("daily"),
      members: Object.fromEntries(
        units.map((u, i) => [
          u.id,
          {
            hp: i === 0 ? u.maxHp - 5 : 0,
            mp: i === 0 ? u.maxMp - 2 : 0,
            maxHp: u.maxHp,
            maxMp: u.maxMp,
          },
        ]),
      ),
    };
    c = w.takeWorldContract(c, "alderhaven-herbs");
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page.locator(".map-fieldwork > summary").click();
  await page
    .getByLabel("Field competency", { exact: true })
    .selectOption("battle-primer");
  await frame();
  await shot("battle-primer-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [id, name] of [
    ["route-plan", "route-plan-mobile"],
    ["field-record", "field-record-mobile"],
    ["triage", "recovery-triage-mobile"],
    ["battle-primer", "battle-primer-mobile"],
    ["writ", "commission-writ-mobile"],
    ["service-roster", "service-roster-mobile"],
  ]) {
    await page.getByLabel("Field competency", { exact: true }).selectOption(id);
    if (id === "route-plan")
      await page.getByLabel("Route destination").selectOption("quarry-dungeon");
    if (id === "writ")
      await page.getByLabel("Writ commission").selectOption("alderhaven-herbs");
    await frame();
    await shot(name);
  }
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts"),
      w = await import("/src/world.ts"),
      catalog = await import("/src/world-catalog.ts");
    let c = JSON.parse(await b.readString());
    c.campaign.cleared = [
      ...catalog.PLACES.find((p) => p.id === "mossfall-path").stages,
    ];
    c = w.explore(c, "mossfall-path", () => 0.75);
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page.getByRole("button", { name: "Fieldwork", exact: true }).click();
  await page
    .getByLabel("Field competency", { exact: true })
    .selectOption("triage");
  await shot("expedition-triage-mobile");
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
