import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "Register character", exact: true })
    .waitFor();
  const result = await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      p = await import("/src/primary-store.ts");
    let c = d.demoCharacter();
    c.journal = Array.from({ length: 1500 }, (_, i) => ({
      id: String(i),
      at: "2026-10-26T12:00:00Z",
      text: "x".repeat(4000),
    }));
    const bytes = new TextEncoder().encode(JSON.stringify(c)).length;
    let start = performance.now(),
      revision = await p.commitPrimary(c, 0);
    const initial = performance.now() - start;
    start = performance.now();
    const loaded = await p.readPrimary();
    const read = performance.now() - start;
    c = loaded.character;
    const timings = [],
      writes = [];
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      writes.push(this.name);
      return put.apply(this, args);
    };
    try {
      for (let i = 0; i < 10; i++) {
        const next = { ...c, title: "Probe " + i };
        start = performance.now();
        revision = await p.commitPrimary(next, revision, c);
        timings.push(performance.now() - start);
        c = next;
      }
    } finally {
      IDBObjectStore.prototype.put = put;
    }
    return {
      fixture: { journalEntries: 1500, serializedBytes: bytes },
      initialCommitMs: initial,
      readMs: read,
      coreUpdateMs: timings,
      coreUpdates: 10,
      coreWrites: writes.filter((x) => x === "head").length,
      historyWrites: writes.filter((x) => x === "history").length,
      retainedJournal: (await p.readPrimary()).character.journal.length,
    };
  });
  await mkdir("docs/career-1.17", { recursive: true });
  await writeFile(
    "docs/career-1.17/storage-probe.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
