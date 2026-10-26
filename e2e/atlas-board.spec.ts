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

test("universal requests require a stat board while class requests stay direct, and Taken gathers both", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await nav(page, "Objectives");
  await expect(page.locator(".stat-board-door")).toHaveCount(6);
  await expect(
    page.locator('.compact-request[data-scope="universal"]'),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "View Warrior commission", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open Strength board", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Strength board", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator('.compact-request:not([data-scope="universal"])')
      .count(),
  ).toBe(0);
  const stats = await page
    .locator(".request-focus-icon")
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-stat")));
  expect(stats.every((s) => s === "STR")).toBe(true);
  await page.getByLabel("Search requests").fill("Pushup");
  await page
    .getByRole("button", { name: "View Pushup practice", exact: true })
    .click();
  await page.getByRole("button", { name: "Take request", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /^Taken/ }).click();
  await expect(page.locator(".stat-board-door")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "View Pushup practice", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Guild board", exact: true }).click();
  await page
    .getByRole("button", { name: "Open Constitution board", exact: true })
    .click();
  await page.getByRole("button", { name: /^Weekly quests/ }).click();
  await page.reload();
  await nav(page, "Objectives");
  await expect(
    page.getByRole("heading", { name: "Constitution board", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("constellation styles retain alternative paths, selected panel navigates prerequisites, and goals survive reload", async ({
  page,
}) => {
  await sample(page);
  await nav(page, "Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page.getByRole("tab", { name: "Class", exact: true }).click();
  await page
    .getByRole("button", { name: "Find Spearcraft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Braced Point: locked", exact: true })
    .click();
  const panel = page.getByRole("complementary", { name: "Selected skill" });
  await expect(panel).toContainText("Alternative skills · choose one");
  await expect(
    panel.getByRole("button", { name: /Line Thrust/ }),
  ).toBeVisible();
  await expect(
    panel.getByRole("button", { name: /Hooking Strike/ }),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "Set skill goal", exact: true })
    .click();
  await expect(page.locator(".atlas-goal")).toContainText("Braced Point");
  await panel.getByRole("button", { name: /Hooking Strike/ }).click();
  await expect(
    panel.getByRole("heading", { name: "Hooking Strike", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close skill details", exact: true })
    .click();
  await expect(page.locator(".skill-node.on-route")).not.toHaveCount(0);
  await page.reload();
  await nav(page, "Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await expect(page.locator(".atlas-goal")).toContainText("Braced Point");
  await page.evaluate(() => {
    const key = "the-guild.character.v1",
      c = JSON.parse(localStorage.getItem(key)!);
    c.earnedSkills.push(
      "martial-spear-1",
      "martial-spear-2",
      "martial-spear-3",
    );
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await expect(
    page.locator(
      'path[data-child="martial-spear-3"][data-parent="martial-spear-2"]',
    ),
  ).toHaveClass(/learned/);
  await expect(
    page.locator(
      'path[data-child="martial-spear-3"][data-parent="martial-axe-2"]',
    ),
  ).not.toHaveClass(/learned/);
});
test("a skill can be learned and equipped from its phone panel without changing real stats", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await page.evaluate(() => {
    const key = "the-guild.character.v1",
      c = JSON.parse(localStorage.getItem(key)!);
    c.completions = [
      {
        id: "warrior-daily",
        title: "Warrior commission",
        at: new Date().toISOString(),
        period: "fixture",
        xp: 150,
        scope: "class",
        stat: "STR",
        classId: "warrior",
      },
    ];
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page.getByRole("tab", { name: "Class", exact: true }).click();
  await page
    .getByRole("button", { name: "Find Spearcraft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Spear Reach: available", exact: true })
    .click();
  const panel = page.getByRole("complementary", { name: "Selected skill" });
  await panel.getByRole("button", { name: /Purchase skill/ }).click();
  await expect(
    panel.getByRole("button", { name: "Learned", exact: true }),
  ).toBeDisabled();
  await panel.getByRole("button", { name: /Equip for adventures/ }).click();
  await expect(
    panel.getByRole("button", { name: "Unequip skill", exact: true }),
  ).toBeVisible();
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(
    c.skillPurchases.filter((p: { id: string }) => p.id === "martial-spear-1"),
  ).toHaveLength(1);
  expect(c.campaign.equippedSkills).toContain("martial-spear-1");
  expect(c.baseStats.STR).toBe(10);
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
