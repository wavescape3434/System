import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const dir = "docs/fieldwork-1.18";
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
      catalog = await import("/src/world-catalog.ts");
    let c = JSON.parse(await b.readString());
    c.earnedSkills.push(...u.CAREER_UTILITIES.map((u) => u.skills[0]));
    c.campaign = r.campaign(c);
    c.campaign.gold = 100;
    c.campaign.inventory = {
      ...c.campaign.inventory,
      sunleaf: 4,
      softwood: 1,
      "alderhaven-blade": 1,
    };
    c.campaign.equipment = ["alderhaven-blade"];
    for (const id of ["mossfall-path", "mossfall-wilds"])
      c.campaign.cleared.push(
        ...catalog.PLACES.find((p) => p.id === id).stages,
      );
    c = w.takeWorldContract(
      w.takeWorldContract(
        w.takeWorldContract(c, "alderhaven-herbs"),
        "alderhaven-ore",
      ),
      "alderhaven-hunt",
    );
    c.campaign.world.kills["mossfall-path"] = 6;
    const p = catalog.PLACES.find((p) => p.id === "mossfall-path");
    c.campaign.world.areas[p.id] = {
      visits: 20,
      sinceBoss: 0,
      ignored: p.ambushPity,
      bossVictories: 0,
      pendingBoss: true,
    };
    c.campaign.world.areas["mossfall-wilds"] = {
      visits: 3,
      sinceBoss: 3,
      ignored: 0,
      bossVictories: 0,
    };
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Skills & Stats");
  await page
    .getByRole("button", { name: "Profession & credentials", exact: true })
    .click();
  await page.getByText("Field competencies", { exact: true }).click();
  await page.getByLabel("All available disciplines", { exact: true }).check();
  await page.locator(".field-competency-grid").evaluate((el) =>
    window.scrollTo({
      top: el.getBoundingClientRect().top + scrollY - 145,
      behavior: "instant",
    }),
  );
  await shot("field-tool-directory-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await nav("Adventures");
  await page.locator(".map-fieldwork > summary").click();
  for (const [id, name] of [
    ["docket", "guild-docket-mobile"],
    ["manifest", "delivery-manifest-mobile"],
    ["atlas", "resource-atlas-mobile"],
    ["appraisal", "equipment-appraisal-mobile"],
    ["watch", "danger-watch-mobile"],
    ["treasury", "treasury-plan-mobile"],
  ]) {
    await page.getByLabel("Field competency", { exact: true }).selectOption(id);
    if (id === "atlas")
      await page
        .getByLabel("Atlas resource", { exact: true })
        .selectOption("sunleaf");
    if (id === "treasury") {
      await page.getByLabel("Planned potions", { exact: true }).fill("2");
      await page.getByLabel("Planned ethers", { exact: true }).fill("1");
    }
    await frame();
    await shot(name);
  }
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts"),
      w = await import("/src/world.ts");
    let c = JSON.parse(await b.readString());
    c.campaign.world.areas["mossfall-path"].pendingBoss = false;
    c.campaign.world.areas["mossfall-path"].ignored = 0;
    c = w.explore(c, "mossfall-path", () => 0.75);
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page.getByRole("button", { name: "Fieldwork", exact: true }).click();
  await page
    .getByLabel("Field competency", { exact: true })
    .selectOption("atlas");
  await page
    .getByLabel("Atlas resource", { exact: true })
    .selectOption("sunleaf");
  await shot("expedition-fieldwork-mobile");
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
