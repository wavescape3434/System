import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1050 },
      timezoneId: "America/Denver",
      reducedMotion: "reduce",
    }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const fixture = JSON.parse(
    await readFile("docs/balance/account-moderate.json", "utf8"),
  );
  const first = fixture.completions.find((o) => o.id === "warrior-monthly"),
    request = fixture.takenRequests.find((o) => o.id === "warrior-monthly");
  fixture.completions = fixture.completions.filter(
    (o) => new Date(o.at) <= new Date("2027-02-18T18:00:00Z"),
  );
  fixture.journeyEvents = fixture.journeyEvents.filter(
    (e) => new Date(e.at) <= new Date("2027-02-18T18:00:00Z"),
  );
  fixture.takenRequests = [
    {
      ...request,
      takenAt: "2027-01-25T18:00:00Z",
      takenPeriod: first.period,
      instanceId: first.period,
    },
  ];
  fixture.milestones = { [`warrior-monthly:${first.period}`]: [0] };
  fixture.demo = true;
  fixture.name = "Rowan";
  await context.addInitScript(
    (c) => localStorage.setItem("the-guild.character.v1", JSON.stringify(c)),
    fixture,
  );
  await page.clock.install({ time: new Date("2027-02-18T18:00:00Z") });
  await page.goto("http://127.0.0.1:5173");
  const nav = async (name) => {
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
  const shot = async (name, fullPage = false) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw Error(name + ": page overflow");
  };
  await nav("Objectives");
  await page.getByRole("button", { name: /^Monthly adventures/ }).click();
  await page.getByLabel("Objective category").selectOption("universal");
  await page.getByLabel("Request rank").selectOption("F");
  await shot("monthly-adventures");
  await page.getByLabel("Objective category").selectOption("class");
  await page.getByLabel("Request rank").selectOption("all");
  await page
    .getByRole("button", {
      name: "View Warrior training adventure",
      exact: true,
    })
    .click();
  await shot("monthly-progress");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".modal").evaluate((el) => {
    el.scrollTop = 0;
  });
  await shot("monthly-progress-android");
  console.log(JSON.stringify({ pageErrors: errors }));
  if (errors.length) throw Error(errors.join("\n"));
} finally {
  await browser.close();
}
