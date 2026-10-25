import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    timezoneId: "America/Denver",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173");
  const fixture = await page.evaluate(async () => {
    const d = await import("/src/domain.ts");
    const c = d.demoCharacter();
    c.demo = false;
    c.completions = Array.from({ length: 20 }, (_, i) => ({
      id: "warrior-daily",
      period: `2026-09-${String(i + 1).padStart(2, "0")}`,
      at: `2026-09-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
      xp: 60,
      stat: "STR",
      classId: "warrior",
      scope: "class",
      title: "Warrior commission",
      rank: "D",
    }));
    return c;
  });
  await page.goto("http://127.0.0.1:4174");
  await page.evaluate(
    (c) => localStorage.setItem("the-guild.character.v1", JSON.stringify(c)),
    fixture,
  );
  await page.reload();
  const button = (name) => page.getByRole("button", { name, exact: true });
  const nav = async (name) => {
    const menu = button("Open navigation");
    if (await menu.isVisible()) await menu.click();
    await page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("button", { name, exact: true })
      .click();
  };
  const result = { errors };
  result.realCharacterHub = await page.evaluate(() => ({
    cardBottom: document.querySelector(".guild-card")?.getBoundingClientRect()
      .bottom,
    takenTop: document.querySelector(".hub-requests")?.getBoundingClientRect()
      .top,
    allowanceTop: document
      .querySelector(".login-panel")
      ?.getBoundingClientRect().top,
  }));
  await nav("Objectives");
  result.realCharacterBoard = await page.evaluate(() => ({
    firstCardTop: document
      .querySelector(".compact-request")
      .getBoundingClientRect().top,
    visibleWholeCards: [
      ...document.querySelectorAll(".compact-request"),
    ].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.top >= 80 && r.bottom < innerHeight - 64;
    }).length,
  }));
  const more = page.getByRole("button", { name: /^Show \d+ more$/ });
  const before = await page.locator(".compact-request").count();
  const label = await more.textContent();
  await more.click();
  result.pagination = {
    label,
    before,
    after: await page.locator(".compact-request").count(),
  };
  await page.getByLabel("Search requests").fill("Pushup");
  await nav("Journey");
  await nav("Objectives");
  result.filterAfterPageReturn = await page
    .getByLabel("Search requests")
    .inputValue();
  await nav("Class Paths");
  await button("Examinations").click();
  await button("Open Warrior exam").click();
  await page.getByLabel("Exam result").click();
  await page.keyboard.type("42", { delay: 100 });
  result.examKeyboard = {
    value: await page.getByLabel("Exam result").inputValue(),
    focused: await page
      .getByLabel("Exam result")
      .evaluate((e) => e === document.activeElement),
  };
  await page.screenshot({ path: "docs/reviews/2026-10-24/exam-focus-390.png" });
  await button("Close dialog").click();
  await button("Open Warrior exam").click();
  await page.keyboard.press("Shift+Tab");
  result.modalReverseTab = await page.evaluate(() => ({
    inside: !!document.activeElement?.closest("[role=dialog]"),
    active: document.activeElement?.outerHTML.slice(0, 240),
  }));
  await button("Close dialog").click();
  await nav("Objectives");
  await page.getByRole("button", { name: /^Weekly quests/ }).click();
  await page
    .getByRole("button", { name: /^Show details for/ })
    .first()
    .click();
  const take = button("Take request");
  if (await take.isEnabled()) await take.click();
  if (await button("Close dialog").isVisible())
    await button("Close dialog").click();
  await nav("Guild");
  await button("Open requests").click();
  result.weeklyFromHub = {
    takenLabel: await page
      .getByRole("button", { name: /^Taken \(/ })
      .textContent(),
    cardCount: await page.locator(".compact-request").count(),
    empty: await page
      .getByRole("heading", { name: "No taken requests" })
      .isVisible(),
  };
  await nav("Settings");
  await page.getByLabel("Text size", { exact: true }).selectOption("large");
  result.responsive = [];
  for (const width of [320, 390, 600]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of [
      "Guild",
      "Objectives",
      "Skills & Stats",
      "Adventures",
    ]) {
      await nav(name);
      result.responsive.push({
        width,
        page: name,
        ...(await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth,
          overflow: document.documentElement.scrollWidth > innerWidth,
        }))),
      });
    }
  }
  await writeFile(
    "docs/reviews/2026-10-24/workflow-evidence.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
