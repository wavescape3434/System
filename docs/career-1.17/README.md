# Career work and primary-save previews

[Gallery](../screenshots/README.md) · [Screen scans](screens.json) · [Storage probe](storage-probe.json) · [Changes](../update-1.17.md).

The screenshots use six scripted career outcomes across Business, Computing, Logistics, Education, Creative work and Finance. Two learned primer skills are explicitly seeded to illustrate the initial field competencies. These previews do not establish skill purchases, real-world work or measured user improvement. Browser workflow tests separately submit an outcome through the interface and verify its work-record export.

The failure preview injects a primary-write error while saving a profile, showing the previous committed character and a persistent error. The recovery preview deliberately damages the primary metadata and shows the available recovery actions. Normal production writes are not fault-injected.

The capture uses Chromium, America/Denver, reduced motion, 390×844 phone and 1440px desktop viewports. It checks horizontal overflow, uncaught page errors and axe-core WCAG A/AA rules on six views. This is screening of those fixtures, not a full accessibility audit or physical Android verification.

With the dev server running on port 5173:

```sh
npm install --prefix /tmp/guild-ui-audit --no-save axe-core@4.14.0
node scripts/capture-career-previews.mjs
node scripts/probe-primary-store.mjs
```

The storage probe creates a synthetic character with 1,500 maximum-length archived notes, times an initial commit/read and ten core-only updates, and counts actual IndexedDB writes. Each core-only update must leave history untouched; the JSON records observed timings rather than enforcing a device-speed threshold. These cloud-browser measurements do not predict Android performance or remove whole-record load/validation/report costs.
