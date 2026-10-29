import { test, expect, type Page } from "@playwright/test";
const sample = async (page: Page) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
};
test("paper requests show precise rank instructions, keep stat icons distinct and use the new guild emblem", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await expect(
    page.locator('.mobile-bottom-nav [data-guild-mark="true"]'),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .last()
    .click();
  await expect(page.locator(".stat-board-door")).toHaveCount(6);
  await page.getByLabel("Search requests").fill("Pushup");
  await page
    .getByRole("button", { name: "Open Strength board", exact: true })
    .click();
  await expect(
    page.locator('.request-focus-icon[data-stat="STR"]').first(),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Show details for Pushup practice",
      exact: true,
    })
    .click();
  const paper = page.getByRole("dialog");
  await expect(paper).toHaveClass(/request-paper/);
  await expect(paper.locator('img[src="/art/guild-crest.png"]')).toBeVisible();
  await page.getByLabel("Choose request rank").selectOption("u-floor-push-20");
  await expect(
    paper.getByRole("heading", { name: "Instructions", exact: true }),
  ).toBeVisible();
  await expect(paper.locator(".request-instructions")).toContainText(
    "2–3 minutes",
  );
  await expect(paper.locator(".request-variant-title")).toContainText(
    "Progressive pushup strength",
  );
  await paper
    .getByRole("button", { name: "Take request", exact: true })
    .click();
  await expect(
    paper.getByRole("button", {
      name: "Submit completed request",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("one current-stage panel advances, persists, and reaches exploration after the tenth stage", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Adventures", exact: true })
    .first()
    .click();
  await expect(page.locator(".pixel-stage-enter")).toHaveCount(1);
  await expect(page.locator(".pixel-stage-enter")).toContainText(
    "STAGE 1 / 10",
  );
  await page.locator(".pixel-stage-enter").click();
  for (let i = 0; i < 30; i++) {
    if (
      await page
        .getByRole("heading", { name: "Victory", exact: true })
        .isVisible()
    )
      break;
    await page.getByRole("button", { name: "Attack", exact: true }).click();
  }
  await page.getByRole("button", { name: /Return to map/ }).click();
  await expect(page.locator(".pixel-stage-enter")).toContainText(
    "STAGE 2 / 10",
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Adventures", exact: true })
    .first()
    .click();
  await expect(page.locator(".pixel-stage-enter")).toHaveCount(1);
  await expect(page.locator(".pixel-stage-enter")).toContainText(
    "STAGE 2 / 10",
  );
  await page.evaluate(async () => {
    // @ts-expect-error Vite imports this module in the browser.
    const { PLACES } = await import("/src/world-catalog.ts");
    const key = "the-guild.character.v1",
      c = JSON.parse(
        (await (await import("/e2e/browser-store.ts")).readString())!,
      );
    c.baseStats = { STR: 50, DEX: 50, CON: 50, INT: 50, WIS: 50, CHA: 50 };
    c.campaign.cleared = PLACES[0].stages.slice(0, 9);
    await (
      await import("/e2e/browser-store.ts")
    ).replaceString(JSON.stringify(c));
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Adventures", exact: true })
    .first()
    .click();
  await expect(page.locator(".pixel-stage-enter")).toContainText(
    "STAGE 10 / 10",
  );
  await page.locator(".pixel-stage-enter").click();
  for (let i = 0; i < 30; i++) {
    if (
      await page
        .getByRole("heading", { name: "Victory", exact: true })
        .isVisible()
    )
      break;
    await page.getByRole("button", { name: "Attack", exact: true }).click();
  }
  await page.evaluate(() => {
    Math.random = () => 0.9;
  });
  await page.getByRole("button", { name: /Continue exploring/ }).click();
  await expect(
    page.getByRole("button", { name: "Continue exploring", exact: true }),
  ).toBeVisible();
  const c = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
  expect(c.campaign.cleared).toHaveLength(10);
  expect(c.campaign.cleared).toContain("mossfall-boss");
  expect(c.completions).toHaveLength(0);
  await page.getByRole("button", { name: /Return to map/ }).click();
  await page.getByRole("button", { name: "Party", exact: true }).click();
  const orin = page.locator(".companion-card").filter({
    has: page.getByRole("heading", { name: "Orin", exact: true }),
  });
  await expect(
    orin.getByRole("button", { name: "Recruit", exact: true }),
  ).toBeEnabled();
});
