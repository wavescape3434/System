import { test, expect } from "@playwright/test";
async function sample(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Try a sample character" }).click();
}
async function takeOpen(page: import("@playwright/test").Page) {
  const take = page.getByRole("button", { name: "Take request", exact: true });
  if (await take.isVisible()) await take.click();
}
test("onboarding supports an untested beginner and persists the F-rank character", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Register character" }).click();
  await page.getByLabel("Adventurer name").fill("Vincent");
  await page.getByRole("button", { name: "Continue to assessment" }).click();
  await page.getByRole("button", { name: "Review starting classes" }).click();
  await expect(
    page.getByRole("button", { name: "Inspect Disciple", exact: true }),
  ).toBeVisible();
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
  await takeOpen(page);
  await page
    .getByRole("button", { name: "I completed this objective" })
    .click();
  await page.getByRole("button", { name: /Strength session/ }).click();
  await expect(
    page.getByRole("button", { name: "Already completed this period" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await expect(page.locator(".engraved-experience>b")).toHaveText(
    "30 / 288 XP",
  );
});
test("class changes update objectives and keep the previous class record", async ({
  page,
}) => {
  await sample(page);
  await page.getByRole("button", { name: /Strength session/ }).click();
  await takeOpen(page);
  await page
    .getByRole("button", { name: "I completed this objective" })
    .click();
  await page.getByRole("button", { name: "Class Paths", exact: true }).click();
  await page.getByRole("button", { name: "Inspect Bard", exact: true }).click();
  await page.getByRole("button", { name: "Choose Bard", exact: true }).click();
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
test("CCNA unlocks its milestone and appears in the automatic Journey", async ({
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
  await page
    .getByRole("button", { name: "Record earned credential", exact: true })
    .click();
  await page.getByRole("tab", { name: "Profession", exact: true }).click();
  await page.getByLabel("Profession tree").selectOption("networking");
  await expect(
    page.getByRole("button", {
      name: "Architect of Connections: learned",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Journey", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Architect of Connections learned",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "CCNA earned", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await page.reload();
  await page
    .getByRole("button", { name: "Journey", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Architect of Connections learned",
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
  await page
    .getByRole("button", { name: "View Monthly training plan", exact: true })
    .click();
  await takeOpen(page);
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
  await page
    .getByRole("button", { name: "View Monthly training plan", exact: true })
    .click();
  await expect(claim).toBeEnabled();
  await claim.click();
  await page.getByRole("button", { name: "Guild Card", exact: true }).click();
  await expect(page.locator(".engraved-experience>b")).toHaveText(
    "112 / 362 XP",
  );
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
  await page
    .getByRole("button", { name: "Inspect Warrior", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose Warrior", exact: true })
    .click();
  await page.getByRole("button", { name: "Create character" }).click();
  await expect(page.locator(".engraved-line").first()).toContainText("Warrior");
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
    page.getByRole("heading", { name: /Warrior/ }).first(),
  ).toBeVisible();
  for (const name of [
    "Objectives",
    "Skills & Stats",
    "Adventures",
    "Journey",
    "Help",
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
test("class skill purchases require multiple points and locked sections block skills", async ({
  page,
}) => {
  await sample(page);
  await page.evaluate(() => {
    const key = "the-guild.character.v1",
      c = JSON.parse(localStorage.getItem(key)!);
    c.completions = Array.from({ length: 12 }, (_, i) => ({
      id: "warrior-daily",
      period: `2026-09-${String(i + 1).padStart(2, "0")}`,
      at: `2026-09-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
      xp: 30,
      stat: "STR",
      classId: "warrior",
      scope: "class",
      title: "Strength session",
    }));
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  for (const title of ["Strength session", "Warrior technique"]) {
    await page
      .getByRole("button")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
      .click();
    await takeOpen(page);
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
    .getByRole("button", { name: "Weapon Discipline: available", exact: true })
    .click();
  await page.getByRole("button", { name: /Purchase skill/ }).click();
  await expect(
    page.getByRole("button", {
      name: "Weapon Discipline: learned",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Shield Breaker: locked", exact: true })
    .click();
  await expect(page.getByText(/Archetype level 5/)).toBeVisible();
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
    page.getByRole("button", {
      name: "Weapon Discipline: learned",
      exact: true,
    }),
  ).toBeVisible();
});

test("class comparison exposes real goals and vocation remains independent", async ({
  page,
}) => {
  await sample(page);
  await page.getByRole("button", { name: "Class Paths", exact: true }).click();
  await page
    .getByRole("button", { name: "Add Warrior to comparison", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add Disciple to comparison", exact: true })
    .click();
  await page.getByRole("button", { name: "Compare 2/3", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Compare class paths" });
  await expect(
    dialog.getByText("Real-world goal", { exact: true }),
  ).toHaveCount(2);
  await expect(
    dialog.getByRole("heading", { name: "Prayer of Restoration", exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Choose Disciple", exact: true })
    .click();
  await expect(page.locator(".class-current-banner")).toContainText("Disciple");
  await page.getByRole("button", { name: "Vocation", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Analyst → Networking", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Career discipline", { exact: true })
    .selectOption("business");
  await page
    .getByRole("button")
    .filter({ has: page.getByText("Business Analysis", { exact: true }) })
    .click();
  await page
    .getByRole("button", { name: "Adventures", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Skill loadout", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Prayer of Restoration", exact: true }),
  ).toBeVisible();
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(c.activeClass).toBe("disciple");
  expect(c.vocation).toBe("business-analysis");
  expect(c.profession).toBe("Analyst");
});

test("active class signature is usable in battle without a skill purchase", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Adventures", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /Approach.*slime/ }).click();
  await page.getByRole("button", { name: /Iron Cleave/ }).click();
  await expect(page.getByText("Mira's turn", { exact: true })).toBeVisible();
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(c.skillPurchases).toHaveLength(0);
  expect(c.campaign.equippedSkills).toHaveLength(0);
  expect(c.campaign.battle.party[0].mp).toBe(
    c.campaign.battle.party[0].maxMp - 6,
  );
  expect(
    c.campaign.battle.enemies.every(
      (e: { hp: number; maxHp: number }) => e.hp < e.maxHp,
    ),
  ).toBe(true);
});

test("Taken requests persist and keep their original class credit after a class switch", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Take Strength session", exact: true })
    .click();
  await page
    .locator(".request-view-tabs")
    .getByRole("button", { name: /^Taken/ })
    .click();
  await expect(
    page.getByRole("button", { name: "View Strength session", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Class Paths", exact: true }).click();
  await page.getByRole("button", { name: "Inspect Bard", exact: true }).click();
  await page.getByRole("button", { name: "Choose Bard", exact: true }).click();
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  await page
    .locator(".request-view-tabs")
    .getByRole("button", { name: /^Taken/ })
    .click();
  await page
    .getByRole("button", { name: "View Strength session", exact: true })
    .click();
  await page
    .getByRole("button", { name: "I completed this objective", exact: true })
    .click();
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(c.activeClass).toBe("bard");
  expect(c.completions[0].classId).toBe("warrior");
  expect(c.completions[0].xp).toBe(30);
  await page
    .getByRole("button", { name: "Journey", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Strength session", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Bard selected", exact: true }),
  ).toBeVisible();
});

test("recurring requests return as suggestions and require another manual acceptance", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-20T12:00:00Z") });
  await sample(page);
  await page.getByRole("button", { name: /Strength session/ }).click();
  await takeOpen(page);
  await page
    .getByRole("button", { name: "I completed this objective", exact: true })
    .click();
  await page.clock.setSystemTime(new Date("2026-10-21T12:00:00Z"));
  await page.reload();
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  await page
    .locator(".request-view-tabs")
    .getByRole("button", { name: /^Taken/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "No taken requests", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Suggested/ }).click();
  await expect(
    page.getByRole("button", { name: "Take Strength session", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "View Strength session", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "I completed this objective",
      exact: true,
    }),
  ).toHaveCount(0);
  await takeOpen(page);
  await page
    .getByRole("button", { name: "I completed this objective", exact: true })
    .click();
  const c = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.character.v1")!),
  );
  expect(c.completions).toHaveLength(2);
  expect(
    c.completions.reduce((n: number, o: { xp: number }) => n + o.xp, 0),
  ).toBe(60);
});

test("Journey reports show saved activity, interactive data, and archived notes on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await page.evaluate(() => {
    const key = "the-guild.character.v1",
      c = JSON.parse(localStorage.getItem(key)!);
    c.title = "A story yet unwritten";
    const now = new Date();
    c.createdAt = new Date(now.getTime() - 28 * 86400000).toISOString();
    c.completions = [0, 1, 3].map((n) => {
      const date = new Date();
      date.setDate(date.getDate() - n);
      return {
        id: "warrior-daily",
        period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
        at: date.toISOString(),
        xp: 30,
        stat: "STR",
        classId: "warrior",
        scope: "class",
        title: "Strength session",
      };
    });
    c.journal = [
      {
        id: "old-note",
        at: now.toISOString(),
        text: "Saved notes from the earlier Journal.",
      },
    ];
    localStorage.setItem(key, JSON.stringify(c));
  });
  await page.reload();
  await expect(
    page.getByText("A story yet unwritten", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Journey", exact: true })
    .last()
    .click();
  await expect(
    page.getByText("Saved notes from the earlier Journal.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Journal", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Experience over time", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Completed requests", exact: true }),
  ).toBeVisible();
  await page.getByText("View data", { exact: true }).first().click();
  await expect(page.locator(".chart-data table").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".calendar-days button").last().click();
  await expect(
    page.getByRole("heading", { name: "Strength session", exact: true }),
  ).toHaveCount(1);
});

test("Help is searchable from registration and normal page headings have no explanatory subtitles", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Help", exact: true }).first().click();
  await page.getByLabel("Search help", { exact: true }).fill("Walking");
  await expect(
    page.getByRole("heading", { name: "Attributes", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to registration", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await expect(page.locator(".page-heading p")).toHaveCount(0);
  await page.getByRole("button", { name: "Open help", exact: true }).click();
  await page.getByLabel("Search help", { exact: true }).fill("recurring");
  await expect(
    page.getByRole("heading", { name: "Recurring requests", exact: true }),
  ).toBeVisible();
});
