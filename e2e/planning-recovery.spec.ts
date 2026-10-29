import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const key = "the-guild.character.v1";
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
const tree = async (page: Page) => {
  await nav(page, "Skills & Stats");
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
};
const restoreFile = async (page: Page, c: unknown) => {
  await page.locator('input[type="file"]').setInputFiles({
    name: "character.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(c)),
  });
  await expect(
    page.getByRole("dialog", { name: "Restore this character?", exact: true }),
  ).toBeVisible();
};
test("skill goals and tree preferences survive a fresh browser session and a file export", async ({
  page,
  context,
  browser,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sample(page);
  await tree(page);
  await page
    .getByRole("button", { name: "Find Spearcraft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Braced Point: locked", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Set skill goal", exact: true })
    .click();
  await page.getByLabel("Close skill details", { exact: true }).click();
  await page.getByRole("button", { name: "Skill list", exact: true }).click();
  for (const category of ["profession", "universal"] as const) {
    await page
      .getByRole("tab", {
        name: category === "profession" ? "Profession" : "Universal",
        exact: true,
      })
      .click();
    if (category === "profession")
      await page
        .getByLabel("Profession tree", { exact: true })
        .selectOption("technology");
    const name = await page.evaluate(async (category) => {
      const { SKILLS } = await import("/src/domain.ts");
      return SKILLS.find(
        (s) =>
          s.category === category &&
          !s.legacy &&
          !s.automatic &&
          s.id !== "universal-root" &&
          (category !== "profession" || s.owner === "technology"),
      )!.name;
    }, category);
    const node = page.locator(".skill-node").filter({ hasText: name }).first();
    await node.click();
    await page
      .getByRole("button", { name: "Set skill goal", exact: true })
      .click();
    await page.getByLabel("Close skill details", { exact: true }).click();
  }
  await page.getByRole("tab", { name: "Class", exact: true }).click();
  const stored = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
  const fresh = await browser.newContext({
    storageState: await context.storageState({ indexedDB: true }),
    viewport: { width: 390, height: 844 },
  });
  try {
    const second = await fresh.newPage();
    await second.goto("/");
    await tree(second);
    await expect(
      second.getByRole("button", { name: "Skill list", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      second.getByRole("button", { name: "Find Spearcraft", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(second.locator(".atlas-goal")).toContainText("Braced Point");
    await second.locator(".planner-goals summary").click();
    await expect(second.locator(".planner-goals button")).toHaveCount(3);
    await second.getByLabel("Open account settings", { exact: true }).click();
    const download = second.waitForEvent("download");
    await second
      .getByRole("button", { name: "Export character", exact: true })
      .click();
    const exported = await download,
      file = JSON.parse(await readFile((await exported.path())!, "utf8"));
    expect(file.skillPlans).toEqual(stored.skillPlans);
    expect(file.completions).toHaveLength(0);
    expect(file.earnedSkills).toEqual(stored.earnedSkills);
  } finally {
    await fresh.close();
  }
});

test("restoring an older file preserves the exact replaced character and can recover after primary corruption", async ({
  page,
}) => {
  await sample(page);
  const older = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
  await page
    .getByRole("button", { name: "Warrior requests", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View Warrior commission", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Choose request rank", exact: true })
    .selectOption("warrior-daily");
  await page.getByRole("button", { name: "Take request", exact: true }).click();
  await page
    .getByRole("button", { name: "Add results (optional)", exact: true })
    .click();
  await page
    .getByLabel("Exercise / variation", { exact: true })
    .fill("Floor pushups");
  await page.getByLabel("Sets", { exact: true }).fill("3");
  await page
    .getByLabel("Reps per set (or total without sets)", { exact: true })
    .fill("10");
  await page
    .getByRole("button", { name: "Submit completed request", exact: true })
    .click();
  const original = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
  await restoreFile(page, older);
  await expect(page.getByLabel("Restore comparison")).toContainText(
    "60 XP · 1 request",
  );
  await page
    .getByRole("button", { name: "Restore character", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          JSON.parse(
            (await (await import("/e2e/browser-store.ts")).readString())!,
          ).completions.length,
      ),
    )
    .toBe(0);
  await page.evaluate(
    async () =>
      await (
        await import("/e2e/browser-store.ts")
      ).replaceString("damaged primary"),
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Browse device recovery copies", exact: true })
    .click();
  const saved = page
    .locator(".device-recovery article")
    .filter({ has: page.getByText("Before restore", { exact: true }) });
  await expect(saved).toContainText("60 XP");
  await saved.getByRole("button", { name: "Review copy", exact: true }).click();
  await expect(page.getByLabel("Restore comparison")).toContainText(
    "No character",
  );
  await page
    .getByRole("button", { name: "Restore character", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          JSON.parse(
            (await (await import("/e2e/browser-store.ts")).readString())!,
          ).completions.length,
      ),
    )
    .toBe(1);
  const recovered = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
  expect(recovered.completions).toEqual(original.completions);
  expect(recovered.skillPlans).toEqual(original.skillPlans);
});

test("IndexedDB recovery is bounded, atomic on clone failure, detects corruption and stores large histories", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      b = await import("/src/device-backups.ts");
    const c = d.demoCharacter();
    for (let i = 0; i < 7; i++)
      await b.saveDeviceSnapshot(c, "daily", new Date(2027, 1, i + 1, 12));
    for (let i = 0; i < 5; i++)
      await b.saveDeviceSnapshot(
        { ...c, name: `Copy ${i}` },
        "before-restore",
        new Date(2027, 2, i + 1, 12),
      );
    const entries = await b.listDeviceSnapshots(),
      ids = entries.map((e) => e.id);
    let cloneFailed = false;
    try {
      await b.saveDeviceSnapshot(
        { ...c, uncloneable: () => 1 } as typeof c,
        "before-restore",
      );
    } catch {
      cloneFailed = true;
    }
    const unchanged =
      JSON.stringify((await b.listDeviceSnapshots()).map((e) => e.id)) ===
      JSON.stringify(ids);
    const large = {
      ...c,
      journal: Array.from({ length: 1500 }, (_, i) => ({
        id: String(i),
        at: new Date().toISOString(),
        text: "x".repeat(4000),
      })),
    };
    await b.saveDeviceSnapshot(large, "before-restore", new Date(2027, 3, 1));
    const latest = (await b.listDeviceSnapshots()).find(
      (e) => e.at === new Date(2027, 3, 1).toISOString(),
    )!;
    const restored = await b.readDeviceSnapshot(latest.id);
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open("the-guild.recovery.v1", 1);
      req.onsuccess = () => resolve(req.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("characters", "readwrite");
      tx.objectStore("characters").put({ invalid: true }, latest.id);
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    let corruptionRejected = false;
    try {
      await b.readDeviceSnapshot(latest.id);
    } catch {
      corruptionRejected = true;
    }
    return {
      count: entries.length,
      daily: entries.filter((e) => e.kind === "daily").length,
      guarded: entries.filter((e) => e.kind !== "daily").length,
      cloneFailed,
      unchanged,
      corruptionRejected,
      size: JSON.stringify(restored).length,
      notes: restored.journal.length,
      primary: await (await import("/e2e/browser-store.ts")).readString(),
    };
  });
  expect(result).toMatchObject({
    count: 5,
    daily: 3,
    guarded: 2,
    cloneFailed: true,
    unchanged: true,
    corruptionRejected: true,
    notes: 1500,
    primary: null,
  });
  expect(result.size).toBeGreaterThan(5_000_000);
});

test("replacement uses a local fallback and refuses to overwrite if both recovery stores fail", async ({
  page,
}) => {
  await sample(page);
  const older = await page.evaluate(async () => ({
    ...JSON.parse(
      (await (await import("/e2e/browser-store.ts")).readString())!,
    ),
    name: "Older copy",
  }));
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "characters")
        throw new DOMException("Quota", "QuotaExceededError");
      return original.apply(this, args);
    };
    const storage = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === "the-guild.before-replace.v1")
        throw new DOMException("Quota", "QuotaExceededError");
      return storage.call(this, name, value);
    };
    (window as unknown as { restoreStorage: () => void }).restoreStorage =
      () => {
        Storage.prototype.setItem = storage;
      };
  });
  await restoreFile(page, older);
  await page
    .getByRole("button", { name: "Restore character", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Could not preserve" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      async () =>
        JSON.parse(
          (await (await import("/e2e/browser-store.ts")).readString())!,
        ).name,
    ),
  ).toBe("Rowan");
  await page.evaluate(() =>
    (window as unknown as { restoreStorage: () => void }).restoreStorage(),
  );
  await page
    .getByRole("button", { name: "Restore character", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          JSON.parse(
            (await (await import("/e2e/browser-store.ts")).readString())!,
          ).name,
      ),
    )
    .toBe("Older copy");
  const fallback = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("the-guild.before-replace.v1")!),
  );
  expect(fallback.character.name).toBe("Rowan");
});

