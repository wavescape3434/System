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
const seed = async (page: Page, mode = "strong") => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.locator(".app-shell").waitFor();
  await page.evaluate(async (mode) => {
    const b = await import("/e2e/browser-store.ts"),
      r = await import("/src/rpg.ts"),
      d = await import("/src/domain.ts"),
      w = await import("/src/world-catalog.ts");
    let c = JSON.parse((await b.readString())!);
    c.campaign = r.campaign(c);
    if (mode !== "locked") {
      c.baseStats = {
        STR: mode === "retreat" ? 30 : 1000,
        DEX: mode === "retreat" ? 30 : 1000,
        CON: mode === "retreat" ? 30 : 1000,
        INT: 30,
        WIS: 30,
        CHA: 30,
      };
      c.campaign.cleared = [...w.PLACES[0].stages];
      c.campaign.gold = 200;
      c.campaign.world.areas["mossfall-path"] = {
        visits: 7,
        sinceBoss: 6,
        ignored: 2,
        bossVictories: 0,
        pendingBoss: true,
        last: {
          id: "nearby-boss",
          at: new Date().toISOString(),
          placeId: "mossfall-path",
          kind: "boss",
          text: "Boss nearby",
          encounterId: "mossfall-path-roaming-boss",
          resolved: false,
        },
      };
      const units = r.adventureParty(c);
      c.campaign.vitals = {
        day: d.period("daily"),
        members: Object.fromEntries(
          units.map((u) => [
            u.id,
            {
              hp: u.id === "hero" ? u.maxHp - 10 : u.maxHp,
              mp: u.mp,
              maxHp: u.maxHp,
              maxMp: u.maxMp,
            },
          ]),
        ),
      };
    }
    await b.replaceString(JSON.stringify(c));
  }, mode);
  await page.reload();
  await nav(page, "Adventures");
  await page
    .getByRole("button", { name: "Guild requests", exact: true })
    .click();
  await page.getByRole("button", { name: "Elite hunts", exact: true }).click();
};
const win = async (page: Page) => {
  for (let i = 0; i < 30; i++) {
    const c = await read(page);
    if (c.campaign.battle.phase === "won") return;
    expect(c.campaign.battle.phase).toBe("player");
    const before = JSON.stringify(c.campaign.battle);
    await page.getByRole("button", { name: "Attack", exact: true }).click();
    await expect
      .poll(async () => JSON.stringify((await read(page)).campaign.battle))
      .not.toBe(before);
  }
  throw Error("Fixture did not win");
};
const failNextSave = (page: Page) =>
  page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    let fail = true;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "head" && fail) {
        fail = false;
        throw new DOMException("Simulated full storage", "QuotaExceededError");
      }
      return put.apply(this, args);
    };
  });
test("phone hunt board shows one inspected encounter, all four grades and regional locks", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, "locked");
  const before = await read(page);
  await expect(page.locator(".hunt-writ")).toHaveCount(1);
  await expect(
    page.getByRole("group", { name: "Hunt difficulty" }).getByRole("button"),
  ).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Begin hunt", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".hunt-writ")).toContainText(
    "Requires: clear all 10 stages of Briar Road",
  );
  await page.getByRole("button", { name: "Calamity", exact: true }).click();
  await expect(page.locator(".hunt-writ")).toContainText("2960 HP");
  await page.getByLabel("Hunt region").selectOption("frost");
  await expect(page.locator(".hunt-writ")).toContainText("Whitepine Trail");
  expect((await read(page)).campaign).toEqual(before.campaign);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
