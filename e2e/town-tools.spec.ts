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
const read = async (page: Page) =>
  page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
const sample = async (page: Page) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.locator(".app-shell").waitFor();
};
const seed = async (page: Page, mode = "normal") => {
  await sample(page);
  await page.evaluate(async (mode) => {
    const b = await import("/e2e/browser-store.ts"),
      u = await import("/src/career-payoffs.ts"),
      r = await import("/src/rpg.ts"),
      w = await import("/src/world.ts"),
      d = await import("/src/domain.ts"),
      catalog = await import("/src/world-catalog.ts");
    let c = JSON.parse((await b.readString())!);
    c.campaign = r.campaign(c);
    c.earnedSkills.push(...u.CAREER_UTILITIES.map((u) => u.skills[0]));
    c.campaign.gold = 200;
    c.campaign.inventory.sunleaf = 8;
    c.campaign.inventory.softwood = 1;
    c.campaign.cleared = catalog.PLACES.find(
      (p) => p.id === "mossfall-path",
    )!.stages.slice(0, 2);
    c = w.takeWorldContract(c, "alderhaven-herbs");
    if (mode === "receipts") {
      c = w.completeWorldContract(c, "alderhaven-herbs");
      const old = new Date();
      old.setDate(old.getDate() - 32);
      c.campaign.world.receipts.push({
        id: "older-record",
        contractId: "alderhaven-herbs",
        at: old.toISOString(),
        gold: 25,
      });
    }
    if (["reserves", "travel", "expedition"].includes(mode)) {
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
    }
    if (mode === "travel" || mode === "expedition") {
      c.campaign.cleared = [
        ...catalog.PLACES.find((p) => p.id === "mossfall-path")!.stages,
      ];
      if (mode === "expedition") c = w.explore(c, "mossfall-path", () => 0.75);
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
test("Manufacturing can be learned with real career points and its combined bill never crafts or spends", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts"),
      d = await import("/src/domain.ts"),
      careers = await import("/src/careers.ts"),
      r = await import("/src/rpg.ts");
    let c = JSON.parse((await b.readString())!);
    c.profession = d.PROFESSIONS.find(
      (p) => careers.careerCategory(p).id === "manufacturing",
    )!;
    c.vocation = null;
    for (const daysAgo of [1, 0]) {
      const now = new Date();
      now.setDate(now.getDate() - daysAgo);
      const o = d
        .objectives(c)
        .find(
          (o) =>
            o.scope === "profession" &&
            o.careerCategory === "manufacturing" &&
            o.cadence === "daily" &&
            o.rank === "D",
        )!;
      c = d.completeTaken(d.takeRequest(c, o.id, now), o, now);
    }
    if (d.skillPointsAvailable(c, "profession:manufacturing") < 1)
      throw Error("No career point");
    c.campaign = r.campaign(c);
    c.campaign.gold = 200;
    c.campaign.inventory.softwood = 1;
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
  await page.getByRole("button", { name: /^Process Steps Lv\./ }).click();
  await page.getByRole("button", { name: /Purchase skill/ }).click();
  await page
    .getByRole("button", { name: "Use Forge Work Order", exact: true })
    .click();
  await expect(page.getByLabel("Field competency")).toHaveValue("work-order");
  await page.getByLabel("Plan Woodland Blade", { exact: true }).check();
  await page.getByLabel("Plan Woodland Armor", { exact: true }).check();
  const desk = page.getByLabel("Career fieldwork");
  await expect(desk).toContainText("2 planned crafts · 300 gold");
  await expect(desk).toContainText(
    "Softwood: 4 required · 1 carried · 3 short",
  );
  await expect(desk).toContainText("100 gold short");
  const after = await read(page);
  expect(after.campaign).toEqual(before.campaign);
  expect(after.baseStats).toEqual(before.baseStats);
  await desk
    .getByRole("button", { name: "Open blacksmith", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: /Blacksmith/ })).toBeVisible();
});
test("Creative folio inspects locked sketches and opens an accessible area without progressing it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  const before = await read(page);
  await tool(page, "folio");
  const desk = page.getByLabel("Career fieldwork");
  await expect(
    desk.getByRole("button", { name: /Briar Road.*2\/10 stages/ }),
  ).toBeVisible();
  await page
    .getByRole("group", { name: "Area sketches" })
    .getByRole("button", { name: /Willowmere Grove/ })
    .click();
  await expect(desk).toContainText("Clear the preceding route to enter");
  await expect(
    desk.getByRole("button", { name: "View area", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Folio region").selectOption("frost");
  await expect(desk).toContainText("Region not yet open");
  await page.getByLabel("Folio region").selectOption("mossfall");
  await page
    .getByRole("group", { name: "Area sketches" })
    .getByRole("button", { name: /Briar Road/ })
    .click();
  await desk.getByRole("button", { name: "View area", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Briar Road", exact: true }),
  ).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
test("Sales compares actual material offers without accepting or turning one in", async ({
  page,
}) => {
  await seed(page);
  const before = await read(page);
  await tool(page, "exchange");
  const desk = page.getByLabel("Career fieldwork");
  await expect(
    page.getByLabel("Exchange town").locator('option[value="brassford"]'),
  ).toHaveJSProperty("disabled", true);
  await page.getByLabel("Exchange material").selectOption("sunleaf");
  await expect(desk).toContainText("100 gold for 6 Sunleaf");
  await expect(desk).toContainText(
    "16.67 gold per material · 8 carried · 0 short",
  );
  await expect(desk).toContainText("Taken");
  await desk
    .getByRole("button", { name: "Open guild requests", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Guild requests", exact: true }),
  ).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
});
test("Administration reconciles actual receipt amounts, filters older turn-ins and exports the selected period", async ({
  page,
}) => {
  await seed(page, "receipts");
  const before = await read(page);
  await tool(page, "register");
  const desk = page.getByLabel("Career fieldwork");
  await expect(desk).toContainText("100 gold received");
  await page.getByLabel("Register period").selectOption("all");
  await expect(desk).toContainText("125 gold received");
  await expect(desk).toContainText("2 turn-ins · 1 commission type");
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export receipts", exact: true })
    .click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("guild-commission-receipts.txt");
  const stream = await download.createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString();
  expect(text).toContain("older-record");
  expect(text).toContain("125 gold received");
  await page.getByLabel("Register period").selectOption("7");
  await expect(desk).toContainText("100 gold received");
  expect((await read(page)).campaign).toEqual(before.campaign);
});
test("Hospitality and Sales visit the selected shops or commission board without restoring reserves", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, "travel");
  const before = await read(page);
  await tool(page, "concierge");
  const desk = page.getByLabel("Career fieldwork");
  await page.getByLabel("Concierge town").selectOption("frostholm");
  await expect(
    desk.getByRole("button", { name: "Visit Frostholm", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Concierge town").selectOption("brassford");
  await expect(desk).toContainText("Blacksmith · Tier 2");
  await expect(desk).toContainText("6 potions · 20 gold each");
  await desk
    .getByRole("button", { name: "Visit Brassford", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Brassford", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "General store", exact: true }),
  ).toBeVisible();
  const after = await read(page);
  expect(after.campaign.world.townId).toBe("brassford");
  expect(after.campaign.vitals).toEqual(before.campaign.vitals);
  expect(after.campaign.inventory).toEqual(before.campaign.inventory);
  expect(after.campaign.gold).toBe(before.campaign.gold);
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await tool(page, "exchange");
  await page.getByLabel("Exchange town").selectOption("alderhaven");
  await page
    .getByRole("button", { name: "Visit Alderhaven guild", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Guild requests", exact: true }),
  ).toBeVisible();
  const returned = await read(page);
  expect(returned.campaign.world.townId).toBe("alderhaven");
  expect(returned.campaign.vitals).toEqual(before.campaign.vitals);
});
test("General Practice shows party problems and accepted local work then opens the loadout", async ({
  page,
}) => {
  await seed(page, "reserves");
  const before = await read(page);
  await tool(page, "departure");
  const desk = page.getByLabel("Career fieldwork");
  await expect(desk).toContainText("Below 25% HP: Rowan");
  await expect(desk).toContainText("Fallen: Mira");
  await expect(desk).toContainText("1 accepted local commission");
  await expect(desk).toContainText("0 learned skills equipped");
  await desk
    .getByRole("button", { name: "Open skill loadout", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Equipped skills/ }),
  ).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
});
test("expedition folio closes without leaving, while a deliberate town visit ends it and retains HP and MP", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, "expedition");
  const before = await read(page);
  await page.getByRole("button", { name: "Fieldwork", exact: true }).click();
  await tool(page, "folio");
  await expect(
    page.getByRole("group", { name: "Area sketches" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  expect((await read(page)).campaign).toEqual(before.campaign);
  await page.getByRole("button", { name: "Fieldwork", exact: true }).click();
  await tool(page, "concierge");
  await page.getByLabel("Concierge town").selectOption("brassford");
  await page
    .getByRole("button", { name: "Visit Brassford", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Brassford", exact: true }),
  ).toBeVisible();
  const after = await read(page);
  expect(after.campaign.world.expedition).toBeUndefined();
  expect(after.campaign.world.townId).toBe("brassford");
  expect(after.campaign.vitals).toEqual(before.campaign.vitals);
  expect(after.campaign.inventory).toEqual(before.campaign.inventory);
});
