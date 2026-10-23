import { test, expect } from "@playwright/test";
async function sample(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Try a sample character" }).click();
}
test("onboarding supports an untested beginner and persists the F-rank character", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Register character" }).click();
  await page.getByLabel("Adventurer name").fill("Vincent");
  await page.getByRole("button", { name: "Continue to assessment" }).click();
  await page.getByRole("button", { name: "Review starting classes" }).click();
  await expect(page.getByRole("button", { name: /Disciple/ })).toBeVisible();
  await page.getByRole("button", { name: "Create character" }).click();
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
  await page.getByRole("button", { name: /Strength session/ }).click();
  await page
    .getByRole("button", { name: "I completed this objective" })
    .click();
  await page.getByRole("button", { name: /Strength session/ }).click();
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
  await page.getByRole("button", { name: /Strength session/ }).click();
  await page
    .getByRole("button", { name: "I completed this objective" })
    .click();
  await page.getByRole("button", { name: "Class Paths", exact: true }).click();
  await page
    .locator(".path-card")
    .filter({ has: page.getByRole("heading", { name: "Bard", exact: true }) })
    .getByRole("button", { name: "Select class" })
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
    page.getByRole("heading", { name: "Conversation practice" }),
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
  await page.getByRole("tab", { name: "Profession", exact: true }).click();
  await page.getByLabel("Profession tree").selectOption("networking");
  await expect(
    page.getByRole("button", {
      name: "Architect of Connections: learned",
      exact: true,
    }),
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
  await page.getByRole("button", { name: /Monthly training plan/ }).click();
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
  await page.getByRole("button", { name: /Monthly training plan/ }).click();
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
  await page.locator("input[type=file]").setInputFiles({
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
  await page.getByRole("button", { name: "Register character" }).click();
  await page.getByLabel("Adventurer name").fill("Ari");
  await page.getByRole("button", { name: "Continue to assessment" }).click();
  await page.getByRole("button", { name: "With weights", exact: true }).click();
  await page.getByLabel("Squat working weight (kg)").fill("50");
  await page.getByLabel("Repetitions in that set").fill("8");
  await page.getByLabel("Body weight (kg)").fill("70");
  await page.getByRole("button", { name: "Review starting classes" }).click();
  await page.getByRole("button", { name: /Warrior/ }).click();
  await page.getByRole("button", { name: "Create character" }).click();
  await expect(page.locator(".hero-tags")).toContainText("Warrior");
});
test("JRPG party battle persists, completes, and grants only combat rewards", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Adventures", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /Approach.*slime/ }).click();
  await page.getByRole("button", { name: "Attack", exact: true }).click();
  await expect(page.getByText("Mira's turn", { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Adventures", exact: true })
    .first()
    .click();
  await expect(page.getByText("Mira's turn", { exact: true })).toBeVisible();
  for (let i = 0; i < 20; i++) {
    if (
      await page
        .getByRole("button", { name: "Claim rewards", exact: false })
        .isVisible()
    )
      break;
    await page.getByRole("button", { name: "Attack", exact: true }).click();
  }
  await page
    .getByRole("button", { name: "Claim rewards", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Return to map", exact: false })
    .click();
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(data.completions).toHaveLength(0);
  expect(data.campaign.gold).toBe(20);
  expect(data.campaign.cleared).toContain("mossfall-1");
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
    page.getByRole("heading", { name: "Saved data needs recovery." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("the-guild.character.v1")),
  ).toBe('{"broken":true}');
});

test("assessment fields clear without a forced zero and show time units", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Register character" }).click();
  await page.getByLabel("Adventurer name").fill("Test");
  await page.getByLabel("Find a profession").fill("network");
  await page
    .getByLabel("Your profession", { exact: true })
    .selectOption("Network Engineer");
  await page.getByRole("button", { name: "Continue to assessment" }).click();
  const input = page.getByLabel("Pushups (repetitions)", { exact: false });
  await expect(input).toHaveValue("");
  await input.fill("0");
  await input.fill("");
  await expect(input).toHaveValue("");
  await input.pressSequentially("12");
  await expect(input).toHaveValue("12");
  await expect(
    page.getByLabel("Walking duration (minutes)", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Balance duration (seconds)", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Reading / study (minutes per week)", { exact: false }),
  ).toBeVisible();
});
test("class skill purchases use class shards and locked sections block skills", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  for (const title of ["Strength session", "Warrior technique"]) {
    await page
      .getByRole("button")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
      .click();
    await page
      .getByRole("button", { name: "I completed this objective" })
      .click();
  }
  await page
    .getByRole("button", { name: "Skills & Stats", exact: true })
    .click();
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page.getByRole("tab", { name: "Class", exact: true }).click();
  await page
    .getByRole("button", { name: "Weapon Drills: available", exact: true })
    .click();
  await page.getByRole("button", { name: /Purchase skill/ }).click();
  await expect(
    page.getByRole("button", { name: "Weapon Drills: learned", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Shield Bash: locked", exact: true })
    .click();
  await expect(page.getByText(/Class level 3/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Purchase skill/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Skills & Stats", exact: true })
    .click();
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page.getByRole("tab", { name: "Class", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Weapon Drills: learned", exact: true }),
  ).toBeVisible();
});
