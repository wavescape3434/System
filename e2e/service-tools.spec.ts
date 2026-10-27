import { test, expect, type Page } from "@playwright/test";
const nav = async (page: Page, name: string) => {
  await page.locator(".app-shell").waitFor();
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
const read = async (page: Page) =>
  page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
const seed = async (page: Page, mode = "normal") => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.locator(".app-shell").waitFor();
  await page.evaluate(async (mode) => {
    const b = await import("/e2e/browser-store.ts"),
      u = await import("/src/career-payoffs.ts"),
      r = await import("/src/rpg.ts"),
      w = await import("/src/world.ts"),
      d = await import("/src/domain.ts"),
      catalog = await import("/src/world-catalog.ts");
    let c = JSON.parse((await b.readString())!);
    c.campaign = r.campaign(c);
    c.earnedSkills.push(...u.CAREER_UTILITIES.map((u) => u.skills[0]));
    c.campaign.world.journal = [
      {
        id: "record",
        placeId: "mossfall-path",
        kind: "gather",
        at: new Date().toISOString(),
        text: "Collected sunleaf",
        resource: "sunleaf",
        quantity: 3,
      },
    ];
    c.campaign.world.kills["mossfall-path:slime"] = 12;
    c.campaign.inventory.sunleaf = 8;
    if (mode === "reserves" || mode === "expedition") {
      const units = r.adventureParty(c);
      c.campaign.vitals = {
        day: d.period("daily"),
        members: Object.fromEntries(
          units.map((u, i) => [
            u.id,
            {
              hp: i === 0 ? u.maxHp - 5 : 0,
              mp: i === 0 ? u.maxMp - 2 : 0,
              maxHp: u.maxHp,
              maxMp: u.maxMp,
            },
          ]),
        ),
      };
    }
    if (mode === "expedition") {
      c.campaign.cleared = [
        ...catalog.PLACES.find((p) => p.id === "mossfall-path")!.stages,
      ];
      c = w.explore(c, "mossfall-path", () => 0.75);
    }
    c = w.takeWorldContract(c, "alderhaven-herbs");
    await b.replaceString(JSON.stringify(c));
  }, mode);
  await page.reload();
  await nav(page, "Adventures");
};
const tool = async (page: Page, id: string) => {
  if (!(await page.getByLabel("Field competency", { exact: true }).isVisible()))
    await page.locator(".map-fieldwork > summary").click();
  await page.getByLabel("Field competency", { exact: true }).selectOption(id);
};
test("Engineering traces a locked destination and opens only its next reachable route", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  const before = await read(page);
  await tool(page, "route-plan");
  await page.getByLabel("Route destination").selectOption("quarry-dungeon");
  const desk = page.getByLabel("Career fieldwork");
  await expect(desk).toContainText("30 prerequisite stage battles");
  await expect(desk).toContainText("Next route: Briar Road");
  await desk.getByRole("button", { name: "View area", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Briar Road", exact: true }),
  ).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
});
test("Science exports recorded observations and keeps lifetime kills separate", async ({
  page,
}) => {
  await seed(page);
  await tool(page, "field-record");
  const desk = page.getByLabel("Career fieldwork");
  await expect(desk).toContainText("1 recorded exploration");
  await expect(desk).toContainText("Forest Slime: 12");
  await expect(desk).toContainText("Sunleaf: 3");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export field record", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("guild-field-record.txt");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString()).toContain(
    "Confirmed defeats (lifetime counters)",
  );
  await page.getByLabel("Field record area").selectOption("quarry-path");
  await expect(desk).toContainText("0 recorded explorations");
});
test("Healthcare projects capped item effects without healing and opens the party", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, "reserves");
  const before = await read(page);
  await tool(page, "triage");
  const desk = page.getByLabel("Career fieldwork");
  await expect(desk).toContainText("One potion: +5 HP · 45 unused");
  await expect(desk).toContainText("Potions and ethers cannot revive");
  await expect(desk).toContainText("Next full rest:");
  await desk.getByRole("button", { name: "Open party", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Companions", exact: true }),
  ).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
});
test("Education reads the next stage and opens the actual skill loadout", async ({
  page,
}) => {
  await seed(page);
  const before = await read(page);
  await tool(page, "battle-primer");
  const desk = page.getByLabel("Career fieldwork");
  await expect(desk).toContainText("Equipped shell breakers");
  await expect(desk).toContainText("Guard · Every living party member");
  await desk
    .getByRole("button", { name: "Open skill loadout", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Equipped skills/ }),
  ).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
});
test("Law previews consumed materials then routes to the real commission board", async ({
  page,
}) => {
  await seed(page);
  const before = await read(page);
  await tool(page, "writ");
  await page.getByLabel("Writ commission").selectOption("alderhaven-herbs");
  const desk = page.getByLabel("Career fieldwork");
  await expect(desk).toContainText("Turn-in consumes 6 Sunleaf");
  await expect(desk).toContainText("Remaining after turn-in: 2");
  await expect(desk).toContainText("Ready to report here");
  await desk
    .getByRole("button", { name: "Open guild requests", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Guild requests", exact: true }),
  ).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
});
test("Community separates recruitment locks and retained membership", async ({
  page,
}) => {
  await seed(page);
  const before = await read(page);
  await tool(page, "service-roster");
  const desk = page.getByLabel("Career fieldwork");
  await page.getByLabel("Service companion").selectOption("elara");
  await expect(desk).toContainText("Route not yet open");
  await expect(
    desk.getByRole("button", { name: "View area", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Service companion").selectOption("mira");
  await expect(desk).toContainText("In active party");
  await desk.getByRole("button", { name: "Open party", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Companions", exact: true }),
  ).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
});
test("new tools can be inspected during an expedition without restoring reserves or leaving it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, "expedition");
  const before = await read(page);
  await page.getByRole("button", { name: "Fieldwork", exact: true }).click();
  await tool(page, "triage");
  await expect(
    page.getByRole("dialog", { name: "Fieldwork", exact: true }),
  ).toContainText("One potion: +5 HP");
  await tool(page, "service-roster");
  await expect(page.getByLabel("Career fieldwork")).toContainText(
    "Recruitment available in Party",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Continue exploring", exact: true }),
  ).toBeVisible();
  expect((await read(page)).campaign).toEqual(before.campaign);
});
