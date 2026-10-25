import { test, expect, type Page } from "@playwright/test";
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
const sample = async (page: Page) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
};
test("24 appearances preview without committing, filters work, and an alluring look persists into battle", async ({
  page,
}) => {
  await sample(page);
  await nav(page, "Settings");
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await expect(page.locator(".appearance-choice")).toHaveCount(24);
  await page
    .getByRole("button", { name: "Preview Moonsilk Dancer", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("the-guild.character.v1")!).appearance,
    ),
  ).toBeUndefined();
  await expect(
    page.locator('.appearance-preview [data-appearance="moonsilk-dancer"]'),
  ).toBeVisible();
  await page.getByLabel("Appearance silhouette").selectOption("Feminine");
  await page.getByLabel("Search appearances").fill("velvet");
  await expect(page.locator(".appearance-choice")).toHaveCount(1);
  await page.getByLabel("Search appearances").fill("");
  await page.getByLabel("Appearance silhouette").selectOption("All");
  await page
    .getByRole("button", { name: "Use Moonsilk Dancer", exact: false })
    .click();
  await page.reload();
  await nav(page, "Settings");
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await expect(
    page.locator('.appearance-preview [data-appearance="moonsilk-dancer"]'),
  ).toBeVisible();
  await nav(page, "Adventures");
  await page
    .getByRole("button", { name: /STAGE 1/ })
    .first()
    .click();
  await expect(
    page.locator('.party-line [data-appearance="moonsilk-dancer"]'),
  ).toBeVisible();
  await expect(
    page.locator('.party-line [data-appearance="ivory-cleric"]'),
  ).toBeVisible();
  await expect(
    page.locator('.turn-queue [data-appearance="moonsilk-dancer"]'),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Iron Cleave/ })).toBeVisible();
});
test("registration saves a selected character and closes the appearance chooser without progressing assessment", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Register character", exact: true })
    .click();
  await page.getByLabel("Adventurer name").fill("Ari");
  await page
    .getByRole("button", { name: "Choose appearance", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Preview Dusk Ronin", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use Dusk Ronin", exact: false })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator('.profile-appearance-summary [data-appearance="dusk-ronin"]'),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue to assessment", exact: true })
    .click();
  for (const name of [
    "Next: INT check",
    "Next: WIS check",
    "Next: CHA check",
    "View assessment results",
    "Review starting classes",
  ])
    await page.getByRole("button", { name, exact: true }).click();
  await page
    .getByRole("button", { name: "Create character", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("the-guild.character.v1")!).appearance,
    ),
  ).toBe("dusk-ronin");
});
test("phone roster and party chooser remain usable, retain selected style, and render without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await sample(page);
  await nav(page, "Adventures");
  await page.getByRole("button", { name: "Party", exact: true }).click();
  await page
    .getByRole("button", { name: "Character appearance", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Search appearances").fill("corsair");
  await page
    .getByRole("button", { name: "Preview Crimson Corsair", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use Crimson Corsair", exact: false })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page
    .getByRole("button", { name: /STAGE 1/ })
    .first()
    .click();
  await expect(
    page.locator('.party-line [data-appearance="crimson-corsair"]'),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
