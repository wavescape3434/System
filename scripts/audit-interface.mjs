import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";

// Review harness only. Uses an isolated browser and sample character.
// Install axe-core outside the application, then set AXE_PATH if needed.
const baseURL = process.env.AUDIT_URL || "http://127.0.0.1:4174";
const out = process.env.AUDIT_OUTPUT || "docs/reviews/2026-10-24";
const axe = await readFile(
  process.env.AXE_PATH ||
    "/tmp/guild-ui-audit/node_modules/axe-core/axe.min.js",
  "utf8",
);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const report =
  process.env.AUDIT_EXTRA === "1"
    ? JSON.parse(await readFile(`${out}/interface-evidence.json`, "utf8"))
    : {
        version: "1.10.0",
        sourceCommit: "2044bbd565ff32b63c36ece908c011b98aa29fa1",
        timezone: "America/Denver",
        baseURL,
        states: [],
        errors: [],
      };
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      timezoneId: "America/Denver",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.on("pageerror", (error) =>
      report.errors.push({ width, message: error.message }),
    );
    const scan = async (name, screenshot = false) => {
      await page.evaluate(() => document.fonts.ready);
      await page.addScriptTag({ content: axe });
      const result = await page.evaluate(async () => {
        const visible = (element) => {
          const r = element.getBoundingClientRect(),
            style = getComputedStyle(element);
          return (
            r.width > 0 &&
            r.height > 0 &&
            style.visibility !== "hidden" &&
            style.display !== "none"
          );
        };
        const controls = [
          ...document.querySelectorAll(
            "button,input:not([type=hidden]),select,summary,a[href]",
          ),
        ].filter(visible);
        const label = (element) =>
          (
            element.getAttribute("aria-label") ||
            element.innerText ||
            element.getAttribute("placeholder") ||
            element.tagName
          )
            .replace(/\s+/g, " ")
            .slice(0, 110);
        const compact = controls.map((element) => {
          const r = element.getBoundingClientRect();
          return {
            label: label(element),
            width: Math.round(r.width * 10) / 10,
            height: Math.round(r.height * 10) / 10,
            fontPx: parseFloat(getComputedStyle(element).fontSize),
          };
        });
        const requests = [...document.querySelectorAll(".compact-request")].map(
          (e) => e.getBoundingClientRect(),
        );
        const a11y = await window.axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
          },
        });
        return {
          title: document.querySelector("main h1,main h2")?.textContent,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: innerWidth,
          documentHeight: document.documentElement.scrollHeight,
          controls: controls.length,
          under44: compact.filter((c) => c.width < 44 || c.height < 44),
          under24: compact.filter((c) => c.width < 24 || c.height < 24),
          visibleRequestCards: requests.filter(
            (r) => r.top < innerHeight - 64 && r.bottom > 80,
          ).length,
          firstRequestTop: requests[0]?.top,
          violations: a11y.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            count: v.nodes.length,
            examples: v.nodes.slice(0, 5).map((n) => ({
              target: n.target,
              html: n.html,
              failure: n.failureSummary,
            })),
          })),
          incompleteChecks: a11y.incomplete.map((v) => ({
            id: v.id,
            count: v.nodes.length,
          })),
        };
      });
      report.states.push({ name, width, ...result });
      if (screenshot)
        await page.screenshot({
          path: `${out}/${name}-${width}.png`,
          fullPage: false,
        });
      console.log(
        `${width} ${name}: ${result.violations.map((v) => `${v.id}:${v.count}`).join(", ") || "no automatic violations"}`,
      );
      await writeFile(
        `${out}/interface-evidence.json`,
        JSON.stringify(report, null, 2) + "\n",
      );
    };
    const button = (name) => page.getByRole("button", { name, exact: true });
    const nav = async (name) => {
      const menu = button("Open navigation");
      if (await menu.isVisible()) await menu.click();
      await page
        .getByRole("navigation", { name: "Main navigation", exact: true })
        .getByRole("button", { name, exact: true })
        .click();
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
    };
    await page.goto(baseURL);
    if (process.env.AUDIT_EXTRA === "1") {
      await button("Try a sample character").click();
      await button("Notifications").click();
      await scan("notifications");
      await button("Close dialog").click();
      await button("Open account settings").click();
      await scan("account-backup");
      await button("Close dialog").click();
      await nav("Class Paths");
      await button("Your class record").click();
      await scan("class-record");
      await nav("Skills & Stats");
      await button("Profession & credentials").click();
      await scan("profession");
      await button("Record a certification").click();
      await scan("credential-form");
      await button("Close dialog").click();
      await button("Guild ranks").click();
      await scan("guild-ranks");
      await nav("Adventures");
      await button("Guild requests").click();
      await scan("adventure-requests");
      await button("Equipment & shop").click();
      await scan("shop");
      await context.close();
      continue;
    }
    await scan("registration");
    await button("Register character").click();
    await scan("profile");
    await page
      .getByLabel("Adventurer name", { exact: true })
      .fill("Audit Adventurer");
    await button("Continue to assessment").click();
    await scan("assessment", width === 390);
    await button("INT").click();
    await button("Start INT check").click();
    await scan("mental-check");
    await page.reload();
    await button("Try a sample character").click();
    await scan("guild", width === 390);
    await nav("Objectives");
    await scan("board", width === 390);
    await page
      .getByRole("button", {
        name: "Show details for Warrior commission",
        exact: true,
      })
      .click();
    await scan("request-detail", width === 390);
    await button("Close dialog").click();
    await page.getByRole("button", { name: /^Taken \(/ }).click();
    await scan("taken");
    await nav("Class Paths");
    await scan("classes", width === 390);
    await button("Vocation").click();
    await scan("vocation");
    await button("Examinations").click();
    await scan("exams");
    await nav("Skills & Stats");
    await scan("skills-stats");
    await button("Skill tree").click();
    await scan("tree", width === 390);
    await button("Skill list").click();
    await scan("skill-list");
    await nav("Journey");
    await scan("journey");
    await button("Reports").click();
    await scan("reports", width === 390);
    await nav("Settings");
    await scan("settings");
    await button("Appearance").click();
    await scan("appearance");
    await button("Training").click();
    await scan("training");
    await button("Account & data").click();
    await scan("data");
    await nav("Help");
    await scan("help");
    await nav("Adventures");
    await scan("world", width === 390);
    await button("Party").click();
    await scan("party");
    await button("Skill loadout").click();
    await scan("loadout");
    await button("World map").click();
    await page
      .getByRole("button", { name: /STAGE 1/ })
      .first()
      .click();
    await scan("battle", width === 390);
    await context.close();
  }
} finally {
  await writeFile(
    `${out}/interface-evidence.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser.close();
}
