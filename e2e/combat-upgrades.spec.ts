import { test, expect, type Page } from "@playwright/test";
const sample = async (page: Page) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
};
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
test("buying a refinement improves one equipped technique without another slot or real-stat changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await page.evaluate(async () => {
    const key = "the-guild.character.v1",
      c = JSON.parse(
        (await (await import("/e2e/browser-store.ts")).readString())!,
      );
    c.activeClass = "scholar";
    c.examGrandfather = {
      classes: { ...c.examGrandfather?.classes, scholar: 7 },
      professions: c.examGrandfather?.professions || {},
    };
    c.completions = Array.from({ length: 12 }, (_, i) => ({
      id: "scholar-daily",
      title: "Scholar commission",
      at: `2026-09-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
      period: `2026-09-${i + 1}`,
      xp: 200,
      scope: "class",
      classId: "scholar",
      stat: "INT",
    }));
    c.earnedSkills.push(
      "opening-mage-0-0",
      "opening-mage-0-1",
      "opening-mage-1-1",
    );
    c.skillPurchases = [
      { id: "opening-mage-0-0", wallet: "combat", cost: 1 },
      { id: "opening-mage-0-1", wallet: "combat", cost: 3 },
      { id: "opening-mage-1-1", wallet: "combat", cost: 3 },
    ];
    c.campaign = {
      cleared: [],
      gold: 0,
      inventory: {
        potion: 3,
        ether: 1,
        "training-sword": 1,
        "travel-clothes": 1,
      },
      roster: ["mira"],
      party: ["mira"],
      equipment: ["training-sword", "travel-clothes"],
      equippedSkills: ["opening-mage-0-0"],
    };
    await (
      await import("/e2e/browser-store.ts")
    ).replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page
    .getByRole("button", { name: "Spark: Refinement: available", exact: true })
    .click();
  const panel = page.getByRole("complementary", { name: "Selected skill" });
  await expect
    .poll(async () => {
      const node = await page
          .getByRole("button", {
            name: "Spark: Refinement: available",
            exact: true,
          })
          .boundingBox(),
        sheet = await panel.boundingBox();
      return !!node && !!sheet && node.y + 32 < sheet.y;
    })
    .toBe(true);
  await expect(panel).toContainText("Rank 3");
  await expect(panel).toContainText("140%");
  await expect(panel).toContainText("4 MP");
  await panel.getByRole("button", { name: /Purchase skill/ }).click();
  await nav(page, "Adventures");
  await page
    .getByRole("button", { name: "Skill loadout", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Equipped skills · 1/4", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".skill-card").filter({
      has: page.getByRole("heading", {
        name: "Spark: Refinement",
        exact: true,
      }),
    }),
  ).toContainText("+3 combat INT");
  await expect(
    page.locator(".skill-card").filter({
      has: page.getByRole("heading", { name: "Spark: Control", exact: true }),
    }),
  ).toHaveCount(0);
  await page.reload();
  await nav(page, "Adventures");
  await page.locator(".pixel-stage-enter").click();
  await page
    .locator(".battle-actions")
    .getByRole("button", { name: /Spark: Refinement/ })
    .click();
  const evidence = await page.evaluate(async () => {
    const r = await import("/src/rpg.ts"),
      c = JSON.parse(
        (await (await import("/e2e/browser-store.ts")).readString())!,
      );
    return {
      base: c.baseStats,
      purchases: c.skillPurchases,
      slots: r.campaign(c).equippedSkills,
      hero: c.campaign.battle.party[0],
      xp: c.completions.reduce((n: number, o: { xp: number }) => n + o.xp, 0),
    };
  });
  expect(evidence.slots).toEqual(["opening-mage-0-2"]);
  expect(evidence.purchases.at(-1).cost).toBe(6);
  expect(evidence.base.INT).toBe(10);
  expect(evidence.xp).toBe(2400);
  expect(evidence.hero.maxMp - evidence.hero.mp).toBe(4);
});
test("a shell is visible, ordinary attacks chip it, and a class technique breaks it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await page.evaluate(async () => {
    const r = await import("/src/rpg.ts"),
      key = "the-guild.character.v1",
      c = JSON.parse(
        (await (await import("/e2e/browser-store.ts")).readString())!,
      );
    c.campaign = { ...r.campaign(c), cleared: ["mossfall-1", "mossfall-2"] };
    await (
      await import("/e2e/browser-store.ts")
    ).replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Adventures");
  await page.locator(".pixel-stage-enter").click();
  await expect(
    page.locator(".battle-tactic-readout").filter({ hasText: /Shell \d+/ }),
  ).toContainText("Shell 2");
  await page.getByRole("button", { name: "Attack", exact: true }).click();
  await expect(
    page.locator(".battle-tactic-readout").filter({ hasText: /Shell \d+/ }),
  ).toContainText("Shell 1");
  await page.getByRole("button", { name: /^Guard/ }).click();
  const signature = await page.evaluate(
    async () =>
      JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!)
        .campaign.battle.party[0].abilities[0].name,
  );
  await page
    .locator(".battle-actions")
    .getByRole("button")
    .filter({ hasText: signature })
    .click();
  await expect(
    page.locator(".battle-tactic-readout").filter({ hasText: /Shell \d+/ }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      async () =>
        JSON.parse(
          (await (await import("/e2e/browser-store.ts")).readString())!,
        ).campaign.battle.enemies[0].shell,
    ),
  ).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("the guardian telegraphs a saved cleave and guarding protects both party members", async ({
  page,
}) => {
  await sample(page);
  await page.evaluate(async () => {
    const r = await import("/src/rpg.ts"),
      { PLACES } = await import("/src/world-catalog.ts"),
      key = "the-guild.character.v1",
      c = JSON.parse(
        (await (await import("/e2e/browser-store.ts")).readString())!,
      );
    c.campaign = { ...r.campaign(c), cleared: PLACES[0].stages.slice(0, 9) };
    await (
      await import("/e2e/browser-store.ts")
    ).replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Adventures");
  await page.locator(".pixel-stage-enter").click();
  for (let i = 0; i < 2; i++)
    await page.getByRole("button", { name: /^Guard/ }).click();
  await expect(page.locator(".enemy-intent")).toContainText("Preparing cleave");
  await page.reload();
  await nav(page, "Adventures");
  await expect(page.locator(".enemy-intent")).toContainText("Preparing cleave");
  for (let i = 0; i < 2; i++)
    await page.getByRole("button", { name: /^Guard/ }).click();
  await expect(page.locator(".enemy-intent")).toContainText(
    "Cleave · all allies",
  );
  for (let i = 0; i < 2; i++)
    await page.getByRole("button", { name: /^Guard/ }).click();
  const b = await page.evaluate(
    async () =>
      JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!)
        .campaign.battle,
  );
  expect(b.party.every((u: { hp: number }) => u.hp > 0)).toBe(true);
  expect(b.log.filter((s: string) => s.includes("Briar Cleave"))).toHaveLength(
    2,
  );
});
