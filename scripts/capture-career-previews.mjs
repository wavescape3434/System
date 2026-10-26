import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const dir = "docs/career-1.17";
await mkdir(dir, { recursive: true });
const axe = await readFile(
  "/tmp/guild-ui-audit/node_modules/axe-core/axe.min.js",
  "utf8",
);
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const screens = [],
  errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    timezoneId: "America/Denver",
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const nav = async (name) => {
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
  const shot = async (name) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/screenshots/${name}.png` });
    await page.addScriptTag({ content: axe });
    screens.push({
      name,
      ...(await page.evaluate(async () => {
        const r = await window.axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
          },
        });
        return {
          width: innerWidth,
          height: innerHeight,
          overflow: document.documentElement.scrollWidth > innerWidth,
          violations: r.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
        };
      })),
    });
  };
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Try a sample character", exact: true })
    .click();
  await page.evaluate(async () => {
    const b = await import("/e2e/browser-store.ts"),
      c = JSON.parse(await b.readString());
    const rows = [
      [
        "business",
        "Analyst",
        "Query validation",
        "Cleaned a sales dataset, reconciled totals and saved the SQL query with a chart.",
      ],
      [
        "technology",
        "Analyst",
        "VLAN lab",
        "Configured two VLANs and a trunk in Packet Tracer. Fixed a native-VLAN mismatch; all test pings pass.",
      ],
      [
        "logistics",
        "Logistician",
        "Inventory review",
        "Reconciled a sample stock sheet and documented three causes of missing inventory.",
      ],
      [
        "education",
        "Teacher",
        "Lesson practice",
        "Prepared a subnetting lesson with five retrieval questions and an answer key.",
      ],
      [
        "creative",
        "Graphic Designer",
        "Portfolio revision",
        "Revised a dashboard layout after checking label contrast, spacing and reading order.",
      ],
      [
        "finance",
        "Accountant",
        "Ledger reconciliation",
        "Balanced a sample ledger and traced each correction to its source record.",
      ],
    ];
    c.completions = rows.map(([category, profession, title, output], i) => ({
      id: "preview-career-" + i,
      period: "2026-10-" + (26 - i),
      at: `2026-10-${26 - i}T18:00:00Z`,
      xp: 30,
      stat: "INT",
      classId: c.activeClass,
      title,
      profession,
      scope: "profession",
      careerCategory: category,
      vocationId: category === "technology" ? "networking" : undefined,
      result: { output, minutes: 25 + i * 5 },
    }));
    c.earnedSkills.push(
      "career-opening-business-0",
      "career-opening-technology-0",
    );
    await b.replaceString(JSON.stringify(c));
  });
  await page.reload();
  await nav("Skills & Stats");
  await page
    .getByRole("button", { name: "Profession & credentials", exact: true })
    .click();
  await page
    .getByRole("button", { name: "All disciplines", exact: true })
    .click();
  await shot("career-work-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".career-work-record")
    .evaluate((el) =>
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 95,
        behavior: "instant",
      }),
    );
  await shot("career-work-mobile");
  await nav("Adventures");
  await page
    .getByText("Quartermaster’s Ledger · Alderhaven", { exact: true })
    .click();
  await page.getByText("Warden’s Diagnostics", { exact: true }).click();
  await page
    .locator(".career-fieldwork")
    .evaluate((el) =>
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 90,
        behavior: "instant",
      }),
    );
  await shot("career-fieldwork-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .locator(".career-fieldwork")
    .evaluate((el) =>
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY - 90,
        behavior: "instant",
      }),
    );
  await shot("career-fieldwork-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await nav("Settings");
  await page
    .getByLabel("Adventurer name", { exact: true })
    .fill("Unsaved change");
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "head")
        throw new DOMException("Storage full", "QuotaExceededError");
      return put.apply(this, args);
    };
  });
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Last change wasn’t saved" })
    .waitFor();
  await shot("save-failure-mobile");
  await page.reload();
  await page.locator(".app-shell").waitFor();
  await page.evaluate(async () => {
    await (
      await import("/e2e/browser-store.ts")
    ).replaceString("Damaged primary fixture");
  });
  await page.reload();
  await page
    .getByRole("heading", { name: "Saved data needs recovery.", exact: true })
    .waitFor();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await shot("primary-recovery-desktop");
  await writeFile(
    `${dir}/screens.json`,
    JSON.stringify({ screens, errors }, null, 2) + "\n",
  );
  console.log(JSON.stringify({ screens, errors }, null, 2));
  if (errors.length || screens.some((s) => s.overflow || s.violations.length))
    process.exitCode = 1;
} finally {
  await browser.close();
}
