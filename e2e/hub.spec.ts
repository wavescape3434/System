import { test, expect, type Page } from "@playwright/test";
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
test("compact requests expose icons and rank, with work and rewards inside details", async ({
  page,
}) => {
  await sample(page);
  await nav(page, "Objectives");
  const cards = page.locator(".compact-request");
  expect(await cards.count()).toBeGreaterThan(0);
  expect((await cards.first().boundingBox())!.height).toBeLessThan(100);
  await expect(cards.first()).not.toContainText("XP");
  await expect(cards.first().getByLabel("class request")).toBeVisible();
  await expect(
    cards.first().getByLabel("Real world", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search requests").fill("Pushup");
  await page
    .getByRole("button", { name: "Open Strength board", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Show details for Pushup practice",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText("XP");
  await page.getByLabel("Choose request rank").selectOption("u-floor-push-20");
  await expect(page.getByRole("dialog")).toContainText("3 × 20");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Take request", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.locator(".compact-request.accepted")).toHaveCount(1);
});
test("guild allowance is claimable once and guild card links open the related sections", async ({
  page,
}) => {
  await sample(page);
  await expect(page.locator(".attributes-panel")).toHaveCount(0);
  await expect(
    page.getByText("BODY. MIND. HEART.", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("GALATIANS 6:9", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Open profession")).toContainText("Lv. 1");
  await expect(page.getByLabel("Open vocation")).toContainText("Lv. 1");
  await page
    .getByRole("button", { name: "Claim day 1 reward", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Claimed today", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Claimed today", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Open vocation", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Vocation", exact: true }),
  ).toHaveClass("active");
  await nav(page, "Guild");
  await page.getByLabel("Open profession", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Profession & credentials", exact: true }),
  ).toHaveClass("active");
  await nav(page, "Guild");
  await page.getByRole("button", { name: /OPEN SKILL REGISTER/ }).click();
  await expect(
    page.getByRole("button", { name: "Skill tree", exact: true }),
  ).toHaveClass("active");
});
test("winning continues straight to the next stage and pays once, exploration stays in the field", async ({
  page,
}) => {
  await sample(page);
  await nav(page, "Adventures");
  await page.getByRole("button", { name: /STAGE 1/ }).click();
  for (let i = 0; i < 40; i++) {
    if (
      await page
        .getByRole("heading", { name: "Victory", exact: true })
        .isVisible()
    )
      break;
    await page.getByRole("button", { name: "Attack", exact: true }).click();
  }
  await expect(page.getByLabel("Turn order")).toBeVisible();
  await expect(page.locator(".battle-party-hud")).toContainText("MP");
  await page
    .getByRole("button", { name: "Continue adventure", exact: false })
    .click();
  await expect(page.locator(".battle-title")).toContainText("Waystone patrol");
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(c.campaign.cleared).toHaveLength(1);
  expect(c.campaign.gold).toBeGreaterThan(0);
  expect(c.campaign.battle.claimed).toBe(false);
  expect(
    c.journeyEvents.filter((e: { kind: string }) => e.kind === "adventure"),
  ).toHaveLength(1);
  await page.evaluate(async () => {
    const { campaign } = await import("/src/rpg.ts"),
      { PLACES } = await import("/src/world-catalog.ts");
    const key = "the-guild.character.v1",
      c = JSON.parse(localStorage.getItem(key)!);
    c.campaign = {
      ...campaign(c),
      battle: undefined,
      cleared: PLACES[0].stages,
    };
    c.campaign.world.expedition = PLACES[0].id;
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Adventures");
  await expect(
    page.getByRole("button", { name: "Continue exploring", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "World map", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => {
    const values = [0.99, 0.7, 0, 0.5];
    let i = 0;
    Math.random = () => values[i++ % values.length];
  });
  await page
    .getByRole("button", { name: "Continue exploring", exact: true })
    .click();
  await expect(page.locator(".expedition-event")).toContainText("Found");
  await expect(
    page.getByRole("button", { name: "Continue exploring", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Return to map", exact: false })
    .click();
  await expect(
    page.getByRole("button", { name: "World map", exact: true }),
  ).toBeVisible();
});
test("phone tree starts readable, real two-touch pinch zooms out, Fit and node inspection remain available", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await nav(page, "Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page.getByRole("tab", { name: "Class", exact: true }).click();
  const zoom = () => page.locator(".tree-zoom>span").innerText();
  const readable = Number.parseInt(await zoom());
  expect(readable).toBeGreaterThanOrEqual(90);
  for (let i = 0; i < 4; i++)
    await page.getByLabel("Zoom in skill tree").click();
  const before = Number.parseInt(await zoom());
  await page.locator(".skill-tree-window").scrollIntoViewIfNeeded();
  const box = (await page.locator(".skill-tree-window").boundingBox())!,
    y = Math.max(100, Math.min(650, box.y + 180)),
    cx = box.x + box.width / 2;
  const session = await context.newCDPSession(page);
  await session.send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 2,
  });
  const points = (distance: number) => [
    { x: cx - distance, y, id: 1 },
    { x: cx + distance, y, id: 2 },
  ];
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: points(100),
  });
  for (const distance of [90, 75, 60, 45, 35])
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: points(distance),
    });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(async () => Number.parseInt(await zoom()))
    .toBeLessThan(before - 5);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Fit skill tree").click();
  await expect.poll(async () => Number.parseInt(await zoom())).toBeLessThan(50);
  await page
    .getByRole("button", { name: "Find Spearcraft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Spear Reach: locked", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Selected skill" }),
  ).toContainText("1 point");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("reminder preferences persist and the notification bell does not repeat a completed request", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Warrior requests", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View Warrior commission", exact: true })
    .click();
  await page.getByRole("button", { name: "Take request", exact: true }).click();
  await page
    .getByRole("button", { name: "Submit completed request", exact: true })
    .click();
  await page.getByLabel("Notifications", { exact: true }).click();
  await expect(page.getByRole("dialog")).not.toContainText(
    "Warrior commission",
  );
  await expect(page.getByRole("dialog")).toContainText("Login reward ready");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Claim", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toContainText(
    "Login reward ready",
  );
  await page.getByLabel("Close dialog").click();
  await nav(page, "Settings");
  await expect(page.getByLabel("Reminder time")).toHaveValue("21:00");
  await page.getByLabel("Reminder time").fill("20:15");
  await page.getByLabel("Weekly deadline reminder").uncheck();
  await page.reload();
  await nav(page, "Settings");
  await expect(page.getByLabel("Reminder time")).toHaveValue("20:15");
  await expect(page.getByLabel("Weekly deadline reminder")).not.toBeChecked();
  await expect(
    page.getByText(/Install the Android app for device reminders/),
  ).toBeVisible();
});

test("a first-point skill can be found in the accessible list, bought, equipped, and used in battle", async ({
  page,
}) => {
  await sample(page);
  await page.evaluate(() => {
    const key = "the-guild.character.v1",
      c = JSON.parse(localStorage.getItem(key)!);
    c.completions = [
      {
        id: "training",
        title: "Warrior training",
        at: new Date().toISOString(),
        period: "training",
        xp: 100,
        scope: "class",
        classId: "warrior",
        stat: "STR",
      },
    ];
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page.getByRole("tab", { name: "Class", exact: true }).click();
  await page.getByRole("button", { name: "Skill list", exact: true }).click();
  await page.getByLabel("Search skills").fill("Spear Reach");
  await page
    .locator(".accessible-skill-list")
    .getByRole("button", { name: /Spear Reach/ })
    .click();
  await page.getByRole("button", { name: /Purchase skill/ }).click();
  await expect(page.locator(".accessible-skill-list")).toContainText("Learned");
  await nav(page, "Adventures");
  await page
    .getByRole("button", { name: "Skill loadout", exact: true })
    .click();
  const card = page.locator(".skill-card").filter({
    has: page.getByRole("heading", { name: "Spear Reach", exact: true }),
  });
  await card.getByRole("button", { name: "Equip", exact: true }).click();
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page.getByRole("button", { name: /STAGE 1/ }).click();
  await page.getByRole("button", { name: /Spear Reach/ }).click();
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(
    c.skillPurchases.find((p: { id: string }) => p.id === "martial-spear-1")
      .cost,
  ).toBe(1);
  expect(c.campaign.battle.enemies[0].hp).toBeLessThan(
    c.campaign.battle.enemies[0].maxHp,
  );
});
