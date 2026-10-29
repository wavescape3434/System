import { test, expect, type Page } from "@playwright/test";
test.use({
  timezoneId: "America/Denver",
  viewport: { width: 390, height: 844 },
});
const now = new Date("2027-02-01T12:00:00-07:00");
const read = (p: Page) =>
  p.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
const nav = async (p: Page, name: string) => {
  await p.locator(".app-shell").waitFor();
  const menu = p.getByRole("button", { name: "Open navigation", exact: true });
  if (await menu.isVisible()) await menu.click();
  await p
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name, exact: true })
    .click();
};
async function seed(page: Page) {
  await page.clock.install({ time: now });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.locator(".app-shell").waitFor();
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      m = await import("/src/metrics.ts"),
      b = await import("/e2e/browser-store.ts");
    await b.replaceString(
      JSON.stringify(
        d.createCharacter(
          "Adaptive sample",
          { ...d.EMPTY_BASELINE, assessment: { ...m.EMPTY_ASSESSMENT } },
          "scholar",
          "Teacher",
        ),
      ),
    );
  });
  await page.reload();
  await page.locator(".app-shell").waitFor();
}
async function sample(
  page: Page,
  level = "D",
  subject = "Fractions lesson design",
) {
  await page
    .getByRole("button", { name: "Check current ability", exact: true })
    .click();
  const form = page.getByRole("region", {
    name: "Activity ability check",
    exact: true,
  });
  await form
    .getByRole("combobox", { name: "Sample difficulty", exact: true })
    .selectOption(level);
  await form
    .getByRole("textbox", { name: "Ability sample subject", exact: true })
    .fill(subject);
  await form
    .getByRole("textbox", { name: "Ability sample source", exact: true })
    .fill("Teaching rubric v1");
  const checks = form.getByRole("checkbox");
  for (let i = 0; i < (await checks.count()); i++) await checks.nth(i).check();
  await form
    .getByRole("button", { name: "Save sample & calibrate", exact: true })
    .click();
}
test("a performed career sample immediately changes the offered request without granting XP or stats", async ({
  page,
}) => {
  await seed(page);
  const before = await read(page);
  await nav(page, "Objectives");
  await page
    .getByRole("button", { name: "View Profession practice", exact: true })
    .click();
  await sample(page, "C");
  await expect(
    page.getByRole("combobox", { name: "Choose request rank", exact: true }),
  ).toHaveValue("profession-daily-proficiency-c");
  await expect(page.getByRole("dialog")).toContainText(
    "Fractions lesson design",
  );
  await expect(page.getByRole("dialog")).toContainText(
    "specific misconception",
  );
  const after = await read(page);
  expect(after.abilityChecks).toHaveLength(1);
  expect(after.completions).toEqual(before.completions);
  expect(after.baseStats).toEqual(before.baseStats);
  await page.reload();
  await nav(page, "Objectives");
  await page
    .getByRole("button", { name: "View Profession practice", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Choose request rank", exact: true }),
  ).toHaveValue("profession-daily-proficiency-c");
});
test("a Chef profession milestone uses its work rubric and retains a comparison baseline", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts");
    const c = JSON.parse((await b.readString())!);
    c.profession = "Chef";
    c.completions = Array.from({ length: 15 }, (_, i) => ({
      id: "profession-daily",
      title: "Profession work",
      xp: 150,
      period: `fixture-${i}`,
      at: new Date(Date.now() - (20 - i) * 86400000).toISOString(),
      classId: "scholar",
      stat: "DEX",
      scope: "profession",
      profession: "Chef",
      cadence: "daily",
      rank: "C",
    }));
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Class Paths");
  await page.getByRole("button", { name: "Examinations", exact: true }).click();
  await page
    .getByRole("button", { name: "Open Chef exam", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Profession work sample");
  await expect(dialog).toContainText("materials, timing and cost");
  await expect(
    dialog.getByRole("combobox", { name: "Exam test", exact: true }),
  ).toHaveCount(0);
  await dialog
    .getByRole("textbox", {
      name: "Work sample and marking guide",
      exact: true,
    })
    .fill(
      "Service planning, same ten-minute case type and four-part hospitality marking guide v1",
    );
  await dialog.getByLabel("Exam result", { exact: true }).fill("10");
  await dialog
    .getByRole("button", { name: "Submit measured result", exact: true })
    .click();
  await expect(dialog).toContainText("Baseline recorded");
  const c = await read(page);
  expect(c.exams.at(-1).protocol).toMatch(/^work-DEX-/);
  expect(c.exams.at(-1).status).toBe("baseline");
});
test("two independent actual work results on different days raise the next task tier automatically", async ({
  page,
}) => {
  await seed(page);
  await nav(page, "Objectives");
  await page
    .getByRole("button", { name: "View Scholar commission", exact: true })
    .click();
  await sample(page, "D", "Scientific reasoning");
  for (const day of [0, 1]) {
    if (day) {
      await page.clock.setSystemTime(new Date(now.getTime() + 86400000));
      await page.reload();
      await nav(page, "Objectives");
      await page
        .getByRole("button", { name: "View Scholar commission", exact: true })
        .click();
    }
    const modal = page.getByRole("dialog");
    await expect(
      modal.getByRole("combobox", { name: "Choose request rank", exact: true }),
    ).toHaveValue("scholar-daily");
    await modal
      .getByRole("button", { name: "Take request", exact: true })
      .click();
    await modal
      .getByRole("button", { name: "Add results (optional)", exact: true })
      .click();
    await modal
      .getByRole("checkbox", {
        name: "Use this result to adapt future work",
        exact: true,
      })
      .check();
    await modal
      .getByRole("textbox", { name: "Practice subject", exact: true })
      .fill("Scientific reasoning");
    await modal
      .getByRole("textbox", { name: "Practice comparison source", exact: true })
      .fill("Teaching rubric v1");
    await modal
      .getByRole("combobox", { name: "Practice criteria met", exact: true })
      .selectOption("4");
    await modal
      .getByRole("checkbox", { name: "Independent work", exact: true })
      .check();
    await modal
      .getByRole("checkbox", {
        name: "Unfamiliar work at this difficulty",
        exact: true,
      })
      .check();
    await modal
      .getByRole("button", { name: "Submit completed request", exact: true })
      .click();
    await expect(modal).toHaveCount(0);
  }
  const saved = await read(page);
  expect(saved.completions).toHaveLength(2);
  expect(
    saved.completions.every((r: any) => r.result?.practice?.criteriaMet === 4),
  ).toBe(true);
  await page.clock.setSystemTime(new Date(now.getTime() + 2 * 86400000));
  await page.reload();
  await nav(page, "Objectives");
  await page
    .getByRole("button", { name: "View Scholar commission", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Choose request rank", exact: true }),
  ).toHaveValue("scholar-daily-proficiency-c");
});
test("gym progression suggests loads for pressing, rows, legs and hinges from matching work", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      m = await import("/src/metrics.ts"),
      r = await import("/src/training-regimen.ts"),
      b = await import("/e2e/browser-store.ts");
    let c = d.createCharacter(
      "Gym progression",
      { ...d.EMPTY_BASELINE, assessment: { ...m.EMPTY_ASSESSMENT } },
      "warrior",
      "Teacher",
    );
    c.preferences!.units = "metric";
    c.preferences!.equipment.push("gym");
    c.trainingPlan = {
      version: 1,
      rank: "D",
      environment: "gym",
      startedOn: "2027-02-01",
      automaticAbility: true,
    };
    const p = r.personalizedWorkout(c, "D", "A", "gym");
    c.completions = [5, 2].map((ago, i) => ({
      id: "regimen-a-d",
      title: "Fixture gym session",
      at: new Date(Date.now() - ago * 86400000).toISOString(),
      period: `fixture-${i}`,
      xp: 60,
      stat: "STR",
      classId: "warrior",
      scope: "universal",
      rank: "D",
      cadence: "daily",
      family: "u-resistance",
      workout: p,
      result: {
        workout: {
          prescription: p,
          exercises: p.exercises.map((e) => ({
            id: e.id,
            variation: e.name,
            reps: Array.from({ length: e.sets }, () => e.max),
            rir: 3,
            ...(e.load ? { loadKg: 20 } : {}),
          })),
        },
      },
    }));
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Objectives");
  await page.getByRole("button", { name: "Regimen", exact: true }).click();
  await expect(page.locator(".regimen-exercises")).toContainText(
    "Suggested next load: 20.5 kg",
  );
  expect(
    await page
      .locator(".regimen-exercises small")
      .filter({ hasText: "Suggested next load" })
      .count(),
  ).toBe(4);
});
test("a profession starting sample survives registration reload and is retained on the character", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Register character", exact: true })
    .click();
  await page.getByLabel("Adventurer name").fill("New teacher");
  await page.getByLabel("Find a profession").fill("Teacher");
  await page
    .getByLabel("Your profession", { exact: true })
    .selectOption("Teacher");
  await page
    .getByRole("button", { name: "Continue to assessment", exact: true })
    .click();
  await page.getByRole("button", { name: "Results", exact: true }).click();
  await page
    .getByRole("button", { name: "Review starting classes", exact: true })
    .click();
  await page
    .getByText("Check starting profession ability", { exact: true })
    .click();
  await sample(page, "C");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("the-guild.registration-draft.v1")!)
            .abilityChecks?.length,
      ),
    )
    .toBe(1);
  await page.reload();
  await page
    .getByRole("button", { name: "Create character", exact: true })
    .click();
  const c = await read(page);
  expect(c.abilityChecks).toHaveLength(1);
  expect(c.profession).toBe("Teacher");
  expect(c.completions).toHaveLength(0);
  await nav(page, "Objectives");
  await page
    .getByRole("button", { name: "View Profession practice", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Choose request rank", exact: true }),
  ).toHaveValue("profession-daily-proficiency-c");
});