test("starting a new character keeps a recoverable record available from registration", async ({
  page,
}) => {
  await sample(page);
  const original = await page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
  await page.getByLabel("Open account settings", { exact: true }).click();
  await page
    .getByRole("button", { name: "Create your own character", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create character", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Register character", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restore a character", exact: true })
    .click();
  const saved = page
    .locator(".device-recovery article")
    .filter({ has: page.getByText("Before new character", { exact: true }) });
  await saved.getByRole("button", { name: "Review copy", exact: true }).click();
  await page
    .getByRole("button", { name: "Restore character", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          JSON.parse(
            (await (await import("/e2e/browser-store.ts")).readString())!,
          ).id,
      ),
    )
    .toBe(original.id);
});

test("a deferred daily copy keeps its original day when queued across midnight", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2027-02-10T23:59:00.000Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2027-02-10T23:59:59.800Z"));
  await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      b = await import("/src/device-backups.ts");
    window.requestIdleCallback = ((callback: IdleRequestCallback) =>
      setTimeout(
        () => callback({ didTimeout: false, timeRemaining: () => 10 }),
        1000,
      )) as typeof requestIdleCallback;
    const c = { ...d.demoCharacter(), name: "Before midnight" };
    const state = window as unknown as {
      copies: Promise<void>[];
      fixture: typeof c;
    };
    state.fixture = c;
    state.copies = [b.queueDailySnapshot(c)];
  });
  await page.clock.runFor(500);
  await page.evaluate(async () => {
    const b = await import("/src/device-backups.ts"),
      state = window as unknown as {
        copies: Promise<void>[];
        fixture: import("../src/domain").Character;
      };
    state.copies.push(
      b.queueDailySnapshot({ ...state.fixture, name: "After midnight" }),
    );
  });
  await page.clock.runFor(2200);
  const copies = await page.evaluate(async () => {
    await Promise.all(
      (window as unknown as { copies: Promise<void>[] }).copies,
    );
    const b = await import("/src/device-backups.ts");
    return (await b.listDeviceSnapshots())
      .map((entry) => ({ name: entry.name, day: entry.id.split(":daily:")[1] }))
      .sort((a, b) => a.day.localeCompare(b.day));
  });
  expect(copies).toEqual([
    { name: "Before midnight", day: "2027-2-10" },
    { name: "After midnight", day: "2027-2-11" },
  ]);
});
