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
const seed = async (page: Page, mode = "damage") => {
  await sample(page);
  await page.evaluate(async (mode) => {
    const b = await import("/e2e/browser-store.ts"),
      r = await import("/src/rpg.ts"),
      d = await import("/src/domain.ts"),
      w = await import("/src/world.ts"),
      catalog = await import("/src/world-catalog.ts");
    let c = JSON.parse((await b.readString())!);
    if (mode === "seal") {
      const metrics = await import("/src/metrics.ts");
      c = d.createCharacter(
        "Rowan",
        { ...d.EMPTY_BASELINE, assessment: { ...metrics.EMPTY_ASSESSMENT } },
        "bard",
        "Explorer",
        true,
      );
    }
    c.campaign = r.campaign(c);
    c.campaign.gold = 500;
    c.campaign.inventory.softwood = 6;
    c.campaign.world.stock.alderhaven = { potion: 8, ether: 6 };
    if (mode !== "battle" && mode !== "seal") {
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
    }
    if (mode === "expedition") {
      c.campaign.cleared = [...catalog.PLACES[0].stages];
      c = w.explore(c, "mossfall-path", () => 0.75);
    }
    if (mode === "trade") c = w.takeWorldContract(c, "alderhaven-ore");
    if (mode === "battle") c = r.startBattle(c, "mossfall-1");
    await b.replaceString(JSON.stringify(c));
  }, mode);
  await page.reload();
  await nav(page, "Adventures");
};
const openSatchel = async (page: Page) => {
  await page.getByRole("button", { name: /^Supplies ·/ }).click();
  return page.getByRole("dialog", { name: "Supplies", exact: true });
};
test("phone satchel spends only requested items, retains the expedition and never revives a fallen ally", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, "expedition");
  const before = await read(page),
    dialog = await openSatchel(page);
  await dialog.getByRole("button", { name: "Use potion", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Use potion", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "Use ether", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Use ether", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Supply target").selectOption("mira");
  await expect(dialog).toContainText("Fallen · Full recovery at midnight");
  await expect(
    dialog.getByRole("button", { name: "Use potion", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Continue exploring", exact: true }),
  ).toBeVisible();
  const after = await read(page);
  expect(after.campaign.inventory.potion).toBe(
    before.campaign.inventory.potion - 1,
  );
  expect(after.campaign.inventory.ether).toBe(
    before.campaign.inventory.ether - 1,
  );
  expect(after.campaign.vitals.members.hero.hp).toBe(
    before.campaign.vitals.members.hero.maxHp,
  );
  expect(after.campaign.vitals.members.mira.hp).toBe(0);
  expect(after.baseStats).toEqual(before.baseStats);
  expect(after.completions).toEqual(before.completions);
  await page.reload();
  await nav(page, "Adventures");
  expect((await read(page)).campaign.vitals).toEqual(after.campaign.vitals);
});
test("shop quantities are clearable and a batch commits exact gold, stock and inventory once", async ({
  page,
}) => {
  await seed(page);
  const before = await read(page);
  await page
    .getByRole("button", { name: "Equipment & shop", exact: true })
    .click();
  const offer = page.getByRole("article", { name: "Healing potion shop" });
  await page.getByLabel("Potion quantity").fill("");
  await expect(offer.getByRole("alert")).toContainText("whole quantity");
  await page.getByLabel("Potion quantity").fill("3");
  await offer
    .getByRole("button", { name: "Buy 3 · 60 gold", exact: true })
    .click();
  await expect(offer).toContainText("Store stock: 5");
  const after = await read(page);
  expect(after.campaign.gold).toBe(before.campaign.gold - 60);
  expect(after.campaign.inventory.potion).toBe(
    before.campaign.inventory.potion + 3,
  );
  expect(after.campaign.vitals).toEqual(before.campaign.vitals);
  await page.getByLabel("Potion quantity").fill("6");
  await expect(offer).toContainText("1 more needed in stock");
  await expect(
    offer.getByRole("button", { name: "Buy 6 · 120 gold", exact: true }),
  ).toBeDisabled();
  expect((await read(page)).campaign).toEqual(after.campaign);
});
test("delivery shows the smith tradeoff before consuming the listed materials", async ({
  page,
}) => {
  await seed(page, "trade");
  const before = await read(page);
  await page
    .getByRole("button", { name: "Guild requests", exact: true })
    .click();
  const card = page.locator(".pixel-contract-grid article").filter({
    has: page.getByRole("heading", {
      name: "Alderhaven smith's commission",
      exact: true,
    }),
  });
  await expect(card).toContainText("6 carried → 1 remaining");
  await card.getByText("Smith recipes affected · 6", { exact: true }).click();
  await expect(card).toContainText("Woodland Seal · 2 Softwood required");
  await card
    .getByRole("button", { name: "Turn in request", exact: true })
    .click();
  const after = await read(page);
  expect(after.campaign.inventory.softwood).toBe(1);
  expect(after.campaign.gold).toBe(before.campaign.gold + 100);
  expect(after.campaign.vitals).toEqual(before.campaign.vitals);
});
test("a town seal can be forged and equipped for combat CHA without changing base CHA", async ({
  page,
}) => {
  await seed(page, "seal");
  const before = await read(page);
  await page
    .getByRole("button", { name: "Equipment & shop", exact: true })
    .click();
  const card = page
    .getByRole("group", { name: "Blacksmith recipes", exact: true })
    .locator("article")
    .filter({
      has: page.getByRole("heading", { name: "Woodland Seal", exact: true }),
    });
  await expect(card).toContainText("+3 combat CHA");
  await card
    .getByRole("button", { name: "Forge · 150 gold", exact: true })
    .click();
  await card.getByRole("button", { name: "Equip", exact: true }).click();
  const after = await read(page);
  expect(after.campaign.equipment).toContain("alderhaven-seal");
  expect(after.campaign.gold).toBe(before.campaign.gold - 150);
  expect(after.campaign.inventory.softwood).toBe(
    before.campaign.inventory.softwood - 2,
  );
  expect(after.baseStats).toEqual(before.baseStats);
  expect(
    await page.evaluate(async () => {
      const b = await import("/e2e/browser-store.ts"),
        r = await import("/src/rpg.ts");
      return r.combatAttributes(JSON.parse((await b.readString())!)).CHA;
    }),
  ).toBe(15);
});
test("full-target battle items are disabled and preserve stock and the current turn", async ({
  page,
}) => {
  await seed(page, "battle");
  const before = await read(page);
  await expect(page.getByRole("button", { name: /^Potion ×/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /^Ether ×/ })).toBeDisabled();
  expect((await read(page)).campaign).toEqual(before.campaign);
});
test("failed satchel persistence rolls back both recovery and item spending", async ({
  page,
}) => {
  await seed(page);
  const before = await read(page),
    dialog = await openSatchel(page);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "head")
        throw new DOMException("Storage full", "QuotaExceededError");
      return put.apply(this, args);
    };
  });
  await dialog.getByRole("button", { name: "Use potion", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Last change wasn’t saved" }),
  ).toBeVisible();
  const after = await read(page);
  expect(after.campaign.inventory).toEqual(before.campaign.inventory);
  expect(after.campaign.vitals).toEqual(before.campaign.vitals);
  await page.reload();
  expect((await read(page)).campaign.vitals).toEqual(before.campaign.vitals);
});
