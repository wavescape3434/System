import { test, expect, type Page } from "@playwright/test";
test.use({ timezoneId: "America/Denver" });
const nav = async (page: Page, name: string) => {
  await page.locator(".app-shell").waitFor();
  const m = page.getByRole("button", { name: "Open navigation", exact: true });
  if (await m.isVisible()) await m.click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name, exact: true })
    .click();
};
const read = (page: Page) =>
  page.evaluate(async () =>
    JSON.parse((await (await import("/e2e/browser-store.ts")).readString())!),
  );
async function seed(page: Page, { gym = false, imperial = false } = {}) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.locator(".app-shell").waitFor();
  await page.evaluate(
    async ({ gym, imperial }) => {
      const d = await import("/src/domain.ts"),
        m = await import("/src/metrics.ts"),
        b = await import("/e2e/browser-store.ts");
      const c = d.createCharacter(
        "Training sample",
        { ...d.EMPTY_BASELINE, assessment: { ...m.EMPTY_ASSESSMENT } },
        "warrior",
        "Analyst",
        true,
      );
      if (gym) c.preferences!.equipment.push("gym");
      if (imperial) c.preferences!.units = "imperial";
      await b.replaceString(JSON.stringify(c));
    },
    { gym, imperial },
  );
  await page.reload();
  await nav(page, "Objectives");
  await page.getByRole("button", { name: "Regimen", exact: true }).click();
}
const start = async (page: Page, environment = "home") => {
  await page
    .getByRole("combobox", { name: "Equipment", exact: true })
    .selectOption(environment);
  await page.getByRole("button", { name: "Start plan", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Strength A", exact: true }),
  ).toBeVisible();
};
const take = async (page: Page) => {
  await page
    .getByRole("button", { name: "Take strength session", exact: true })
    .click();
  await expect(
    page.getByRole("form", { name: "Record workout" }),
  ).toBeVisible();
};
async function fill(page: Page) {
  const c = await read(page),
    r =
      c.takenRequests.find(
        (r: any) =>
          r.workout && r.takenPeriod === new Date().toISOString().slice(0, 10),
      ) || c.takenRequests.find((r: any) => r.workout),
    p = r.workout;
  for (const e of p.exercises) {
    for (let i = 0; i < e.sets; i++)
      await page
        .getByRole("spinbutton", {
          name: `${e.name} set ${i + 1} reps`,
          exact: true,
        })
        .fill(String(e.max));
    await page
      .getByRole("combobox", { name: `${e.name} clean reps left`, exact: true })
      .selectOption("3");
    if (e.load)
      await page
        .getByRole("spinbutton", { name: `${e.name} load`, exact: true })
        .fill("22");
  }
  return p;
}
const submit = async (page: Page) => {
  await page
    .getByRole("button", { name: "Submit workout", exact: true })
    .click();
  await expect(
    page.getByText("Completed today", { exact: true }),
  ).toBeVisible();
};
const failNextSave = (page: Page) =>
  page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    let fail = true;
    IDBDatabase.prototype.transaction = function (
      ...args: Parameters<IDBDatabase["transaction"]>
    ) {
      const tx = original.apply(this, args);
      if (
        fail &&
        this.name === "the-guild.primary.v1" &&
        args[1] === "readwrite"
      ) {
        fail = false;
        queueMicrotask(() => tx.abort());
      }
      return tx;
    };
  });

