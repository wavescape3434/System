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
const read = (page: Page) =>
  page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
const seed = async (page: Page, mode = "town") => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.locator(".app-shell").waitFor();
  await page.evaluate(async (mode) => {
    const b = await import("/e2e/browser-store.ts"),
      r = await import("/src/rpg.ts"),
      d = await import("/src/domain.ts");
    let c = JSON.parse((await b.readString())!);
    c.campaign = r.campaign(c);
    c.campaign.gold = 2000;
    c.campaign.inventory.sunleaf = 20;
    c.campaign.inventory.softwood = 20;
    c = r.equip(r.buy(c, "alderhaven-blade"), "alderhaven-blade");
    c = r.equip(r.buy(c, "alderhaven-armor"), "alderhaven-armor");
    const units = r.adventureParty(c);
    c.campaign!.vitals = {
      day: d.period("daily"),
      members: Object.fromEntries(
        units.map((u) => [
          u.id,
          {
            hp: u.id === "hero" ? 1 : 0,
            mp: 0,
            maxHp: u.maxHp,
            maxMp: u.maxMp,
          },
        ]),
      ),
    };
    if (mode === "battle") {
      const w = await import("/src/workshop.ts");
      c = w.brew(c, "greater-potion");
      c = r.startBattle(c, "mossfall-1");
    }
    await b.replaceString(JSON.stringify(c));
  }, mode);
  await page.reload();
  await nav(page, "Adventures");
};
const shop = (page: Page) =>
  page.getByRole("button", { name: "Equipment & shop", exact: true }).click();
test("phone apothecary shows precise batch costs, saves brews and uses them without restoring fallen allies", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await shop(page);
  const before = await read(page),
    offer = page.getByRole("article", { name: "Potion brewing", exact: true });
  await page.getByLabel("potion brew quantity", { exact: true }).fill("");
  await expect(offer.getByRole("alert")).toContainText("whole quantity");
  await page.getByLabel("potion brew quantity", { exact: true }).fill("2");
  await expect(offer).toContainText("4 Sunleaf · 20 carried → 16 remaining");
  await offer
    .getByRole("button", { name: "Brew 2 · 200 gold", exact: true })
    .click();
  await expect(offer).toContainText("Carried: 2");
  const brewed = await read(page);
  expect(brewed.campaign.gold).toBe(before.campaign.gold - 200);
  expect(brewed.campaign.inventory.sunleaf).toBe(16);
  expect(brewed.campaign.world.stock).toEqual(before.campaign.world.stock);
  await page.reload();
  await nav(page, "Adventures");
  await page.getByRole("button", { name: /^Supplies ·/ }).click();
  const dialog = page.getByRole("dialog", { name: "Supplies", exact: true });
  await dialog
    .getByRole("button", { name: "Use greater potion", exact: true })
    .click();
  await expect(dialog).toContainText("Greater potion ×1");
  const after = await read(page);
  expect(after.campaign.vitals.members.hero.hp).toBeGreaterThan(1);
  expect(after.campaign.inventory["greater-potion"]).toBe(1);
  expect(after.baseStats).toEqual(before.baseStats);
  expect(after.completions).toEqual(before.completions);
  await page.getByLabel("Supply target").selectOption("mira");
  await expect(
    dialog.getByRole("button", { name: "Use greater potion", exact: true }),
  ).toBeDisabled();
});
test("tempering previews actual combat changes and saves rank without healing", async ({
  page,
}) => {
  await seed(page);
  await shop(page);
  const before = await read(page),
    bench = page.getByRole("region", { name: "Tempering bench", exact: true });
  await page.getByLabel("Temper equipment").selectOption("alderhaven-armor");
  await expect(bench).toContainText("Temper +0 / +5 · +3 combat CON");
  await expect(bench).toContainText("Next: +1 · +4 combat CON");
  await bench
    .getByRole("button", { name: "Temper +1 · 300 gold", exact: true })
    .click();
  await expect(bench).toContainText("Temper +1 / +5");
  const after = await read(page);
  expect(after.campaign.gold).toBe(before.campaign.gold - 300);
  expect(after.campaign.inventory.softwood).toBe(
    before.campaign.inventory.softwood - 3,
  );
  expect(after.campaign.gearUpgrades["alderhaven-armor"]).toBe(1);
  expect(after.campaign.vitals.members.hero.hp).toBe(1);
  expect(after.campaign.vitals.members.mira.hp).toBe(0);
  expect(after.baseStats).toEqual(before.baseStats);
  await page.reload();
  await nav(page, "Adventures");
  await shop(page);
  await page.getByLabel("Temper equipment").selectOption("alderhaven-armor");
  await expect(bench).toContainText("Temper +1 / +5");
});
test("locked Royal recipes and material shortages disable brewing before spending", async ({
  page,
}) => {
  await seed(page);
  await shop(page);
  const before = await read(page),
    offer = page.getByRole("article", { name: "Potion brewing", exact: true });
  await page
    .getByLabel("potion brew grade", { exact: true })
    .selectOption("royal");
  await expect(offer).toContainText("Requires an Adept or better apothecary");
  await expect(
    offer.getByRole("button", { name: "Brew 1 · 400 gold", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("potion brew grade", { exact: true })
    .selectOption("greater");
  await page.getByLabel("potion brew quantity", { exact: true }).fill("11");
  await expect(offer).toContainText("2 short");
  await expect(
    offer.getByRole("button", { name: "Brew 11 · 1100 gold", exact: true }),
  ).toBeDisabled();
  expect((await read(page)).campaign).toEqual(before.campaign);
});
test("brewed battle command consumes a carried supply and persists its recovery", async ({
  page,
}) => {
  await seed(page, "battle");
  const before = await read(page);
  await expect(page.locator(".turn-status")).toContainText(
    `Ally: ${before.name}`,
  );
  await page
    .getByRole("button", { name: "Greater potion ×1", exact: true })
    .click();
  const after = await read(page);
  expect(after.campaign.inventory["greater-potion"]).toBe(0);
  expect(after.campaign.battle.items["greater-potion"]).toBe(0);
  expect(after.campaign.vitals.members.hero.hp).toBeGreaterThan(1);
  expect(after.completions).toEqual(before.completions);
});
test("failed workshop saves roll back gold, materials, brew inventory and upgrade rank", async ({
  page,
}) => {
  await seed(page);
  await shop(page);
  const before = await read(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore["put"]>
    ) {
      if (this.name === "head")
        throw new DOMException("Simulated quota", "QuotaExceededError");
      return original.apply(this, args);
    };
  });
  await page
    .getByRole("region", { name: "Tempering bench", exact: true })
    .getByRole("button", { name: "Temper +1 · 300 gold", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Last change wasn’t saved" }),
  ).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
  await page
    .getByRole("article", { name: "Potion brewing", exact: true })
    .getByRole("button", { name: "Brew 1 · 100 gold", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Last change wasn’t saved" }),
  ).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
});
