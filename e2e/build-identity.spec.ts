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
const read = (page: Page) =>
  page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
const seed = async (
  page: Page,
  mode: "ice" | "sword" | "paladin" | "legacy",
) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.locator(".app-shell").waitFor();
  await page.evaluate(async (mode) => {
    const b = await import("/e2e/browser-store.ts"),
      r = await import("/src/rpg.ts");
    let c = JSON.parse((await b.readString())!);
    c.activeClass =
      mode === "ice" || mode === "legacy"
        ? "scholar"
        : mode === "paladin"
          ? "paladin"
          : "warrior";
    c.baseStats = { STR: 30, DEX: 30, CON: 30, INT: 30, WIS: 30, CHA: 30 };
    const id =
      mode === "ice"
        ? "element-ice-2"
        : mode === "sword"
          ? "martial-sword-2"
          : "opening-mage-0-0";
    c.earnedSkills.push(id);
    c.campaign = {
      ...r.campaign(c),
      battle: undefined,
      vitals: undefined,
      equippedSkills: [id],
      party: ["mira"],
    };
    if (mode === "legacy") {
      c = r.startBattle(c, "mossfall-1");
      for (const a of c.campaign.battle.party[0].abilities) {
        delete a.element;
        delete a.discipline;
        delete a.signature;
      }
      for (const e of c.campaign.battle.enemies) {
        delete e.weak;
        delete e.resist;
      }
    }
    await b.replaceString(JSON.stringify(c));
  }, mode);
  await page.reload();
  await nav(page, "Adventures");
};
const begin = async (page: Page) => {
  await page.locator(".pixel-stage-enter").click();
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts");
    const c = JSON.parse((await b.readString())!);
    for (const e of c.campaign.battle.enemies) {
      e.hp = e.maxHp = 10000;
    }
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Adventures");
};

test("phone loadout and combat expose elemental effects, then preserve chill across reload", async ({
  page,
}) => {
  await seed(page, "ice");
  await page
    .getByRole("button", { name: "Skill loadout", exact: true })
    .click();
  await expect(
    page.locator(".skill-card").filter({ hasText: "Rime Shard: Refinement" }),
  ).toContainText("25%");
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await begin(page);
  await expect(page.locator(".elemental-readout")).toContainText("Weak: ice");
  await page.getByText("Technique details", { exact: true }).click();
  await expect(page.locator(".battle-technique-guide")).toContainText(
    "two enemy rounds",
  );
  await page
    .locator(".battle-actions")
    .getByRole("button", { name: /Rime Shard: Refinement/ })
    .click();
  const after = await read(page);
  expect(after.campaign.battle.enemies[0].chill).toBe(2);
  expect(
    after.campaign.battle.log.some((s: string) => s.includes("ice weakness")),
  ).toBe(true);
  await page.reload();
  await nav(page, "Adventures");
  expect((await read(page)).campaign.battle).toEqual(after.campaign.battle);
});

test("sword preparation is visible after the enemy round and consumed by the next technique", async ({
  page,
}) => {
  await seed(page, "sword");
  await begin(page);
  await page.getByRole("button", { name: /^Guard/ }).click();
  await page.getByRole("button", { name: /^Guard/ }).click();
  await expect(
    page.getByText("Sword follow-through ready", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Measured Cut/ }).click();
  const c = await read(page);
  expect(c.campaign.battle.party[0].poise).toBeUndefined();
  expect(c.campaign.battle.log).toContain("Sword follow-through: +25% damage.");
});

test("prestige signature visibly protects the party and spends MP without changing real progress", async ({
  page,
}) => {
  await seed(page, "paladin");
  await page
    .getByRole("button", { name: "Skill loadout", exact: true })
    .click();
  await expect(page.locator(".signature-loadout")).toContainText(
    "guard every living ally",
  );
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await begin(page);
  const before = await read(page);
  await page.getByRole("button", { name: /Dawnblade Covenant/ }).click();
  const c = await read(page);
  expect(
    c.campaign.battle.party.every((u: { guard: boolean }) => u.guard),
  ).toBe(true);
  expect(c.campaign.battle.party[0].mp).toBeLessThan(
    before.campaign.battle.party[0].mp,
  );
  expect(c.baseStats).toEqual(before.baseStats);
  expect(c.completions).toEqual(before.completions);
});

test("saved legacy fight retains neutral commands instead of acquiring new elemental rules", async ({
  page,
}) => {
  await seed(page, "legacy");
  const before = await read(page);
  await expect(page.locator(".elemental-readout")).toHaveCount(0);
  await page.getByRole("button", { name: /^Guard/ }).click();
  const after = await read(page);
  expect(after.campaign.battle.party[0].abilities).toEqual(
    before.campaign.battle.party[0].abilities,
  );
  expect(after.campaign.battle.enemies[0].weak).toBeUndefined();
  expect(after.campaign.battle.party[0].mp).toBeGreaterThanOrEqual(
    before.campaign.battle.party[0].mp,
  );
});

test("Mage constellation exposes distinct early elemental branches and complete prerequisites", async ({
  page,
}) => {
  await seed(page, "ice");
  await nav(page, "Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page
    .getByRole("button", { name: "Find Frostcraft", exact: true })
    .click();
  await page
    .getByRole("button", { name: /^Rime Shard: / })
    .first()
    .click();
  const panel = page.getByRole("complementary", { name: "Selected skill" });
  await expect(panel).toContainText("25%");
  await expect(panel).toContainText("Ice element");
  await expect(
    page.getByRole("button", { name: /^Ember Needle:/ }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
