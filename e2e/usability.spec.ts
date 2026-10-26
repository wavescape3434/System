import { test, expect, type Page } from "@playwright/test";
const nav = async (page: Page, name: string) => {
  await page.locator(".app-shell").waitFor({ state: "visible" });
  const menu = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("button", { name, exact: true })
    .click();
};
const sample = async (page: Page) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
};
test("exam typing retains all characters and focus, reverse Tab stays inside, Escape restores focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await page.evaluate(async () => {
    const c = JSON.parse(
      (await (await import("/e2e/browser-store.ts")).readString())!,
    );
    c.completions = Array.from({ length: 20 }, (_, i) => ({
      id: "warrior-daily",
      period: `2026-09-${String(i + 1).padStart(2, "0")}`,
      at: `2026-09-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
      xp: 60,
      stat: "STR",
      classId: "warrior",
      scope: "class",
      title: "Warrior commission",
      rank: "D",
    }));
    await (
      await import("/e2e/browser-store.ts")
    ).replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Class Paths");
  await page.getByRole("button", { name: "Examinations", exact: true }).click();
  const open = page.getByRole("button", {
    name: "Open Warrior exam",
    exact: true,
  });
  await open.click();
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest('[role="dialog"]'),
    ),
  ).toBe(true);
  await page.getByLabel("Exam result", { exact: true }).click();
  await page.keyboard.type("42", { delay: 70 });
  await expect(page.getByLabel("Exam result", { exact: true })).toHaveValue(
    "42",
  );
  await expect(page.getByLabel("Exam result", { exact: true })).toBeFocused();
  await expect(page.locator(".sidebar")).toHaveAttribute("inert", "");
  await page.keyboard.press("Escape");
  await expect(open).toBeFocused();
  await expect(page.locator(".sidebar")).not.toHaveAttribute("inert");
});
test("Guild opens all accepted cadences and empty daily view links back to the weekly commitment", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await page.evaluate(async () => {
    // @ts-expect-error Vite source import runs inside the browser.
    const d = await import("/src/domain.ts");
    let c = JSON.parse(
      (await (await import("/e2e/browser-store.ts")).readString())!,
    );
    const o = d
      .objectives(c)
      .find(
        (o: { cadence: string; scope: string }) =>
          o.cadence === "weekly" && o.scope === "universal",
      );
    c = d.takeRequest(c, o.id);
    await (
      await import("/e2e/browser-store.ts")
    ).replaceString(JSON.stringify(c));
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Open requests", exact: true })
    .click();
  await expect(page.getByRole("button", { name: /^All taken/ })).toBeVisible();
  await expect(page.locator(".compact-request")).toHaveCount(1);
  await page.getByRole("button", { name: /^Daily tasks/ }).click();
  await expect(
    page.getByRole("heading", { name: "No daily requests", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show all taken requests", exact: true })
    .click();
  await expect(page.locator(".compact-request")).toHaveCount(1);
});
test("phone board surfaces more work, filters are optional, pins have real hit areas, and search survives navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await nav(page, "Objectives");
  await expect(page.getByLabel("Objective category")).toBeHidden();
  await expect(page.locator(".stat-board-door")).toHaveCount(6);
  await expect(
    page.locator('.compact-request[data-scope="universal"]'),
  ).toHaveCount(0);
  const box = await page
    .getByRole("button", { name: "Pin Warrior commission", exact: true })
    .boundingBox();
  expect(Math.round(box!.width)).toBeGreaterThanOrEqual(44);
  expect(Math.round(box!.height)).toBeGreaterThanOrEqual(44);
  await page.getByRole("button", { name: /^Filters/ }).click();
  await page.getByLabel("Request rank").selectOption("C");
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page.getByLabel("Search requests").fill("Pushup");
  await page
    .getByRole("button", { name: "Open Strength board", exact: true })
    .click();
  await nav(page, "Journey");
  await nav(page, "Objectives");
  await expect(page.getByLabel("Search requests")).toHaveValue("Pushup");
});
test("unfinished registration restores its name, units and completed body measurements", async ({
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
  await page.getByLabel("Assessment units").selectOption("imperial");
  await page
    .getByLabel("Maximum consecutive pushups (repetitions)", { exact: true })
    .fill("28");
  await page.reload();
  await expect(page.getByLabel("Assessment units")).toHaveValue("imperial");
  await expect(
    page.getByLabel("Maximum consecutive pushups (repetitions)", {
      exact: true,
    }),
  ).toHaveValue("28");
  await page
    .getByRole("button", { name: "Previous step", exact: true })
    .click();
  await expect(page.getByLabel("Adventurer name", { exact: true })).toHaveValue(
    "Mara",
  );
});
test("a later milestone offers earned mastery and matching certified performance releases the level", async ({
  page,
}) => {
  await sample(page);
  await page.evaluate(async () => {
    const c = JSON.parse(
      (await (await import("/e2e/browser-store.ts")).readString())!,
    );
    c.completions = Array.from({ length: 70 }, (_, i) => ({
      id: `practice-${i}`,
      period: `practice-${i}`,
      title: "Practice",
      at: "2026-09-01T12:00:00Z",
      classId: "warrior",
      scope: "class",
      stat: "STR",
      xp: 150,
      rank: "C",
    }));
    c.exams = [5, 10].map((milestone, i) => ({
      id: `passed-${milestone}`,
      scope: "class",
      owner: "warrior",
      milestone,
      stat: "STR",
      at: "2026-10-01T12:00:00Z",
      status: "passed",
      protocol: "push-floor",
      value: 22 + i * 2,
      baseline: 20 + i * 2,
    }));
    await (
      await import("/e2e/browser-store.ts")
    ).replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Class Paths");
  await page
    .getByRole("button", { name: "Open examination", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open Warrior exam", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Maintain mastery", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Maintain 24 repetitions",
  );
  await page.getByLabel("Exam result", { exact: true }).fill("24");
  await page
    .getByRole("button", { name: "Submit measured result", exact: true })
    .click();
  await expect(page.locator(".exam-result")).toContainText("Passed");
  const c = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
  expect(c.exams.at(-1).route).toBe("mastery");
  expect(c.exams.at(-1).status).toBe("passed");
});
test("reports show comparable raw results and local recovery can be reviewed after primary corruption", async ({
  page,
}) => {
  await sample(page);
  await page.evaluate(async () => {
    const c = JSON.parse(
      (await (await import("/e2e/browser-store.ts")).readString())!,
    );
    c.createdAt = "2026-10-01T12:00:00Z";
    c.assessmentHistory = [20, 30].map((pushups, i) => ({
      at: `2026-10-${i ? "20" : "01"}T12:00:00Z`,
      assessment: { ...c.baseline.assessment, pushups },
      stats: c.baseStats,
    }));
    await (
      await import("/e2e/browser-store.ts")
    ).replaceString(JSON.stringify(c));
    await (
      await import("/src/device-backups.ts")
    ).saveDeviceSnapshot(c, "before-restore");
  });
  await page.reload();
  await nav(page, "Journey");
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Real-world performance", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".performance-series").first()).toContainText(
    "20 → 30 repetitions",
  );
  await page.evaluate(
    async () =>
      await (await import("/e2e/browser-store.ts")).replaceString("broken"),
  );
  await page.reload();
  await page
    .getByRole("button", {
      name: "Browse device recovery copies",
      exact: true,
    })
    .click();
  await page
    .locator(".device-recovery article")
    .filter({ has: page.getByText("Before restore", { exact: true }) })
    .getByRole("button", { name: "Review copy", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Restore character", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restore character", exact: true })
    .click();
  await expect(page.locator(".engraved-card")).toBeVisible();
});
