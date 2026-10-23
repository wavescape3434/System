import { test, expect } from "@playwright/test";
async function sample(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore a sample character first" })
    .click();
}
test("onboarding supports an untested beginner and persists the F-rank character", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin your story" }).click();
  await page.getByLabel("Adventurer name").fill("Vincent");
  await page.getByRole("button", { name: "Meet the guild examiner" }).click();
  await page.getByRole("button", { name: "Discover your path" }).click();
  await expect(page.getByRole("button", { name: /Disciple/ })).toBeVisible();
  await page.getByRole("button", { name: "Take the guild oath" }).click();
  await expect(
    page.getByRole("heading", { name: "Vincent", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Vincent", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".rank-emblem strong")).toHaveText("F");
});
test("objectives cannot award twice and the reward survives reload", async ({
  page,
}) => {
  await sample(page);
  await page.getByRole("button", { name: /Forge your strength/ }).click();
  await page
    .getByRole("button", { name: "I completed this objective" })
    .click();
  await page.getByRole("button", { name: /Forge your strength/ }).click();
  await expect(
    page.getByRole("button", { name: "Already completed this period" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await expect(page.locator(".hero-progress b")).toHaveText("30 / 250 XP");
});
test("class changes update objectives and keep the previous class record", async ({
  page,
}) => {
  await sample(page);
  await page.getByRole("button", { name: /Forge your strength/ }).click();
  await page
    .getByRole("button", { name: "I completed this objective" })
    .click();
  await page.getByRole("button", { name: "Class Paths", exact: true }).click();
  await page
    .locator(".path-card")
    .filter({ has: page.getByRole("heading", { name: "Bard", exact: true }) })
    .getByRole("button", { name: "Walk this path" })
    .click();
  await page.getByRole("button", { name: "Your class record" }).click();
  await expect(
    page.getByRole("heading", { name: "Warrior", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Level 1 · Novice · 30 XP earned")).toBeVisible();
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Make a meaningful connection" }),
  ).toBeVisible();
});
test("CCNA unlocks the named intermediate skill and a journal reflection persists", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Skills & Stats", exact: true })
    .click();
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page
    .getByRole("button", { name: "Record credential", exact: true })
    .click();
  await page.getByRole("button", { name: "Record earned credential" }).click();
  await expect(
    page
      .locator(".skill-card")
      .filter({
        has: page.getByRole("heading", {
          name: "Architect of Connections",
          exact: true,
        }),
      })
      .getByText("Earned", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Journal", exact: true })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "Your reflection" })
    .fill("I practiced subnetting and reflected on Psalm 23.");
  await page.getByRole("button", { name: "Save reflection" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Journal", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("I practiced subnetting and reflected on Psalm 23.", {
      exact: true,
    }),
  ).toBeVisible();
});
test("monthly objectives require every milestone before claiming", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /Monthly adventures/ }).click();
  await page.getByRole("button", { name: /The making of a hero/ }).click();
  const claim = page.getByRole("button", {
    name: "I completed this objective",
  });
  await expect(claim).toBeDisabled();
  for (const name of [
    "Complete 12 practice sessions",
    "Reflect on what improved",
    "Set a sustainable next goal",
  ])
    await page.getByRole("button", { name, exact: true }).click();
  await expect(claim).toBeEnabled();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /Monthly adventures/ }).click();
  await page.getByRole("button", { name: /The making of a hero/ }).click();
  await expect(claim).toBeEnabled();
  await claim.click();
  await page.getByRole("button", { name: "Guild Card", exact: true }).click();
  await expect(page.locator(".hero-progress b")).toHaveText("150 / 250 XP");
});
test("character backups export and restore after explicit confirmation", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Guild settings", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export character", exact: true })
    .click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  c.name = "Restored Adventurer";
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(c)),
    });
  await expect(
    page.getByRole("heading", { name: "Restore this character?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restore character", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Restored Adventurer", exact: true }),
  ).toBeVisible();
});
test("weighted baseline opens eligible strength paths", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin your story" }).click();
  await page.getByLabel("Adventurer name").fill("Ari");
  await page.getByRole("button", { name: "Meet the guild examiner" }).click();
  await page.getByRole("button", { name: "With weights", exact: true }).click();
  await page.getByLabel("Squat working weight (kg)").fill("50");
  await page.getByLabel("Repetitions in that set").fill("8");
  await page.getByRole("button", { name: "Discover your path" }).click();
  await page.getByRole("button", { name: /Warrior/ }).click();
  await page.getByRole("button", { name: "Take the guild oath" }).click();
  await expect(page.locator(".hero-tags")).toContainText("Warrior");
});
test("story adventure uses character choices and awards a keepsake without real-world XP", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Adventures", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Enter with Rowan" }).click();
  await page.getByRole("button", { name: /Move the fallen timber/ }).click();
  await expect(page.getByText(/Your training pays off/)).toBeVisible();
  await page.getByRole("button", { name: "Continue the journey" }).click();
  await page.getByRole("button", { name: /Decipher the inscription/ }).click();
  await page.getByRole("button", { name: "Continue the journey" }).click();
  await page
    .getByRole("button", { name: /Offer words of encouragement/ })
    .click();
  await page.getByRole("button", { name: "Enter the guildhall" }).click();
  await expect(
    page.getByRole("heading", { name: "A light to carry forward." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Guild Card", exact: true }).click();
  await expect(page.locator(".hero-progress b")).toHaveText("0 / 250 XP");
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(data.relics).toEqual(["mossfall-lantern"]);
});
test("phone navigation fits and all main screens render without page errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Class Paths", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Warrior", exact: true }),
  ).toBeVisible();
  for (const name of [
    "Objectives",
    "Skills & Stats",
    "Adventures",
    "Journal",
    "Guild Card",
  ]) {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name, exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("invalid saved data is preserved for recovery", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("the-guild.character.v1", '{"broken":true}'),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your story is still here." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("the-guild.character.v1")),
  ).toBe('{"broken":true}');
});
