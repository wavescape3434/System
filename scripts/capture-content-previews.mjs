import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      timezoneId: "America/Denver",
      reducedMotion: "reduce",
    }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install({ time: new Date("2027-02-06T18:00:00Z") });
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
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
    await page.evaluate(() => scrollTo(0, 0));
  };
  const shot = async (name, fullPage = false) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw Error(`${name}: page overflow`);
  };
  const audit = await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      g = await import("/src/objective-catalog.ts"),
      w = await import("/src/world-catalog.ts"),
      r = await import("/src/rpg.ts");
    const c = JSON.parse(localStorage.getItem("the-guild.character.v1")),
      all = d.objectives(c);
    return {
      profile: "Warrior / Analyst / Networking sample",
      objectives: all.length,
      groupedRequests: g.groupRequests(all).length,
      cadences: Object.fromEntries(
        ["daily", "weekly", "monthly"].map((k) => [
          k,
          {
            variants: all.filter((o) => o.cadence === k).length,
            groups: g.groupRequests(all.filter((o) => o.cadence === k)).length,
          },
        ]),
      ),
      regions: w.WORLD_REGIONS.length,
      places: w.PLACES.length,
      stages: w.WORLD_ENCOUNTERS.filter((e) => e.kind === "stage").length,
      guildCommissions: w.WORLD_CONTRACTS.length,
      towns: w.TOWNS.length,
      craftedGear: w.TOWN_GEAR.length,
      companions: r.COMPANIONS.length,
    };
  });
  await writeFile(
    "docs/content-audit-1.7.json",
    JSON.stringify(audit, null, 2) + "\n",
  );
  await nav("Objectives");
  await shot("objectives-expanded");
  await page.getByLabel("Search requests").fill("Pushup");
  await shot("objective-groups");
  await page
    .getByRole("button", {
      name: "Choose rank for Pushup practice",
      exact: true,
    })
    .click();
  await page.getByLabel("Choose request rank").selectOption("u-floor-push-20");
  await shot("request-rank-picker");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts");
    let c = JSON.parse(localStorage.getItem("the-guild.character.v1"));
    c.createdAt = "2027-02-01T18:00:00Z";
    for (const day of [1, 2, 3, 4, 5]) {
      const at = new Date(Date.UTC(2027, 1, day, 18));
      c = d.takeRequest(c, "u-walk-5", at);
      c = d.completeTaken(
        c,
        d.takenObjectives(c, at).find((o) => o.id === "u-walk-5"),
        at,
      );
      if (day <= 3) {
        c = d.takeRequest(c, "u-bible-recall", at);
        c = d.completeTaken(
          c,
          d.takenObjectives(c, at).find((o) => o.id === "u-bible-recall"),
          at,
        );
      }
    }
    localStorage.setItem("the-guild.character.v1", JSON.stringify(c));
  });
  await page.reload();
  await nav("Objectives");
  await page.getByRole("button", { name: /^Weekly quests/ }).click();
  await page.getByLabel("Search requests").fill("Walking week");
  await page
    .getByRole("button", { name: "Choose rank for Walking week", exact: true })
    .click();
  await page
    .getByLabel("Choose request rank")
    .selectOption("habit-walk-weekly-e");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Take request", exact: true })
    .click();
  await shot("weekly-retroactive");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByLabel("Search requests").fill("Chapel");
  await page.getByLabel("Objective category").selectOption("hybrid");
  await page
    .getByRole("button", { name: "View Chapel supplies", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Take request", exact: true })
    .click();
  for (const label of [
    "Complete the real-world practice",
    "Review and record the outcome",
  ])
    await page.getByRole("button", { name: label, exact: true }).click();
  await shot("hybrid-required");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await nav("Adventures");
  await shot("world-desktop", true);
  await page
    .getByRole("button", { name: "Equipment & shop", exact: true })
    .click();
  await shot("town-shortage");
  await page.evaluate(async () => {
    const { campaign } = await import("/src/rpg.ts"),
      { PLACES } = await import("/src/world-catalog.ts");
    const c = JSON.parse(localStorage.getItem("the-guild.character.v1"));
    c.campaign = {
      ...campaign(c),
      cleared: [...PLACES[0].stages],
      roster: ["mira", "orin"],
      party: ["mira", "orin"],
    };
    localStorage.setItem("the-guild.character.v1", JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      const values = [0.99, 0.6, 0, 0.5];
      let i = 0;
      Math.random = () => values[i++ % values.length];
    });
    await page
      .getByRole("button", { name: "Explore Briar Road", exact: true })
      .click();
  }
  await shot("world-exploration", true);
  await page
    .getByRole("button", { name: "Guild requests", exact: true })
    .click();
  const herbs = page.locator(".pixel-contract-grid article").filter({
    has: page.getByRole("heading", {
      name: "Alderhaven clinic supplies",
      exact: true,
    }),
  });
  await herbs
    .getByRole("button", { name: "Take request", exact: true })
    .click();
  await shot("world-guild-requests", true);
  await herbs
    .getByRole("button", { name: "Turn in request", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Equipment & shop", exact: true })
    .click();
  await shot("town-restocked");
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page.evaluate(() => {
    Math.random = () => 0;
  });
  await page
    .getByRole("button", { name: "Explore Briar Road", exact: true })
    .click();
  await shot("boss-warning", true);
  await page
    .getByRole("button", { name: "Leave the boss", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Explore Briar Road", exact: true })
    .click();
  await shot("ambush-battle", true);
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("pixel-battle-android", true);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.getByRole("button", { name: "Retreat", exact: true }).click();
  await page
    .getByRole("button", { name: "Return to map", exact: false })
    .click();
  await nav("Objectives");
  await page.getByRole("button", { name: /^Weekly quests/ }).click();
  await page.getByLabel("Objective category").selectOption("hybrid");
  await page.getByLabel("Search requests").fill("Chapel");
  await page
    .getByRole("button", { name: "View Chapel supplies", exact: true })
    .click();
  await shot("hybrid-ready");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: /^Monthly adventures/ }).click();
  await page.getByLabel("Search requests").fill("Chapel study");
  await page
    .getByRole("button", { name: "View Chapel study plan", exact: true })
    .click();
  await shot("hybrid-bonus");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.evaluate(async () => {
    const { campaign } = await import("/src/rpg.ts"),
      { PLACES } = await import("/src/world-catalog.ts");
    const c = JSON.parse(localStorage.getItem("the-guild.character.v1"));
    c.campaign = {
      ...campaign(c),
      cleared: PLACES.flatMap((p) => p.stages),
      gold: 20000,
      inventory: { ...campaign(c).inventory, "mythril-ore": 6 },
    };
    localStorage.setItem("the-guild.character.v1", JSON.stringify(c));
  });
  await page.reload();
  await nav("Adventures");
  await page
    .getByRole("button", { name: "Equipment & shop", exact: true })
    .click();
  await page.getByRole("button", { name: "Frostholm", exact: true }).click();
  await shot("town-grandmaster", true);
  await page.getByRole("button", { name: "Party", exact: true }).click();
  await shot("companions-expanded", true);
  console.log(JSON.stringify({ ...audit, pageErrors: errors }));
  if (errors.length) throw Error(errors.join("\n"));
} finally {
  await browser.close();
}
