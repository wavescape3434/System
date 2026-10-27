import { test, expect, type Page } from "@playwright/test";
const nav = async (page: Page, name: string) => {
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
const sample = async (page: Page) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.locator(".app-shell").waitFor();
};
const read = async (page: Page) =>
  page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
const seed = async (page: Page, mode: string) => {
  await sample(page);
  await page.evaluate(async (mode) => {
    const b = await import("/e2e/browser-store.ts"),
      u = await import("/src/career-payoffs.ts"),
      r = await import("/src/rpg.ts"),
      w = await import("/src/world.ts"),
      catalog = await import("/src/world-catalog.ts");
    let c = JSON.parse((await b.readString())!);
    c.earnedSkills.push(...u.CAREER_UTILITIES.map((u) => u.skills[0]));
    c.campaign = r.campaign(c);
    if (mode === "contracts") {
      c = w.takeWorldContract(c, "alderhaven-herbs");
      c = w.takeWorldContract(c, "alderhaven-ore");
      c = w.takeWorldContract(c, "alderhaven-hunt");
      c.campaign.inventory.sunleaf = 4;
      c.campaign.inventory.softwood = 7;
      c.campaign.world.kills["mossfall-path"] = 6;
    }
    if (mode === "gear") {
      c.campaign.gold = 100;
      c.campaign.inventory.softwood = 1;
      c.campaign.inventory["alderhaven-blade"] = 1;
      c.campaign.equipment = ["alderhaven-blade"];
    }
    if (mode === "watch" || mode === "expedition") {
      c.campaign.cleared = [
        ...catalog.PLACES.find((p) => p.id === "mossfall-path")!.stages,
      ];
      if (mode === "watch") {
        const p = catalog.PLACES.find((p) => p.id === "mossfall-path")!;
        c.campaign.world.areas[p.id] = {
          visits: 20,
          sinceBoss: 0,
          ignored: p.ambushPity,
          bossVictories: 0,
          pendingBoss: true,
        };
      } else c = w.explore(c, "mossfall-path", () => 0.75);
    }
    await b.replaceString(JSON.stringify(c));
  }, mode);
  await page.reload();
  await nav(page, "Adventures");
};
const tool = async (page: Page, id: string) => {
  if (!(await page.getByLabel("Field competency", { exact: true }).isVisible()))
    await page.locator(".map-fieldwork > summary").click();
  await page.getByLabel("Field competency", { exact: true }).selectOption(id);
};

