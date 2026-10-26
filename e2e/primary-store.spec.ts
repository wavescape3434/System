import { test, expect, type Page } from "@playwright/test";
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
const sample = async (page: Page) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  return page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
};
const read = async (page: Page) =>
  page.evaluate(
    async () =>
      (await (await import("/src/primary-store.ts")).readPrimary())!.character!,
  );
test("legacy migration preserves progress and removes the old primary only after commit", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Register character", exact: true })
    .waitFor();
  const original = await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      p = await import("/src/skill-plans.ts");
    let c = d.demoCharacter();
    c = d.complete(
      d.takeRequest(c, "warrior-daily"),
      d.objectives(c).find((o) => o.id === "warrior-daily")!,
    );
    c = p.setPlanGoal(c, "class:fighter", "martial-spear-3");
    localStorage.setItem("the-guild.character.v1", JSON.stringify(c));
    return c;
  });
  await page.reload();
  await expect(page.locator(".engraved-card")).toBeVisible();
  const stored = await read(page);
  expect(stored.id).toBe(original.id);
  expect(stored.completions).toEqual(original.completions);
  expect(stored.skillPlans).toEqual(original.skillPlans);
  expect(
    await page.evaluate(() => localStorage.getItem("the-guild.character.v1")),
  ).toBeNull();
  await page.reload();
  expect((await read(page)).id).toBe(original.id);
});
test("failed migration keeps the original and can be retried on reload", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Register character", exact: true })
    .waitFor();
  const raw = await page.evaluate(async () => {
    const d = await import("/src/domain.ts");
    const raw = JSON.stringify(d.demoCharacter());
    localStorage.setItem("the-guild.character.v1", raw);
    return raw;
  });
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "head")
        throw new DOMException("Storage full", "QuotaExceededError");
      return put.apply(this, args);
    };
  });
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Saved data needs recovery.",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("the-guild.character.v1")),
  ).toBe(raw);
  // A clean context with the same legacy data retries the normal migration.
  const clean = await page
    .context()
    .browser()!
    .newContext({ storageState: await page.context().storageState() });
  try {
    const p = await clean.newPage();
    await p.goto("/");
    await expect(p.locator(".engraved-card")).toBeVisible();
    expect((await read(p)).id).toBe(JSON.parse(raw).id);
  } finally {
    await clean.close();
  }
});
test("only changed history chunks are written and a transaction abort preserves all prior parts", async ({
  page,
}) => {
  await sample(page);
  const result = await page.evaluate(async () => {
    const p = await import("/src/primary-store.ts");
    let old = (await p.readPrimary())!;
    const notes = Array.from({ length: 250 }, (_, i) => ({
      id: String(i),
      at: new Date().toISOString(),
      text: "note " + i,
    }));
    const c = { ...old.character!, journal: notes };
    await p.commitPrimary(c, old.revision, old.character);
    old = (await p.readPrimary())!;
    const writes: string[] = [];
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      writes.push(this.name + ":" + String(args[1]));
      return put.apply(this, args);
    };
    try {
      const named = { ...old.character!, name: "Changed name" };
      const rev = await p.commitPrimary(named, old.revision, old.character);
      const coreOnly = [...writes];
      writes.length = 0;
      const appended = {
        ...named,
        journal: [
          ...named.journal,
          { id: "250", at: new Date().toISOString(), text: "tail" },
        ],
      };
      const r = await p.commitPrimary(appended, rev, named);
      const tailOnly = [...writes];
      IDBObjectStore.prototype.put = function (...args) {
        if (this.name === "history") {
          this.transaction.abort();
          throw Error("Interrupted write");
        }
        return put.apply(this, args);
      };
      let failed = false;
      try {
        await p.commitPrimary(
          {
            ...appended,
            name: "Must not persist",
            journal: [
              ...appended.journal,
              { id: "251", at: new Date().toISOString(), text: "bad" },
            ],
          },
          r,
          appended,
        );
      } catch {
        failed = true;
      }
      const after = (await p.readPrimary())!;
      return {
        coreOnly,
        tailOnly,
        failed,
        name: after.character!.name,
        notes: after.character!.journal.length,
        revision: after.revision,
        expected: r,
      };
    } finally {
      IDBObjectStore.prototype.put = put;
    }
  });
  expect(result.coreOnly).toEqual(["head:current"]);
  expect(result.tailOnly).toEqual(["history:journal:2", "head:current"]);
  expect(result.failed).toBe(true);
  expect(result.name).toBe("Changed name");
  expect(result.notes).toBe(251);
  expect(result.revision).toBe(result.expected);
});
test("a failed UI submission is rolled back and never announces saved rewards", async ({
  page,
}) => {
  await sample(page);
  await page
    .getByRole("button", { name: "Warrior requests", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View Warrior commission", exact: true })
    .click();
  await page.getByRole("button", { name: "Take request", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Submit completed request", exact: true }),
  ).toBeVisible();
  const before = await read(page);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "head")
        throw new DOMException("Storage full", "QuotaExceededError");
      return put.apply(this, args);
    };
  });
  await page
    .getByRole("button", { name: "Submit completed request", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Last change wasn’t saved" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect((await read(page)).completions).toEqual(before.completions);
  await expect(
    page.getByRole("status").filter({ hasText: "Progress saved" }),
  ).toHaveCount(0);
  await page.reload();
  expect((await read(page)).completions).toEqual(before.completions);
});
test("a stale window cannot overwrite newer progress", async ({
  page,
  context,
}) => {
  await sample(page);
  const second = await context.newPage();
  await second.goto("/");
  await expect(second.locator(".engraved-card")).toBeVisible();
  await nav(page, "Settings");
  await page
    .getByLabel("Adventurer name", { exact: true })
    .fill("Newer record");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Profile saved" }),
  ).toBeVisible();
  await nav(second, "Settings");
  await second
    .getByLabel("Adventurer name", { exact: true })
    .fill("Stale record");
  await second
    .getByRole("button", { name: "Save profile", exact: true })
    .click();
  await expect(
    second.getByRole("alert").filter({ hasText: "another Guild window" }),
  ).toBeVisible();
  expect((await read(second)).name).toBe("Newer record");
  await second.reload();
  await expect(second.locator(".engraved-card")).toContainText("Newer record");
});
test("a six-megabyte character imports, saves new progress, exports and reloads", async ({
  page,
}) => {
  const c = await sample(page);
  c.journal = Array.from({ length: 1500 }, (_, i) => ({
    id: String(i),
    at: new Date().toISOString(),
    text: "x".repeat(4000),
  }));
  await page.locator("input[type=file]").setInputFiles({
    name: "large-character.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(c)),
  });
  await page
    .getByRole("button", { name: "Restore character", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await read(page)).journal).toHaveLength(1500);
  await nav(page, "Settings");
  await page
    .getByLabel("Adventurer name", { exact: true })
    .fill("Large record");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Profile saved" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".engraved-card")).toContainText("Large record");
  expect((await read(page)).journal).toHaveLength(1500);
  await page.getByLabel("Open account settings", { exact: true }).click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export character", exact: true })
    .click();
  const { readFile } = await import("node:fs/promises");
  const exported = JSON.parse(
    await readFile((await (await download).path())!, "utf8"),
  );
  expect(exported.journal).toEqual(c.journal);
  expect(exported.name).toBe("Large record");
});

