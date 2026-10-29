import { test, expect, type Page } from "@playwright/test";
test.use({
  timezoneId: "America/Denver",
  viewport: { width: 390, height: 844 },
});
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
const read = (page: Page) =>
  page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
async function seed(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.locator(".app-shell").waitFor();
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      m = await import("/src/metrics.ts"),
      b = await import("/e2e/browser-store.ts");
    const c = d.createCharacter(
      "Experienced adult",
      {
        ...d.EMPTY_BASELINE,
        assessment: { ...m.EMPTY_ASSESSMENT, pushups: 35 },
      },
      "warrior",
      "Registered Nurse",
    );
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await page.locator(".app-shell").waitFor();
}
test("onboarding defaults to imperial, accepts minute/second mile times, and keeps new tests hidden until Start", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Register character", exact: true })
    .click();
  await page.getByLabel("Adventurer name").fill("Mile check");
  await page
    .getByRole("button", { name: "Continue to assessment", exact: true })
    .click();
  await expect(page.getByLabel("Assessment units")).toHaveValue("imperial");
  await page.getByLabel("Mile minutes", { exact: true }).fill("16");
  await page.getByLabel("Mile seconds", { exact: true }).fill("15");
  await page.getByLabel("Assessment units").selectOption("metric");
  await expect(page.getByLabel("Mile minutes", { exact: true })).toHaveValue(
    "16",
  );
  await expect(page.getByLabel("Mile seconds", { exact: true })).toHaveValue(
    "15",
  );
  await page
    .getByRole("button", { name: "Next: INT check", exact: true })
    .click();
  await expect(page.locator(".check-options")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Start INT check", exact: true })
    .click();
  await expect(page.locator(".mind-check")).toContainText(
    "Every object in group",
  );
  await expect(page.locator(".mind-check")).not.toContainText(
    "community garden",
  );
});
test("35 pushups seeds harder pushing and allows independent leg/core calibration without granting rewards", async ({
  page,
}) => {
  await seed(page);
  const before = await read(page);
  await nav(page, "Objectives");
  await page.getByRole("button", { name: "Regimen", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Pushing variation", exact: true }),
  ).toHaveValue("4");
  await page.getByText("Calibrate legs, hips & core", { exact: true }).click();
  await page
    .getByRole("combobox", { name: "Leg variation", exact: true })
    .selectOption("3");
  await page
    .getByRole("combobox", { name: "Hip variation", exact: true })
    .selectOption("3");
  await page
    .getByRole("combobox", { name: "Core variation", exact: true })
    .selectOption("3");
  await page.getByRole("button", { name: "Start plan", exact: true }).click();
  await expect(page.locator(".regimen-exercises")).toContainText(
    "Harder floor pushup variation",
  );
  await expect(page.locator(".regimen-exercises")).toContainText(
    "Supported split squat",
  );
  await expect(page.locator(".regimen-exercises")).not.toContainText(
    "Wall pushup",
  );
  const after = await read(page);
  expect(after.baseStats).toEqual(before.baseStats);
  expect(after.completions).toEqual(before.completions);
  await page.reload();
  await nav(page, "Objectives");
  await page.getByRole("button", { name: "Regimen", exact: true }).click();
  await expect(page.locator(".regimen-exercises")).toContainText(
    "Harder floor pushup variation",
  );
});
test("career proficiency persists and selects challenging, category-specific work", async ({
  page,
}) => {
  await seed(page);
  await nav(page, "Objectives");
  await page
    .getByRole("button", { name: "Ability settings", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Practice area", exact: true })
    .selectOption("career:healthcare:Registered Nurse");
  await page
    .getByLabel("Subject or activity", { exact: true })
    .fill("Structured handoffs in fictional cases");
  await page
    .getByRole("combobox", { name: "Starting proficiency", exact: true })
    .selectOption("C");
  await page
    .getByLabel("Success criterion and comparison source", { exact: true })
    .fill(
      "Use the same handoff rubric: accurate observations, uncertainty, priority and next action.",
    );
  await page.getByRole("button", { name: "Save ability", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Ability saved");
  await page.reload();
  await nav(page, "Objectives");
  await page.getByRole("button", { name: "Guild board", exact: true }).click();
  // Role-specific title comes from the current profession group.
  const id = await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      b = await import("/e2e/browser-store.ts");
    return d
      .objectives(JSON.parse((await b.readString())!))
      .find((o) => o.id === "profession-daily")!.groupTitle;
  });
  await page.getByRole("button", { name: `View ${id}`, exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Choose request rank", exact: true }),
  ).toHaveValue("profession-daily-proficiency-c");
  await expect(page.getByRole("dialog")).toContainText(
    "Structured handoffs in fictional cases",
  );
  await expect(page.getByRole("dialog")).toContainText("two real constraints");
  expect((await read(page)).completions).toHaveLength(0);
});
test("CHA is a spoken trial with timer and anchored rubric, without automatic microphone use", async ({
  page,
}) => {
  await seed(page);
  await nav(page, "Settings");
  await page.getByRole("button", { name: "Assessment", exact: true }).click();
  await page.getByRole("button", { name: "CHA", exact: true }).click();
  await expect(page.locator(".communication-trial")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Start CHA check", exact: true })
    .click();
  await expect(page.locator(".communication-trial li")).toHaveCount(4);
  await expect(page.locator(".check-options")).toContainText(
    "Met all 4 criteria",
  );
  await page.getByRole("button", { name: "Start timer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause timer", exact: true }),
  ).toBeVisible();
  await expect(page.locator("audio")).toHaveCount(0);
});