test("hunt survives reload with fixed enemy tactics and current reserves", async ({
  page,
}) => {
  await seed(page);
  const before = await read(page);
  await page.getByRole("button", { name: "Elite", exact: true }).click();
  await page.getByRole("button", { name: "Begin hunt", exact: true }).click();
  await expect(page.locator(".battlefield")).toBeVisible();
  const started = await read(page);
  expect(started.campaign.battle.enemies[0].maxHp).toBe(600);
  expect(started.campaign.battle.enemies[0].tactic).toBe("ravager");
  expect(started.campaign.battle.party[0].hp).toBe(
    before.campaign.vitals.members.hero.hp,
  );
  expect(started.campaign.world.lastHunt).toBe("mossfall-hunt-2");
  await page.reload();
  await nav(page, "Adventures");
  expect((await read(page)).campaign.battle).toEqual(started.campaign.battle);
  await expect(page.locator(".battlefield")).toBeVisible();
});
test("Hunt again pays once and immediately replays with earned reserves, items and base stats", async ({
  page,
}) => {
  await seed(page);
  const before = await read(page);
  await page.getByRole("button", { name: "Begin hunt", exact: true }).click();
  await win(page);
  const won = await read(page);
  await page.getByRole("button", { name: "Hunt again", exact: true }).click();
  await expect(page.locator(".battlefield")).toBeVisible();
  const after = await read(page);
  expect(after.campaign.gold).toBe(before.campaign.gold + 35);
  expect(after.campaign.inventory.sunleaf || 0).toBe(
    (before.campaign.inventory.sunleaf || 0) + 2,
  );
  expect(after.campaign.battle.party[0].hp).toBe(
    won.campaign.battle.party[0].hp,
  );
  expect(after.campaign.inventory.potion).toBe(won.campaign.inventory.potion);
  expect(after.baseStats).toEqual(before.baseStats);
  expect(after.completions).toEqual(before.completions);
  expect(after.campaign.world.areas["mossfall-path"]).toEqual(
    before.campaign.world.areas["mossfall-path"],
  );
});
test("retreat returns to the selected hunt without healing or resolving a roaming boss", async ({
  page,
}) => {
  await seed(page, "retreat");
  const before = await read(page);
  await page.getByRole("button", { name: "Elite", exact: true }).click();
  await page.getByRole("button", { name: "Begin hunt", exact: true }).click();
  await page.getByRole("button", { name: /^Guard/ }).click();
  await page.getByRole("button", { name: "Attack", exact: true }).click();
  await page.getByRole("button", { name: "Retreat", exact: true }).click();
  const ended = await read(page);
  await page.getByRole("button", { name: "Hunt board", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Elite", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const after = await read(page);
  expect(after.campaign.gold).toBe(before.campaign.gold);
  expect(after.campaign.vitals).toEqual(ended.campaign.vitals);
  expect(after.campaign.world.areas).toEqual(before.campaign.world.areas);
  await page.getByRole("button", { name: "Begin hunt", exact: true }).click();
  await page.getByRole("button", { name: "Retreat", exact: true }).click();
  await page
    .getByRole("button", { name: "Return to map", exact: true })
    .click();
  await expect(
    page
      .locator(".pixel-region-banner")
      .getByRole("heading", { name: "Mossfall Woods", exact: true }),
  ).toBeVisible();
});
test("failed reward save rolls back the payout and permits a single retry", async ({
  page,
}) => {
  await seed(page);
  const before = await read(page);
  await page.getByRole("button", { name: "Begin hunt", exact: true }).click();
  await win(page);
  await failNextSave(page);
  await page
    .getByRole("button", { name: "Claim rewards", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Last change wasn’t saved" }),
  ).toBeVisible();
  expect((await read(page)).campaign.gold).toBe(before.campaign.gold);
  expect((await read(page)).campaign.battle.claimed).toBe(false);
  await page
    .getByRole("button", { name: "Claim rewards", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Claim rewards", exact: true }),
  ).toHaveCount(0);
  expect((await read(page)).campaign.gold).toBe(before.campaign.gold + 35);
  await page.getByRole("button", { name: "Hunt board", exact: true }).click();
  expect((await read(page)).campaign.gold).toBe(before.campaign.gold + 35);
});
test("failed hunt start leaves the board and progress intact and can retry", async ({
  page,
}) => {
  await seed(page);
  const before = await read(page);
  await failNextSave(page);
  await page.getByRole("button", { name: "Begin hunt", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Last change wasn’t saved" }),
  ).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
  await expect(
    page.getByRole("button", { name: "Begin hunt", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Begin hunt", exact: true }).click();
  await expect(page.locator(".battlefield")).toBeVisible();
});

test("a recruited guardian can use party protection in an actual hunt", async ({
  page,
}) => {
  await seed(page);
  await page.getByRole("button", { name: "Party", exact: true }).click();
  const orin = page
    .locator(".companion-card")
    .filter({ has: page.getByRole("heading", { name: "Orin", exact: true }) });
  await orin.getByRole("button", { name: /Recruit/ }).click();
  await orin.getByRole("button", { name: /Add to party/ }).click();
  await page
    .getByRole("button", { name: "Guild requests", exact: true })
    .click();
  await page.getByRole("button", { name: "Elite hunts", exact: true }).click();
  await page.getByRole("button", { name: "Begin hunt", exact: true }).click();
  await page.getByRole("button", { name: /^Guard/ }).click();
  await page.getByRole("button", { name: /^Guard/ }).click();
  await page.getByRole("button", { name: /Hold the Line/ }).click();
  const c = await read(page);
  expect(
    c.campaign.battle.log.some((s: string) => s.includes("Hold the Line")),
  ).toBe(true);
  expect(c.campaign.roster).toContain("orin");
  expect(
    c.campaign.battle.party.find((u: { id: string }) => u.id === "orin").mp,
  ).toBeLessThan(
    c.campaign.battle.party.find((u: { id: string }) => u.id === "orin").maxMp,
  );
});
