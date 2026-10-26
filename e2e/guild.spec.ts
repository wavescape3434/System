import { mentalForm } from "../src/exam-bank";
import { test, expect } from "@playwright/test";
async function sample(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Try a sample character" }).click();
}
async function takeOpen(page: import("@playwright/test").Page) {
  const take = page.getByRole("button", { name: "Take request", exact: true });
  if (await take.isVisible()) await take.click();
}
async function enterClass(page: import("@playwright/test").Page, name: string) {
  await page
    .getByRole("button", { name: "Inspect " + name, exact: true })
    .click();
  const trial = page.getByRole("button", {
    name: "Open entry trial",
    exact: true,
  });
  if (await trial.isVisible()) {
    await trial.click();
    await takeOpen(page);
    for (const item of await page.locator(".checklist button").all())
      await item.click();
    await page
      .getByRole("button", { name: "Submit completed request", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Inspect " + name, exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: "Choose " + name, exact: true })
    .click();
}
async function reviewClasses(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Results", exact: true }).click();
  await page
    .getByRole("button", { name: "Review starting classes", exact: true })
    .click();
}
async function account(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Account & data", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Account & backups", exact: true })
    .click();
}
test("onboarding supports an untested beginner and persists the F-rank character", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Register character" }).click();
  await page.getByLabel("Adventurer name").fill("Vincent");
  await page.getByRole("button", { name: "Continue to assessment" }).click();
  await reviewClasses(page);
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
  await expect(page.locator(".engraved-rank strong")).toHaveText("F");
});
test("objectives cannot award twice and the reward survives reload", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Warrior requests", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View Warrior commission", exact: true })
    .click();
  await takeOpen(page);
  await page.getByRole("button", { name: "Submit completed request" }).click();
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "View Warrior commission", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Already completed this period" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await expect(page.locator(".engraved-experience>b")).toHaveText(
    "60 / 288 XP",
  );
});
test("class changes update objectives and keep the previous class record", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Warrior requests", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View Warrior commission", exact: true })
    .click();
  await takeOpen(page);
  await page.getByRole("button", { name: "Submit completed request" }).click();
  await page.getByRole("button", { name: "Class Paths", exact: true }).click();
  await enterClass(page, "Bard");
  await page.getByRole("button", { name: "Your class record" }).click();
  await expect(
    page.getByRole("heading", { name: "Warrior", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".class-record")
      .filter({
        has: page.getByRole("heading", { name: "Warrior", exact: true }),
      })
      .getByText("Level 1 · Novice · 60 XP earned"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "View Bard commission", exact: true }),
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
test("monthly requests include earlier logged practice and expire at the calendar boundary", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2027-02-01T18:00:00Z") });
  await sample(page);
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts");
    const key = "the-guild.character.v1";
    let c = JSON.parse(
      (await (await import("/e2e/browser-store.ts")).readString())!,
    );
    for (const day of [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26]) {
      const at = new Date(Date.UTC(2027, 1, day, 19));
      c = d.takeRequest(c, "warrior-daily", at);
      const o = d.takenObjectives(c, at).find((o) => o.id === "warrior-daily")!;
      c = d.awardSkills(d.completeTaken(c, o, at));
    }
    await (
      await import("/e2e/browser-store.ts")
    ).replaceString(JSON.stringify(c));
  });
  await page.clock.setFixedTime(new Date("2027-02-27T18:00:00Z"));
  await page.reload();
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /^Monthly adventures/ }).click();
  await page
    .getByRole("button", {
      name: "View Warrior training adventure",
      exact: true,
    })
    .click();
  await takeOpen(page);
  const claim = page.getByRole("button", {
    name: "Submit completed request",
    exact: true,
  });
  await expect(page.getByRole("dialog")).toContainText("12 / 12 practice days");
  await expect(claim).toBeDisabled();
  for (const name of [
    "Complete 12 practice sessions",
    "Reflect on what improved",
    "Set a sustainable next goal",
  ])
    await page.getByRole("button", { name, exact: true }).click();
  await expect(claim).toBeEnabled();
  await claim.click();
  const saved = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
  expect(saved.completions.at(-1).xp).toBe(6300);
  expect(saved.completions.at(-1).gold).toBe(1260);
  await page.clock.setFixedTime(new Date("2027-03-01T18:00:00Z"));
  await page.reload();
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /^Taken/ }).click();
  await page.getByRole("button", { name: /^Monthly adventures/ }).click();
  await expect(
    page.getByRole("heading", { name: "No monthly requests", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Guild board", exact: true }).click();
  await page
    .getByRole("button", {
      name: "View Warrior training adventure",
      exact: true,
    })
    .click();
  await takeOpen(page);
  await expect(page.getByRole("dialog")).toContainText("0 / 12 practice days");
  await expect(claim).toBeDisabled();
});

test("character backups export and restore after explicit confirmation", async ({
  page,
}) => {
  await sample(page);
  await account(page);
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export character", exact: true })
    .click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const c = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
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
  await page
    .getByLabel("Strength assessment", { exact: true })
    .selectOption("weighted");
  await page.getByLabel("Bench press load (kg)").fill("50");
  await page.getByLabel("Repetitions in the set (reps)").fill("8");
  await page.getByLabel("Body mass (kg)").fill("70");
  await reviewClasses(page);
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
  await page.getByRole("button", { name: /Approach.*Enter battle/ }).click();
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
  const data = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
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
    "Settings",
    "Guild",
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
  await page.evaluate(
    async () =>
      await (
        await import("/e2e/browser-store.ts")
      ).replaceString('{"broken":true}'),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Saved data needs recovery." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      async () => await (await import("/e2e/browser-store.ts")).readString(),
    ),
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
  const input = page.getByLabel("Maximum consecutive pushups (repetitions)", {
    exact: false,
  });
  await expect(input).toHaveValue("");
  await input.fill("0");
  await input.fill("");
  await expect(input).toHaveValue("");
  await input.pressSequentially("12");
  await expect(input).toHaveValue("12");
  await expect(
    page.getByLabel("Distance walked in 6 minutes (metres)", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByLabel("One-leg balance, eyes open (seconds)", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "INT", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Start INT check", exact: true }),
  ).toBeVisible();
});
test("class skill purchases require multiple points and locked sections block skills", async ({
  page,
}) => {
  await sample(page);
  await page.evaluate(async () => {
    const key = "the-guild.character.v1",
      c = JSON.parse(
        (await (await import("/e2e/browser-store.ts")).readString())!,
      );
    c.completions = Array.from({ length: 12 }, (_, i) => ({
      id: "warrior-daily",
      period: `2026-09-${String(i + 1).padStart(2, "0")}`,
      at: `2026-09-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
      xp: 30,
      stat: "STR",
      classId: "warrior",
      scope: "class",
      title: "Warrior commission",
    }));
    await (
      await import("/e2e/browser-store.ts")
    ).replaceString(JSON.stringify(c));
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  for (const title of ["Warrior commission"]) {
    await page
      .getByRole("button", { name: `View ${title}`, exact: true })
      .click();
    await takeOpen(page);
    await page
      .getByRole("button", { name: "Submit completed request" })
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
    .getByRole("button", { name: "Steel Tempest: locked", exact: true })
    .click();
  await expect(page.getByText(/Archetype level 6/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Purchase skill/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close skill details" }).click();
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
  await expect(
    dialog.getByRole("button", { name: "Requirements not met", exact: true }),
  ).toBeDisabled();
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await enterClass(page, "Disciple");
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
  const c = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
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
  await page.getByRole("button", { name: /Approach.*Enter battle/ }).click();
  await page.getByRole("button", { name: /Iron Cleave/ }).click();
  await expect(page.getByText("Mira's turn", { exact: true })).toBeVisible();
  const c = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
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
    .getByRole("button", { name: "View Warrior commission", exact: true })
    .click();
  await takeOpen(page);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .locator(".request-view-tabs")
    .getByRole("button", { name: /^Taken/ })
    .click();
  await expect(
    page.getByRole("button", { name: "View Warrior commission", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Class Paths", exact: true }).click();
  await enterClass(page, "Bard");
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  await page
    .locator(".request-view-tabs")
    .getByRole("button", { name: /^Taken/ })
    .click();
  await page
    .getByRole("button", { name: "View Warrior commission", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Submit completed request", exact: true })
    .click();
  const c = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
  expect(c.activeClass).toBe("bard");
  expect(
    c.completions.find((o: { id: string }) => o.id === "warrior-daily").classId,
  ).toBe("warrior");
  expect(
    c.completions.find((o: { id: string }) => o.id === "warrior-daily").xp,
  ).toBe(60);
  await page
    .getByRole("button", { name: "Journey", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Warrior commission", exact: true }),
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
  await page
    .getByRole("button", { name: "Warrior requests", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View Warrior commission", exact: true })
    .click();
  await takeOpen(page);
  await page
    .getByRole("button", { name: "Submit completed request", exact: true })
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
    page.getByRole("button", { name: "View Warrior commission", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "View Warrior commission", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Submit completed request",
      exact: true,
    }),
  ).toHaveCount(0);
  await takeOpen(page);
  await page
    .getByRole("button", { name: "Submit completed request", exact: true })
    .click();
  const c = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
  expect(c.completions).toHaveLength(2);
  expect(
    c.completions.reduce((n: number, o: { xp: number }) => n + o.xp, 0),
  ).toBe(120);
});

test("Journey reports show saved activity, interactive data, and archived notes on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await page.evaluate(async () => {
    const key = "the-guild.character.v1",
      c = JSON.parse(
        (await (await import("/e2e/browser-store.ts")).readString())!,
      );
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
        title: "Warrior commission",
      };
    });
    c.journal = [
      {
        id: "old-note",
        at: now.toISOString(),
        text: "Saved notes from the earlier Journal.",
      },
    ];
    await (
      await import("/e2e/browser-store.ts")
    ).replaceString(JSON.stringify(c));
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
    page.getByRole("heading", { name: "Warrior commission", exact: true }),
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

test("mental checks save actual answers, distinguish unknown from zero, and persist on the character", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Register character", exact: true })
    .click();
  await page.getByLabel("Adventurer name", { exact: true }).fill("Mara");
  await page
    .getByRole("button", { name: "Continue to assessment", exact: true })
    .click();
  await page
    .getByLabel("Maximum consecutive pushups (repetitions)", { exact: true })
    .fill("0");
  const answers = {
    INT: mentalForm("INT").questions.map((q) => q.answer),
    WIS: mentalForm("WIS").questions.map((q) => q.answer),
    CHA: mentalForm("CHA").questions.map((q) => q.answer),
  };
  for (const stat of ["INT", "WIS", "CHA"] as const) {
    await page.getByRole("button", { name: stat, exact: true }).click();
    await page
      .getByRole("button", { name: `Start ${stat} check`, exact: true })
      .click();
    for (let i = 0; i < 5; i++) {
      await page.locator(".check-options button").nth(answers[stat][i]).click();
      await page
        .getByRole("button", {
          name: i < 4 ? "Next question" : `Finish ${stat} check`,
          exact: true,
        })
        .click();
    }
    await expect(page.getByRole("heading", { name: /5\/5/ })).toBeVisible();
  }
  await page.getByRole("button", { name: "Results", exact: true }).click();
  await expect(
    page
      .locator(".assessment-results section")
      .filter({ has: page.locator("b", { hasText: "STR" }) })
      .locator("strong"),
  ).toHaveText("1");
  await expect(
    page
      .locator(".assessment-results section")
      .filter({ has: page.locator("b", { hasText: "DEX" }) })
      .locator("strong"),
  ).toHaveText("10");
  await reviewClasses(page);
  await page
    .getByRole("button", { name: "Create character", exact: true })
    .click();
  await page.reload();
  const c = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
  expect(c.baseStats.STR).toBe(1);
  expect(c.baseStats.INT).toBe(17);
  expect(Object.keys(c.baseline.assessment.mental)).toHaveLength(3);
});

test("settings persist display, units, equipment, opening screen, and separate a performance check from earned stats", async ({
  page,
}) => {
  await sample(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByLabel("Measurement units", { exact: true })
    .selectOption("imperial");
  await page.getByLabel("Text size", { exact: true }).selectOption("large");
  await page.getByLabel("Reduce motion", { exact: true }).check();
  await page
    .getByLabel("Open app to", { exact: true })
    .selectOption("objectives");
  await page.getByRole("button", { name: "Training", exact: true }).click();
  await page.getByLabel("Pull-up bar", { exact: true }).check();
  await page.getByRole("button", { name: "Assessment", exact: true }).click();
  await expect(page.getByLabel("Body mass (lb)", { exact: true })).toHaveValue(
    "165.3",
  );
  await page
    .getByLabel("Maximum consecutive pushups (repetitions)", { exact: true })
    .fill("40");
  await page.getByRole("button", { name: "Results", exact: true }).click();
  await page
    .getByRole("button", { name: "Save performance check", exact: true })
    .click();
  const before = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
  expect(before.baseStats.STR).toBe(10);
  expect(before.baseline.assessment.pushups).toBe(40);
  expect(before.assessmentHistory.at(-1).assessment.pushups).toBe(40);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Guild Requests", exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByLabel("Measurement units", { exact: true }),
  ).toHaveValue("imperial");
  await page.getByRole("button", { name: "Training", exact: true }).click();
  await expect(page.getByLabel("Pull-up bar", { exact: true })).toBeChecked();
});

test("grouped board offers cadence rank limits and prices demanding adventure preparation higher", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Objectives", exact: true })
    .first()
    .click();
  await page.getByLabel("Search requests").fill("Pushup");
  await page
    .getByRole("button", { name: "Open Strength board", exact: true })
    .click();
  const push = page.locator(".guild-request-paper").filter({
    has: page.getByRole("button", {
      name: "View Pushup practice",
      exact: true,
    }),
  });
  await push
    .getByRole("button", {
      name: "Show details for Pushup practice",
      exact: true,
    })
    .click();
  await page.getByLabel("Choose request rank").selectOption("u-floor-push-20");
  await expect(page.getByRole("dialog")).toContainText("150 XP");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  expect(
    await page
      .getByLabel("Request rank")
      .locator("option")
      .evaluateAll((options) =>
        options.map((o) => (o as HTMLOptionElement).value),
      ),
  ).toEqual(["all", "F", "E", "D", "C"]);
  await page.getByRole("button", { name: /^Weekly quests/ }).click();
  expect(
    await page
      .getByLabel("Request rank")
      .locator("option")
      .evaluateAll((options) =>
        options.map((o) => (o as HTMLOptionElement).value),
      ),
  ).toEqual(["all", "F", "E", "D", "C", "B", "A"]);
  await page.getByRole("button", { name: /^Monthly adventures/ }).click();
  await page.getByLabel("Search requests").fill("Pullups");
  await page.getByLabel("Request rank").selectOption("S");
  const pull = page.locator(".guild-request-paper").filter({
    has: page.getByRole("button", {
      name: "View Pullups · 5 × 20",
      exact: true,
    }),
  });
  await pull
    .getByRole("button", {
      name: "Show details for Pullups · 5 × 20",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText("32400 XP");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Take request", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  const categories = await page
    .getByLabel("Objective category")
    .locator("option")
    .allTextContents();
  expect(categories).not.toContain("Networking");
  expect(categories).not.toContain("Data Analysis");
});
