import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const folder = new URL("../docs/screenshots/", import.meta.url).pathname;
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
  timezoneId: "America/Denver",
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const capture = async (name, fullPage = false) => {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: folder + name + ".png", fullPage });
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw new Error(name + ": horizontal overflow");
};
const nav = async (name) => {
  const bottom = page
    .locator(".mobile-bottom-nav")
    .getByRole("button", { name, exact: true });
  if (await bottom.isVisible()) await bottom.click({ timeout: 10000 });
  else {
    const menu = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    if (await menu.isVisible()) await menu.click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name, exact: true })
      .click({ timeout: 10000 });
  }
  await page.evaluate(() => scrollTo(0, 0));
};
await page.goto("http://127.0.0.1:5173");
await page
  .getByRole("button", { name: "Try a sample character", exact: true })
  .click();
await capture("guild-desktop");
await page
  .locator(".engraved-card")
  .screenshot({ path: folder + "guild-card-detail.png" });
await nav("Settings");
await capture("settings");
await page.getByRole("button", { name: "Assessment", exact: true }).click();
await page
  .getByLabel("Strength assessment", { exact: true })
  .selectOption("grip");
await page
  .getByLabel("Maximum grip strength (kg)", { exact: true })
  .fill("51.6");
await capture("assessment");
await page.getByRole("button", { name: "Results", exact: true }).click();
await capture("assessment-results");
await nav("Objectives");
await page.getByLabel("Objective category").selectOption("universal");
await page.getByLabel("Request rank").selectOption("C");
await capture("ranked-requests");
await page.getByLabel("Objective category").selectOption("class");
await page.getByLabel("Request rank").selectOption("all");
await page
  .getByRole("button", { name: "Take Warrior commission", exact: true })
  .click();
await page
  .locator(".request-view-tabs")
  .getByRole("button", { name: /^Taken/ })
  .click();
await capture("taken-requests");
await nav("Help");
await capture("help");
await page.setViewportSize({ width: 390, height: 844 });
await page.reload();
await capture("guild-android");
await nav("Objectives");
await page.getByLabel("Request rank").selectOption("C");
await page.getByLabel("Objective category").selectOption("universal");
await capture("objectives-android");
await nav("Settings");
await capture("settings-android");
await page.getByLabel("Text size").selectOption("large");
await capture("settings-large-android");
await page.getByLabel("Text size").selectOption("standard");
await page.setViewportSize({ width: 1440, height: 1050 });
await nav("Class Paths");
await capture("class-paths");
await page
  .getByRole("button", { name: "Add Warrior to comparison", exact: true })
  .click();
await page.getByLabel("Search classes").fill("Paladin");
await page
  .getByRole("button", { name: "Add Paladin to comparison", exact: true })
  .click();
await page.getByRole("button", { name: "Compare 2/3", exact: true }).click();
await capture("class-comparison");
await page.getByRole("button", { name: "Close dialog", exact: true }).click();
await page.getByRole("button", { name: "Vocation", exact: true }).click();
await capture("vocation");
await nav("Skills & Stats");
await page.getByRole("button", { name: "Skill tree", exact: true }).click();
await page.getByRole("tab", { name: "Class", exact: true }).click();
await capture("skill-tree");
await page.getByRole("tab", { name: "Profession", exact: true }).click();
await page.getByLabel("Profession tree").selectOption("technology");
await capture("profession-tree");
await page.setViewportSize({ width: 390, height: 844 });
await nav("Adventures");
await page.getByRole("button", { name: /Approach.*slime/ }).click();
await capture("battle-android");
await browser.close();
if (errors.length) throw new Error(errors.join("\n"));
console.log(
  "Captured training previews; no page errors or horizontal overflow.",
);
