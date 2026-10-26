import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
const sample = async (page: Page) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
};
const nav = async (page: Page, name: string) => {
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
async function clearedFixture(page: Page) {
  await page.evaluate(async () => {
    const { campaign } = await import("/src/rpg.ts"),
      { PLACES } = await import("/src/world-catalog.ts");
    const key = "the-guild.character.v1",
      c = JSON.parse(localStorage.getItem(key)!);
    c.campaign = { ...campaign(c), cleared: [...PLACES[0].stages], gold: 300 };
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
}
async function finishBattle(page: Page) {
  for (let i = 0; i < 50; i++) {
    const claim = page.getByRole("button", {
      name: "Claim rewards",
      exact: false,
    });
    if (await claim.isVisible()) {
      await claim.click();
      await page
        .getByRole("button", { name: "Return to map", exact: false })
        .click();
      return;
    }
    await page.getByRole("button", { name: "Attack", exact: true }).click();
  }
  throw Error("Battle did not finish");
}
test("one request card chooses a rank and pins the group across reload", async ({
  page,
}) => {
  await sample(page);
  await nav(page, "Objectives");
  await page.getByLabel("Search requests").fill("Pushup");
  await page
    .getByRole("button", { name: "Open Strength board", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "View Pushup practice", exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Pin Pushup practice", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "View Pushup practice",
      exact: true,
    })
    .click();
  await page.getByLabel("Choose request rank").selectOption("u-floor-push-20");
  await expect(page.getByRole("dialog")).toContainText("3 × 20");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Take request", exact: true })
    .click();
  await expect(page.getByLabel("Choose request rank")).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload();
  await nav(page, "Objectives");
  await page.getByRole("button", { name: /^Pinned/ }).click();
  await page
    .getByRole("button", { name: "Open Strength board", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "View Pushup practice", exact: true }),
  ).toBeVisible();
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(
    c.takenRequests.find((r: { id: string }) => r.id === "u-floor-push-20")
      .rank,
  ).toBe("C");
  expect(c.favoriteRequests).toHaveLength(1);
});
test("weekly rank selection counts walking before acceptance in the same week", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2027-02-06T18:00:00Z") });
  await sample(page);
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts");
    const key = "the-guild.character.v1";
    let c = JSON.parse(localStorage.getItem(key)!);
    for (const day of [1, 2, 3, 4, 5]) {
      const at = new Date(Date.UTC(2027, 1, day, 18));
      c = d.takeRequest(c, "u-walk-5", at);
      c = d.completeTaken(
        c,
        d.takenObjectives(c, at).find((o) => o.id === "u-walk-5")!,
        at,
      );
    }
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Objectives");
  await page.getByRole("button", { name: /^Weekly quests/ }).click();
  await page.getByLabel("Search requests").fill("Walking week");
  await page
    .getByRole("button", { name: "Open Constitution board", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View Walking week", exact: true })
    .click();
  await page
    .getByLabel("Choose request rank")
    .selectOption("habit-walk-weekly-e");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Take request", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("5 / 5 practice days");
  await page
    .getByRole("button", { name: "I completed this objective", exact: true })
    .click();
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(c.completions.at(-1).xp).toBe(100);
});
test("boss discovery, leaving, persisted danger and a true ambush work through the world UI", async ({
  page,
}) => {
  test.setTimeout(60000);
  await sample(page);
  await clearedFixture(page);
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.reload();
  await nav(page, "Adventures");
  await page
    .getByRole("button", { name: "Explore Briar Road", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Challenge boss", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Leave the boss", exact: true })
    .click();
  await expect(
    page.getByText("Ambush chance: 16%", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await nav(page, "Adventures");
  await page
    .getByRole("button", { name: "Continue exploring", exact: true })
    .click();
  await page.getByText("Combat log", { exact: true }).click();
  await expect(page.getByRole("log")).toContainText("Ambush!");
  const ambushed = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(ambushed.campaign.battle.source.kind).toBe("ambush");
  expect(
    ambushed.campaign.battle.party.some(
      (p: { hp: number; maxHp: number }) => p.hp < p.maxHp,
    ),
  ).toBe(true);
  await finishBattle(page);
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(c.campaign.world.areas["mossfall-path"].pendingBoss).toBe(false);
  expect(c.campaign.world.areas["mossfall-path"].bossVictories).toBe(1);
  expect(c.completions).toHaveLength(0);
});
test("gathering herbs and turning in a commission replenishes an empty town store", async ({
  page,
}) => {
  await sample(page);
  await clearedFixture(page);
  await nav(page, "Adventures");
  await page
    .getByRole("button", { name: "Equipment & shop", exact: true })
    .click();
  const potion = page.locator(".pixel-shop-grid article").filter({
    has: page.getByRole("heading", { name: "Healing potion", exact: true }),
  });
  await expect(
    potion.getByRole("button", { name: "Buy · 20 gold", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Guild requests", exact: true })
    .click();
  const request = page.locator(".pixel-contract-grid article").filter({
    has: page.getByRole("heading", {
      name: "Alderhaven clinic supplies",
      exact: true,
    }),
  });
  await request
    .getByRole("button", { name: "Take request", exact: true })
    .click();
  await page.getByRole("button", { name: "World map", exact: true }).click();
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      const values = [0.99, 0.6, 0, 0.99];
      let i = 0;
      Math.random = () => values[i++ % values.length];
    });
    await page
      .getByRole("button", {
        name: i === 0 ? "Explore Briar Road" : "Continue exploring",
        exact: true,
      })
      .click();
  }
  await page
    .getByRole("button", { name: "Return to map", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Guild requests", exact: true })
    .click();
  await request
    .getByRole("button", { name: "Turn in request", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Equipment & shop", exact: true })
    .click();
  await expect(potion).toContainText("Store stock: 8");
  await potion
    .getByRole("button", { name: "Buy · 20 gold", exact: true })
    .click();
  await expect(potion).toContainText("Store stock: 7");
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(c.campaign.inventory.sunleaf).toBe(0);
  expect(c.campaign.world.receipts.at(-1).contractId).toBe("alderhaven-herbs");
});
test("required hybrid objectives unlock after the actual adventure delivery", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2027-02-06T18:00:00Z") });
  await sample(page);
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      r = await import("/src/rpg.ts");
    const key = "the-guild.character.v1";
    let c = JSON.parse(localStorage.getItem(key)!);
    for (const day of [1, 2, 3]) {
      const at = new Date(Date.UTC(2027, 1, day, 18));
      c = d.takeRequest(c, "u-bible-recall", at);
      c = d.completeTaken(
        c,
        d.takenObjectives(c, at).find((o) => o.id === "u-bible-recall")!,
        at,
      );
    }
    c.campaign = {
      ...r.campaign(c),
      inventory: { ...r.campaign(c).inventory, sunleaf: 6 },
    };
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  const open = async () => {
    await nav(page, "Objectives");
    await page.getByRole("button", { name: /^Weekly quests/ }).click();
    await page.getByLabel("Objective category").selectOption("hybrid");
    await page.getByLabel("Search requests").fill("Chapel");
    await page
      .getByRole("button", { name: "Open Wisdom board", exact: true })
      .click();
    await page
      .getByRole("button", { name: "View Chapel supplies", exact: true })
      .click();
  };
  await open();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Take request", exact: true })
    .click();
  for (const title of [
    "Complete the real-world practice",
    "Review and record the outcome",
  ])
    await page.getByRole("button", { name: title, exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "I completed this objective",
      exact: true,
    }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await nav(page, "Adventures");
  await page
    .getByRole("button", { name: "Guild requests", exact: true })
    .click();
  const request = page.locator(".pixel-contract-grid article").filter({
    has: page.getByRole("heading", {
      name: "Alderhaven clinic supplies",
      exact: true,
    }),
  });
  await request
    .getByRole("button", { name: "Take request", exact: true })
    .click();
  await request
    .getByRole("button", { name: "Turn in request", exact: true })
    .click();
  await open();
  await expect(
    page.getByRole("button", {
      name: "I completed this objective",
      exact: true,
    }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "I completed this objective", exact: true })
    .click();
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(c.completions.at(-1).id).toBe("hybrid-chapel");
  expect(c.completions.at(-1).xp).toBe(600);
});
test("pixel map, town shops and commissions fit a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await nav(page, "Adventures");
  for (const name of ["World map", "Equipment & shop", "Guild requests"]) {
    await page.getByRole("button", { name, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await expect(
    page.getByRole("heading", {
      name: "Alderhaven clinic supplies",
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const r = await import("/src/rpg.ts");
    const key = "the-guild.character.v1";
    let c = JSON.parse(localStorage.getItem(key)!);
    c.campaign = {
      ...r.campaign(c),
      cleared: ["mossfall-boss"],
      roster: ["mira", "orin"],
      party: ["mira", "orin"],
    };
    c = r.startBattle(c, "mossfall-1");
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Adventures");
  const boxes = await page.evaluate(() => ({
    enemies: [...document.querySelectorAll(".enemy-line .fighter")].map((e) => {
      const r = e.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    }),
    party: [...document.querySelectorAll(".party-line .fighter")].map((e) => {
      const r = e.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    }),
  }));
  const spriteBounds = await page.evaluate(() => {
    const stage = document
      .querySelector(".battlefield")!
      .getBoundingClientRect();
    return {
      left: stage.left,
      right: stage.right,
      sprites: [
        ...document.querySelectorAll(".party-line .humanoid-sprite"),
      ].map((n) => {
        const r = n.getBoundingClientRect();
        return { left: r.left, right: r.right };
      }),
    };
  });
  expect(spriteBounds.sprites).toHaveLength(3);
  for (const sprite of spriteBounds.sprites) {
    expect(sprite.left).toBeGreaterThanOrEqual(spriteBounds.left);
    expect(sprite.right).toBeLessThanOrEqual(spriteBounds.right);
  }
  expect(boxes.party).toHaveLength(3);
  expect(Math.min(...boxes.party.map((r) => r.left))).toBeGreaterThan(
    Math.max(...boxes.enemies.map((r) => r.right)),
  );
  for (const box of [...boxes.party, ...boxes.enemies]) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(390);
  }
});