test("missing chunks or impossible lengths fail safely and retain the raw primary for recovery", async ({
  page,
}) => {
  const initial = await sample(page);
  const result = await page.evaluate(async () => {
    const p = await import("/src/primary-store.ts"),
      old = (await p.readPrimary())!;
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open(p.PRIMARY_DATABASE);
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("head", "readwrite"),
        r = tx.objectStore("head").get("current");
      r.onsuccess = () => {
        const h = r.result;
        h.lengths.journal = Number.MAX_SAFE_INTEGER;
        tx.objectStore("head").put(h, "current");
      };
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    let rejected = false;
    try {
      await p.readPrimary();
    } catch {
      rejected = true;
    }
    const raw = JSON.parse(await p.exportOriginalPrimary());
    return {
      rejected,
      length: raw.head.lengths.journal,
      revision: raw.head.revision,
      expected: old.revision,
    };
  });
  expect(result.rejected).toBe(true);
  expect(result.length).toBe(Number.MAX_SAFE_INTEGER);
  expect(result.revision).toBe(result.expected);
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Saved data needs recovery.",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "recovery.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(initial)),
    });
  await page
    .getByRole("button", { name: "Restore character", exact: true })
    .click();
  await expect(page.locator(".engraved-card")).toBeVisible();
  expect((await read(page)).id).toBe(initial.id);
});
test("reset leaves an explicit empty primary so an earlier localStorage copy cannot reappear", async ({
  page,
}) => {
  const c = await sample(page);
  await page.getByLabel("Open account settings", { exact: true }).click();
  await page
    .getByRole("button", { name: "Create your own character", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create character", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Register character", exact: true })
    .waitFor();
  await page.evaluate(
    (c) => localStorage.setItem("the-guild.character.v1", JSON.stringify(c)),
    c,
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Register character", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".engraved-card")).toHaveCount(0);
});
test("a mental exam retains its answers when submission storage fails and can retry", async ({
  page,
}) => {
  await sample(page);
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts"),
      c = JSON.parse((await b.readString())!);
    c.activeClass = "scholar";
    c.unlockedClasses = [...new Set([...(c.unlockedClasses || []), "scholar"])];
    c.completions = Array.from({ length: 20 }, (_, i) => ({
      id: "scholar-daily",
      period: `2026-09-${i + 1}`,
      at: new Date(Date.UTC(2026, 8, i + 1, 12)).toISOString(),
      xp: 60,
      stat: "INT",
      classId: "scholar",
      scope: "class",
      title: "Study",
      rank: "D",
    }));
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Class Paths");
  await page.getByRole("button", { name: "Examinations", exact: true }).click();
  await page
    .getByRole("button", { name: "Open Scholar exam", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start INT check", exact: true })
    .click();
  for (let i = 0; i < 5; i++) {
    await page.locator(".check-options button").first().click();
    if (i < 4)
      await page
        .getByRole("button", { name: "Next question", exact: true })
        .click();
  }
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "head") throw Error("Storage full");
      return put.apply(this, args);
    };
    (window as any).restorePut = () => {
      IDBObjectStore.prototype.put = put;
    };
  });
  await page
    .getByRole("button", { name: "Finish INT check", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Last change wasn’t saved" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Finish INT check", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".check-options .selected")).toHaveCount(1);
  await page.evaluate(() => (window as any).restorePut());
  await page
    .getByRole("button", { name: "Finish INT check", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Start another INT check", exact: true }),
  ).toBeVisible();
  expect((await read(page)).exams?.some((e) => !!e.mental)).toBe(true);
});