test("Finance skill purchase opens the matching planner and budgeting never spends gold", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts"),
      d = await import("/src/domain.ts");
    let c = JSON.parse((await b.readString())!);
    c.profession = d.PROFESSIONS.find((p) => /Accountant/.test(p))!;
    c.vocation = null;
    for (const daysAgo of [1, 0]) {
      const now = new Date();
      now.setDate(now.getDate() - daysAgo);
      const o = d
        .objectives(c)
        .find(
          (o) =>
            o.scope === "profession" &&
            o.careerCategory === "finance" &&
            o.cadence === "daily" &&
            o.rank === "D",
        )!;
      if (!o) throw Error("No D finance request");
      c = d.completeTaken(d.takeRequest(c, o.id, now), o, now);
    }
    if (d.skillPointsAvailable(c, "profession:finance") < 1)
      throw Error("Career practice did not earn a point");
    c.campaign = (await import("/src/rpg.ts")).campaign(c);
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  const before = await read(page);
  await nav(page, "Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page.getByRole("tab", { name: "Profession", exact: true }).click();
  await page
    .getByLabel("Profession tree", { exact: true })
    .selectOption("current");
  await page.getByRole("button", { name: "Skill list", exact: true }).click();
  await page.getByRole("button", { name: /^Ledger Foundations Lv\./ }).click();
  await page.getByRole("button", { name: /Purchase skill/ }).click();
  await page
    .getByRole("button", { name: "Use Treasurer’s Plan", exact: true })
    .click();
  await expect(
    page.getByLabel("Field competency", { exact: true }),
  ).toHaveValue("treasury");
  await page.getByLabel("Planned potions", { exact: true }).fill("2");
  await page.getByLabel("Planned ethers", { exact: true }).fill("1");
  await expect(page.getByLabel("Career fieldwork")).toContainText(
    "Basket: 65 gold",
  );
  await expect(page.getByLabel("Career fieldwork")).toContainText(
    "Insufficient stock: healing potions",
  );
  await page.getByLabel("Planned ethers", { exact: true }).fill("");
  await expect(
    page.getByRole("alert").filter({ hasText: "Enter whole quantities" }),
  ).toBeVisible();
  await page.getByLabel("Planned ethers", { exact: true }).fill("0");
  const after = await read(page);
  expect(after.campaign.gold).toBe(before.campaign.gold);
  expect(after.campaign.inventory).toEqual(before.campaign.inventory);
  expect(after.completions).toEqual(before.completions);
  await page
    .getByRole("button", { name: "Open general store", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "General store", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await expect(page.locator(".pixel-region-banner")).toBeVisible();
  await expect(
    page.getByLabel("Field competency", { exact: true }),
  ).not.toBeVisible();
});
test("Management and Logistics show accepted work and route to the actual guild board", async ({
  page,
}) => {
  await seed(page, "contracts");
  const before = await read(page);
  await tool(page, "docket");
  await expect(page.getByLabel("Career fieldwork")).toContainText(
    "3 accepted commissions",
  );
  await expect(page.getByLabel("Career fieldwork")).toContainText(
    "Ready to report here",
  );
  await expect(page.getByLabel("Career fieldwork")).toContainText("6/6");
  await tool(page, "manifest");
  await expect(page.getByLabel("Career fieldwork")).toContainText(
    "4 carried · 6 needed · 2 short",
  );
  await expect(page.getByLabel("Career fieldwork")).toContainText(
    "7 carried · 5 needed · 0 short",
  );
  await expect(page.getByLabel("Career fieldwork")).toContainText(
    "Clear route to explore",
  );
  expect((await read(page)).campaign).toEqual(before.campaign);
  await page
    .getByRole("button", { name: "Open guild requests", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Guild requests", exact: true }),
  ).toBeVisible();
});
test("Land and Agriculture filters real resources and opens an accessible area without adventuring automatically", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, "atlas");
  const before = await read(page);
  await tool(page, "atlas");
  await page
    .getByLabel("Atlas resource", { exact: true })
    .selectOption("sunleaf");
  await expect(page.getByLabel("Career fieldwork")).toContainText("Sunleaf");
  await expect(page.getByLabel("Career fieldwork")).toContainText(
    "0/10 stages",
  );
  await expect(page.getByLabel("Career fieldwork")).not.toContainText(
    "Whitepine",
  );
  await page
    .getByLabel("Career fieldwork")
    .getByRole("button", { name: "View area", exact: true })
    .first()
    .click();
  await expect(page.locator(".pixel-place-heading")).toContainText(
    "Briar Road",
  );
  expect((await read(page)).campaign).toEqual(before.campaign);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
test("Trades shows slot tradeoffs and shortages before opening the blacksmith", async ({
  page,
}) => {
  await seed(page, "gear");
  const before = await read(page);
  await tool(page, "appraisal");
  const staff = page
    .getByLabel("Career fieldwork")
    .locator("article")
    .filter({ has: page.getByText("Woodland Staff", { exact: true }) });
  await expect(staff).toContainText("Replaces: Woodland Blade");
  await expect(staff).toContainText("-3 STR");
  await expect(staff).toContainText("+3 INT");
  await expect(staff).toContainText("50 gold short · 1 Softwood short");
  await page
    .getByRole("button", { name: "Open blacksmith", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: /Blacksmith/ })).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
});
test("Safety reports the next real ambush risk without resolving it until exploration", async ({
  page,
}) => {
  await seed(page, "watch");
  const before = await read(page);
  await tool(page, "watch");
  await expect(page.getByLabel("Career fieldwork")).toContainText(
    "Next exploration ambush: 100%",
  );
  await expect(page.getByLabel("Career fieldwork")).toContainText(
    "Guaranteed on the next exploration",
  );
  expect((await read(page)).campaign).toEqual(before.campaign);
  await page
    .getByLabel("Career fieldwork")
    .getByRole("button", { name: "View area", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Explore Briar Road", exact: true })
    .click();
  expect((await read(page)).campaign.battle.source.kind).toBe("ambush");
});
test("fieldwork stays available during an expedition and closing it retains the expedition", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, "expedition");
  const before = await read(page);
  await expect(page.locator(".expedition-view")).toBeVisible();
  await page.getByRole("button", { name: "Fieldwork", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Fieldwork", exact: true });
  await expect(dialog).toBeVisible();
  await tool(page, "atlas");
  await expect(
    dialog.getByLabel("Atlas resource", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Continue exploring", exact: true }),
  ).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
});

test("the profession record retains learned tools after changing career and opens the selected tool", async ({
  page,
}) => {
  await seed(page, "contracts");
  const before = await read(page);
  await nav(page, "Skills & Stats");
  await page
    .getByRole("button", { name: "Profession & credentials", exact: true })
    .click();
  const role = await page.evaluate(async () => {
    const d = await import("/src/domain.ts");
    return d.PROFESSIONS.find((p) => /Teacher/.test(p))!;
  });
  await page.getByLabel("Find a profession", { exact: true }).fill("Teacher");
  await page.getByLabel("Your profession", { exact: true }).selectOption(role);
  await page.getByText("Field competencies", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Use Caravan Manifest", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Use Caravan Manifest", exact: true })
    .click();
  await expect(
    page.getByLabel("Field competency", { exact: true }),
  ).toHaveValue("manifest");
  const after = await read(page);
  expect(after.profession).toBe(role);
  expect(after.earnedSkills).toEqual(before.earnedSkills);
  expect(after.baseStats).toEqual(before.baseStats);
  expect(after.campaign).toEqual(before.campaign);
});