test("novice starts a concrete balanced plan without accepting work or changing stats", async ({
  page,
}) => {
  await seed(page);
  const before = await read(page);
  await expect(
    page.getByRole("combobox", { name: "Strength request rank", exact: true }),
  ).toHaveValue("F");
  await start(page);
  const after = await read(page);
  expect(after.trainingPlan.rank).toBe("F");
  expect(after.trainingPlan.walkMinutes).toBe(5);
  expect(after.takenRequests || []).toHaveLength(0);
  expect(after.baseStats).toEqual(before.baseStats);
  expect(after.startingRank).toBe("F");
  await expect(page.locator(".regimen-exercises > li")).toHaveCount(5);
  await expect(page.locator(".regimen-exercises")).toContainText("rest 90 sec");
  await expect(
    page.getByRole("button", { name: "Take strength session", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("actual work sets and an unfinished draft survive reload, then one committed result pays once", async ({
  page,
}) => {
  await seed(page);
  await start(page);
  await take(page);
  const before = await read(page);
  const first = page.getByRole("spinbutton", {
    name: "Chair sit-to-stand set 1 reps",
    exact: true,
  });
  await expect(first).toHaveValue("");
  await first.fill("8");
  await page.reload();
  await nav(page, "Objectives");
  await expect(
    page.getByRole("spinbutton", {
      name: "Chair sit-to-stand set 1 reps",
      exact: true,
    }),
  ).toHaveValue("8");
  await fill(page);
  await submit(page);
  const c = await read(page);
  expect(c.completions).toHaveLength(1);
  expect(c.completions[0].result.workout.exercises).toHaveLength(5);
  expect(c.completions[0].xp).toBe(10);
  expect(c.baseStats).toEqual(before.baseStats);
  expect(
    await page.evaluate(
      () =>
        Object.keys(localStorage).filter((k) =>
          k.startsWith("guild.workout-draft."),
        ).length,
    ),
  ).toBe(0);
  await page.reload();
  await nav(page, "Objectives");
  await expect(
    page.getByText("Completed today", { exact: true }),
  ).toBeVisible();
  expect((await read(page)).completions).toHaveLength(1);
});

test("failed submission retains the draft and permits a single saved retry", async ({
  page,
}) => {
  await seed(page);
  await start(page);
  await take(page);
  await fill(page);
  await failNextSave(page);
  await page
    .getByRole("button", { name: "Submit workout", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Last change wasn’t saved" }),
  ).toBeVisible();
  expect((await read(page)).completions).toHaveLength(0);
  await expect(
    page.getByRole("spinbutton", {
      name: "Chair sit-to-stand set 1 reps",
      exact: true,
    }),
  ).toHaveValue("8");
  await submit(page);
  expect((await read(page)).completions).toHaveLength(1);
});

test("editing rank and equipment keeps a taken prescription, while walking is independent", async ({
  page,
}) => {
  await seed(page, { gym: true });
  await start(page);
  await take(page);
  const before = (await read(page)).takenRequests[0].workout;
  await page.getByRole("button", { name: "Edit plan", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Strength request rank", exact: true })
    .selectOption("C");
  await page
    .getByRole("combobox", { name: "Equipment", exact: true })
    .selectOption("gym");
  await page
    .getByRole("combobox", {
      name: "Walking target · minutes per walking day",
      exact: true,
    })
    .selectOption("10");
  await page.getByRole("button", { name: "Save plan", exact: true }).click();
  const c = await read(page);
  expect(c.trainingPlan).toMatchObject({
    rank: "C",
    environment: "gym",
    walkMinutes: 10,
  });
  expect(c.takenRequests[0].workout).toEqual(before);
  await expect(page.locator(".regimen-session")).toContainText("Wall pushup");
  await expect(
    page.getByRole("spinbutton", {
      name: "Chair sit-to-stand set 1 reps",
      exact: true,
    }),
  ).toBeVisible();
});

test("two class sessions qualify for a manually accepted strength week without an extra hard day", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2027-02-01T19:00:00Z") });
  await seed(page);
  await start(page);
  await take(page);
  await fill(page);
  await submit(page);
  await page.clock.setFixedTime(new Date("2027-02-04T19:00:00Z"));
  await page.reload();
  await nav(page, "Objectives");
  await expect(
    page.getByRole("heading", { name: "Strength B", exact: true }),
  ).toBeVisible();
  await take(page);
  await fill(page);
  await submit(page);
  await page
    .getByRole("button", {
      name: "Strength week · 2 days · 40 XP",
      exact: true,
    })
    .click();
  const modal = page.getByRole("dialog");
  await modal
    .getByRole("button", { name: "Take request", exact: true })
    .click();
  await modal
    .getByRole("button", {
      name: "Review logged repetitions, setup and load",
      exact: true,
    })
    .click();
  await modal
    .getByRole("button", {
      name: "Choose one repeatable target for the next sessions",
      exact: true,
    })
    .click();
  await modal
    .getByRole("button", { name: "Submit completed request", exact: false })
    .click();
  const c = await read(page);
  expect(c.completions).toHaveLength(3);
  expect(c.completions.at(-1).id).toBe("regimen-weekly-f");
  expect(c.completions.at(-1).xp).toBe(40);
});

test("imperial weighted logs are stored in canonical kilograms", async ({
  page,
}) => {
  await seed(page, { gym: true, imperial: true });
  await start(page, "weights");
  await take(page);
  await expect(
    page.getByText("Load (lb, total moved)", { exact: true }).first(),
  ).toBeVisible();
  await fill(page);
  await submit(page);
  const c = await read(page);
  expect(c.completions[0].result.workout.exercises[0].loadKg).toBeCloseTo(
    9.979032,
    5,
  );
});

test("study records keep the subject and a zero correct-answer result", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts");
    const c = JSON.parse((await b.readString())!);
    c.activeClass = "scholar";
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Scholar requests", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View Scholar commission", exact: true })
    .click();
  const modal = page.getByRole("dialog");
  await modal
    .getByRole("button", { name: "Take request", exact: true })
    .click();
  await modal
    .getByRole("button", { name: "Add results (optional)", exact: true })
    .click();
  await modal.getByLabel("Topic / source").fill("CCNA · OSPF");
  await modal.getByLabel("Checked questions attempted").fill("5");
  await modal.getByLabel("Correct answers", { exact: true }).fill("0");
  await modal
    .getByRole("button", { name: "Submit completed request", exact: false })
    .click();
  expect((await read(page)).completions.at(-1).result).toMatchObject({
    topic: "CCNA · OSPF",
    attempted: 5,
    correct: 0,
  });
});

test("Paladin logs remain available while class focus is unfinished, and pay only after it is checked", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts");
    const c = JSON.parse((await b.readString())!);
    c.activeClass = "paladin";
    c.baseStats = { STR: 30, DEX: 30, CON: 30, INT: 30, WIS: 30, CHA: 30 };
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav(page, "Objectives");
  await start(page);
  await take(page);
  await fill(page);
  await expect(
    page.getByRole("button", { name: "Submit workout", exact: true }),
  ).toBeDisabled();
  expect((await read(page)).completions).toHaveLength(0);
  await page.locator(".regimen-focus").getByRole("button").click();
  await submit(page);
  const c = await read(page);
  expect(c.completions).toHaveLength(1);
  expect(c.completions[0].classId).toBe("paladin");
  expect(c.completions[0].result.workout.exercises).toHaveLength(5);
});
