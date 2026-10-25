import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  reducedMotion: "reduce",
});
const errors = [];
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
  await page.screenshot({
    path: `docs/screenshots/${name}.png`,
    fullPage: true,
  });
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw Error(`Overflow ${name}`);
};
await page.evaluate(async () => {
  const d = await import("/src/domain.ts");
  let c = JSON.parse(localStorage.getItem("the-guild.character.v1"));
  for (const cadence of ["daily", "weekly", "monthly"]) {
    const o = d
      .objectives(c)
      .find(
        (o) =>
          o.cadence === cadence && o.scope === "universal" && o.stat === "CON",
      );
    if (o) c = d.takeRequest(c, o.id);
  }
  localStorage.setItem("the-guild.character.v1", JSON.stringify(c));
});
await page.reload();
await shot("guild-hub");
await nav("Objectives");
await shot("compact-objectives");
await nav("Adventures");
await page
  .getByRole("button", { name: /STAGE 1/ })
  .first()
  .click();
await shot("battle-polished");
await page.getByRole("button", { name: "Attack", exact: true }).click();
await shot("battle-impact");
await page.setViewportSize({ width: 390, height: 844 });
await shot("battle-polished-mobile");
await nav("Guild");
await shot("guild-hub-mobile");
await nav("Objectives");
await shot("compact-objectives-mobile");
await nav("Skills & Stats");
await page.getByRole("button", { name: "Skill tree", exact: true }).click();
await page.getByRole("tab", { name: "Class", exact: true }).click();
await shot("skill-tree-overview-mobile");
await page.getByRole("button", { name: "Skill list", exact: true }).click();
await shot("skill-list-mobile");
await nav("Settings");
await shot("reminders-settings");
await page.evaluate(async () => {
  const { campaign } = await import("/src/rpg.ts"),
    { PLACES } = await import("/src/world-catalog.ts");
  const key = "the-guild.character.v1",
    c = JSON.parse(localStorage.getItem(key));
  c.campaign = { ...campaign(c), battle: undefined, cleared: PLACES[0].stages };
  c.campaign.world.expedition = PLACES[0].id;
  localStorage.setItem(key, JSON.stringify(c));
});
await page.reload();
await nav("Adventures");
await page.evaluate(() => {
  const values = [0.99, 0.7, 0, 0.5];
  let i = 0;
  Math.random = () => values[i++ % values.length];
});
await page
  .getByRole("button", { name: "Continue exploring", exact: true })
  .click();
await shot("expedition-mobile");
console.log(JSON.stringify({ errors }));
await browser.close();
