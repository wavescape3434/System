import { test, expect } from "@playwright/test";
const sample = async (page: import("@playwright/test").Page) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
};
const nav = async (page: import("@playwright/test").Page, name: string) => {
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
test("registration has imperial feet and inches, explicit maxima, sequential tests, and no questions before Start", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Register character", exact: true })
    .click();
  await page.getByLabel("Adventurer name").fill("Ari");
  await page
    .getByRole("button", { name: "Continue to assessment", exact: true })
    .click();
  await page.getByLabel("Assessment units").selectOption("imperial");
  await page.getByLabel("Height (feet)", { exact: true }).fill("5");
  await page.getByLabel("Height (inches)", { exact: true }).fill("11");
  await page
    .getByLabel("Maximum consecutive pushups (repetitions)", { exact: true })
    .fill("20");
  await page.getByLabel("Assessment units").selectOption("metric");
  await expect(page.getByLabel("Height (cm)", { exact: true })).toHaveValue(
    "180.3",
  );
  await page.getByLabel("Assessment units").selectOption("imperial");
  await page
    .getByRole("button", { name: "Next: INT check", exact: true })
    .click();
  await expect(page.locator(".check-options")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start INT check", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start INT check", exact: true })
    .click();
  await expect(page.locator(".check-options")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review starting classes", exact: true }),
  ).toHaveCount(0);
  for (let i = 0; i < 5; i++) {
    await page.locator(".check-options button").first().click();
    await page
      .getByRole("button", {
        name: i < 4 ? "Next question" : "Finish INT check",
        exact: true,
      })
      .click();
  }
  await page
    .getByRole("button", { name: "Next: WIS check", exact: true })
    .click();
  await expect(page.locator(".check-options")).toHaveCount(0);
  await expect(page.getByText(/James 1:19|KJV|swift to hear/)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Next: CHA check", exact: true })
    .click();
  await expect(page.locator(".check-options")).toHaveCount(0);
  await page
    .getByRole("button", { name: "View assessment results", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review starting classes", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create character", exact: true })
    .click();
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(c.baseline.assessment.heightCm).toBeCloseTo(180.34, 2);
  expect(c.preferences.units).toBe("imperial");
  expect(c.assessmentFormsSeen).toContain("int-v2-0-c1");
});
test("reassessment remembers started forms and rotates questions even after leaving and returning", async ({
  page,
}) => {
  await sample(page);
  await nav(page, "Settings");
  await page.getByRole("button", { name: "Assessment", exact: true }).click();
  await page.getByRole("button", { name: "WIS", exact: true }).click();
  await expect(page.locator(".check-options")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Start WIS check", exact: true })
    .click();
  const first = await page.locator(".mind-check>h3").textContent();
  await nav(page, "Guild Card");
  await nav(page, "Settings");
  await page.getByRole("button", { name: "Assessment", exact: true }).click();
  await page.getByRole("button", { name: "WIS", exact: true }).click();
  await expect(page.locator(".check-options")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Start WIS check", exact: true })
    .click();
  expect(await page.locator(".mind-check>h3").textContent()).not.toBe(first);
  await page.reload();
  await nav(page, "Settings");
  await page.getByRole("button", { name: "Assessment", exact: true }).click();
  await page.getByRole("button", { name: "WIS", exact: true }).click();
  await page
    .getByRole("button", { name: "Start WIS check", exact: true })
    .click();
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(c.assessmentFormsSeen).toEqual([
    "wis-v2-0-c1",
    "wis-v2-1-c1",
    "wis-v2-2-c1",
  ]);
});
test("a class examination holds the stat milestone until the measured result improves", async ({
  page,
}) => {
  await sample(page);
  await page.evaluate(() => {
    const key = "the-guild.character.v1",
      c = JSON.parse(localStorage.getItem(key)!);
    c.createdAt = "2026-09-01T12:00:00Z";
    c.completions = Array.from({ length: 12 }, (_, i) => ({
      id: "warrior-daily",
      period: `2026-09-${i + 1}`,
      at: new Date(Date.UTC(2026, 8, i + 1, 12)).toISOString(),
      xp: 150,
      stat: "STR",
      classId: "warrior",
      scope: "class",
      cadence: "daily",
      rank: "C",
      title: "Warrior training",
    }));
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await expect(page.locator(".engraved-line").first()).toContainText("Lv. 4");
  await nav(page, "Class Paths");
  await page.getByRole("button", { name: "Examinations", exact: true }).click();
  await page
    .getByRole("button", { name: "Open Warrior exam", exact: true })
    .click();
  await page.getByLabel("Exam result", { exact: true }).fill("20");
  await page
    .getByRole("button", { name: "Submit measured result", exact: true })
    .click();
  await expect(page.locator(".exam-result")).toContainText("Not passed");
  await page.getByLabel("Exam result", { exact: true }).fill("21");
  await page
    .getByRole("button", { name: "Submit measured result", exact: true })
    .click();
  await expect(page.locator(".exam-result")).toContainText("Passed");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await nav(page, "Guild Card");
  await expect(page.locator(".engraved-line").first()).toContainText("Lv. 9");
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(
    c.completions.reduce((n: number, o: { xp: number }) => n + o.xp, 0),
  ).toBe(1800);
  expect(c.exams.at(-1).status).toBe("passed");
});
test("phone header remains fixed while scrolling and notifications show real task gold", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await page.getByRole("button", { name: /Warrior commission/ }).click();
  await page.getByRole("button", { name: "Take request", exact: true }).click();
  await page
    .getByRole("button", { name: "I completed this objective", exact: true })
    .click();
  await page.evaluate(() => window.scrollTo(0, 900));
  const box = await page.locator(".topbar").boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeLessThan(5);
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Notifications", exact: true }),
  ).toContainText("+12 gold");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.locator(".notification-count")).toHaveCount(0);
  await nav(page, "Adventures");
  await page
    .getByRole("button", { name: "Guild requests", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Guild requests", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Alderhaven clinic supplies",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("gym access persists, the guild card follows its metal, and fighter weapon branches are inspectable", async ({
  page,
}) => {
  await sample(page);
  await expect(page.locator(".engraved-card")).toHaveAttribute(
    "data-metal",
    "tin",
  );
  await nav(page, "Settings");
  await page.getByRole("button", { name: "Training", exact: true }).click();
  await page.getByLabel("Gym equipment", { exact: true }).check();
  await page.reload();
  await nav(page, "Objectives");
  await expect(
    page.getByRole("button", {
      name: "Take Progressive resistance session",
      exact: true,
    }),
  ).toBeEnabled();
  await nav(page, "Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page.getByRole("tab", { name: "Class", exact: true }).click();
  await page
    .getByRole("button", { name: "Find Spearcraft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Spear Reach: locked", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Learn Weapon Discipline");
  await expect(dialog).not.toContainText("Learn Sword Guard");
});
