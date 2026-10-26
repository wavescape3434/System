import { test, expect, type Page } from "@playwright/test";
test.use({ timezoneId: "America/Denver" });
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
async function footerVisible(page: Page) {
  const box = await page
    .getByRole("contentinfo", { name: "Request actions" })
    .boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThan(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height - 10,
  );
}
test("phone class/career shortcuts and parchment actions stay accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  const shortcut = page.getByRole("button", {
    name: "Warrior requests",
    exact: true,
  });
  expect((await shortcut.boundingBox())!.y).toBeLessThan(550);
  await shortcut.click();
  await expect(page.getByLabel("Objective category")).toHaveValue("class");
  await expect(page.getByLabel("Universal request boards")).toHaveCount(0);
  await page
    .getByRole("button", { name: /Show details for/ })
    .first()
    .click();
  await footerVisible(page);
  await page.getByRole("button", { name: "Take request", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Submit completed request", exact: true }),
  ).toBeEnabled();
  await footerVisible(page);
  await page.locator(".request-scroll").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await footerVisible(page);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await nav(page, "Guild");
  await expect(page.getByLabel("Current work")).toContainText(
    "Warrior commission",
  );
  await page
    .getByRole("button", { name: "Networking requests", exact: true })
    .click();
  await expect(page.getByLabel("Objective category")).toHaveValue("career");
  await expect(page.getByLabel("Universal request boards")).toHaveCount(0);
  await expect(page.locator(".compact-request").first()).toBeVisible();
});

test("optional walk results survive reload, feed Journey and count once toward calendar goals", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      key = "the-guild.character.v1";
    let c = JSON.parse(localStorage.getItem(key)!);
    for (const id of [
      "habit-walk-weekly-f",
      "habit-walk-monthly-f",
      "u-walk-5",
    ])
      c = d.takeRequest(c, id);
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await page
    .getByLabel("Current work")
    .getByRole("button", { name: /Walk for 5 minutes/ })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText("Walking week · 3 days · +1 practice day", {
      exact: true,
    }),
  ).toBeAttached();
  await dialog
    .getByRole("button", { name: "Add results (optional)", exact: true })
    .click();
  await dialog
    .getByLabel("Exercise / variation", { exact: true })
    .fill("Walking");
  await dialog.getByLabel("Duration (minutes)", { exact: true }).fill("6");
  await dialog.getByLabel("Distance (km)", { exact: true }).fill("0.4");
  await dialog
    .getByLabel("Result / technique note", { exact: true })
    .fill("Riverside loop");
  await footerVisible(page);
  await dialog
    .getByRole("button", { name: "Submit completed request", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(stored.completions).toHaveLength(1);
  expect(stored.completions[0].xp).toBe(10);
  expect(stored.completions[0].result).toEqual({
    exercise: "Walking",
    minutes: 6,
    distanceKm: 0.4,
    output: "Riverside loop",
  });
  await nav(page, "Journey");
  await expect(page.getByLabel("Journey chronicle")).toContainText(
    "Riverside loop",
  );
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  const charts = page.getByLabel("Practice results", { exact: true });
  await expect(
    charts.getByRole("heading", { name: "Walking · duration", exact: true }),
  ).toBeVisible();
  await expect(
    charts.getByRole("heading", { name: "Walking · distance", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test("blank results remain optional and invalid measured results cannot be submitted", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await sample(page);
  await page
    .getByRole("button", { name: "Warrior requests", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Show details for/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Take request", exact: true }).click();
  await page
    .getByRole("button", { name: "Add results (optional)", exact: true })
    .click();
  await page
    .getByLabel("Reps per set (or total without sets)", { exact: true })
    .fill("12");
  await expect(page.getByRole("alert")).toContainText("name the exercise");
  await expect(
    page.getByRole("button", { name: "Submit completed request", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Reps per set (or total without sets)", { exact: true })
    .fill("");
  await footerVisible(page);
  await page
    .getByRole("button", { name: "Submit completed request", exact: true })
    .click();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(stored.completions).toHaveLength(1);
  expect(stored.completions[0].result).toBeUndefined();
});

test("HP and MP carry through Continue and recover at local midnight while the app stays open", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2027-02-10T23:59:50-07:00") });
  await sample(page);
  await nav(page, "Adventures");
  await page.getByRole("button", { name: /STAGE 1/ }).click();
  // Use a class technique through the battle commands, then finish the encounter.
  await page.getByRole("button", { name: /^Iron Cleave/ }).click();
  for (
    let i = 0;
    i < 40 &&
    !(await page
      .getByRole("heading", { name: "Victory", exact: true })
      .isVisible());
    i++
  )
    await page.getByRole("button", { name: "Attack", exact: true }).click();
  const before = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("the-guild.character.v1")!,
    ).campaign.battle.party.map((u: { hp: number; mp: number }) => [
      u.hp,
      u.mp,
    ]),
  );
  await page.getByRole("button", { name: /Continue adventure/ }).click();
  const after = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem("the-guild.character.v1")!,
    ).campaign.battle.party.map((u: { hp: number; mp: number }) => [
      u.hp,
      u.mp,
    ]),
  );
  expect(after).toEqual(before);
  const enemies = await page.evaluate(() =>
    JSON.stringify(
      JSON.parse(localStorage.getItem("the-guild.character.v1")!).campaign
        .battle.enemies,
    ),
  );
  await page.clock.runFor(11000);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("the-guild.character.v1")!).campaign
            .vitals.day,
      ),
    )
    .toBe("2027-02-11");
  const rested = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("the-guild.character.v1")!).campaign
        .battle,
  );
  expect(
    rested.party.every(
      (u: { hp: number; maxHp: number; mp: number; maxMp: number }) =>
        u.hp === u.maxHp && u.mp === u.maxMp,
    ),
  ).toBe(true);
  expect(JSON.stringify(rested.enemies)).toBe(enemies);
  await page.reload();
  await nav(page, "Adventures");
  await expect(page.getByLabel("Turn order")).toBeVisible();
});
