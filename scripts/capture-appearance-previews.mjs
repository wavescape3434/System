import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
      reducedMotion: "reduce",
      timezoneId: "America/Denver",
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
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
  const shot = async (name) => {
    await page.evaluate(() => document.fonts.ready);
    await page.locator("svg image").evaluateAll(async (images) => {
      await Promise.all(
        images.map((i) => {
          const im = new Image();
          im.src = i.getAttribute("href");
          return im.decode();
        }),
      );
    });
    await page.screenshot({
      path: `docs/screenshots/${name}.png`,
      fullPage: true,
    });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw Error(`Overflow ${name}`);
  };
  await nav("Settings");
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page
    .getByRole("button", { name: "Preview Moonsilk Dancer", exact: true })
    .click();
  await shot("appearance-roster");
  await page
    .getByRole("button", { name: "Use Moonsilk Dancer", exact: false })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("appearance-roster-mobile");
  await nav("Adventures");
  await page
    .getByRole("button", { name: /STAGE 1/ })
    .first()
    .click();
  await shot("character-battle-mobile");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await shot("character-battle");
  console.log(JSON.stringify({ errors }));
} finally {
  await browser.close();
}
