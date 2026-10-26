import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const nav = async (page: Page, name: string) => {
  await page.locator(".app-shell").waitFor({ state: "visible" });
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
test("career submission appears in the work record and exports without a second entry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Networking requests", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Show details for/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Take request", exact: true }).click();
  await page
    .getByRole("button", { name: "Add results (optional)", exact: true })
    .click();
  await page
    .getByLabel("Completed work / outcome", { exact: true })
    .fill(
      "Built a two-VLAN lab; corrected a trunk mismatch and verified all pings.",
    );
  await page.getByLabel("Duration (minutes)", { exact: true }).fill("25");
  await page
    .getByRole("button", { name: "Submit completed request", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await nav(page, "Skills & Stats");
  await page
    .getByRole("button", { name: "Profession & credentials", exact: true })
    .click();
  await page
    .getByRole("button", { name: "All disciplines", exact: true })
    .click();
  await expect(page.locator(".career-work-record")).toContainText(
    "corrected a trunk mismatch",
  );
  await page.reload();
  await nav(page, "Skills & Stats");
  await page
    .getByRole("button", { name: "Profession & credentials", exact: true })
    .click();
  await page
    .getByRole("button", { name: "All disciplines", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export work record", exact: true })
    .click();
  const file = await download;
  const text = await readFile((await file.path())!, "utf8");
  expect(text).toContain("corrected a trunk mismatch");
  expect(text).toContain("25 minutes");
  expect(text).toContain("Self-reported");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
test("learned career skills unlock field information without changing the character", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  const before = await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts");
    const c = JSON.parse((await b.readString())!);
    c.earnedSkills.push(
      "career-opening-business-0",
      "career-opening-technology-0",
    );
    await b.replaceString(JSON.stringify(c));
    return c;
  });
  await page.reload();
  await nav(page, "Adventures");
  await page
    .getByText("Quartermaster’s Ledger · Alderhaven", { exact: true })
    .click();
  await expect(page.getByLabel("Career fieldwork")).toContainText(
    "Gather at Briar Road",
  );
  await page.getByText("Warden’s Diagnostics", { exact: true }).click();
  await expect(page.getByLabel("Career fieldwork")).toContainText(
    "HP 50 · ATK 14 · DEF 4",
  );
  const after = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
  expect(after.completions).toEqual(before.completions);
  expect(after.baseStats).toEqual(before.baseStats);
  expect(after.campaign).toEqual(before.campaign);
});
