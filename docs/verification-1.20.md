# Version 1.20.0 verification

Verified **26 October 2026**, America/Denver.

## Automated checks

- **245 unit checks pass across 25 files** with `npm test -- --maxWorkers=2`; the clean run completed in 28.58 seconds.
- Eleven new checks cover purchased ownership; actual and preserved route access; retained landmark versus lifetime visit scopes; delivery payouts, quantities, acceptance and shared-town source locks; receipt amounts, repeated turn-ins and local calendar windows; live shop stock/recipes and reserve-preserving travel; combined crafting bills matched against actual purchases; duplicate/foreign/owned/unknown recipe rejection; departure reserves/equipped ownership/local hunt baselines; and no report mutation of progression or campaign state. Registry coverage now verifies learnable non-combat prerequisites for every one of the twenty career categories.
- All **97 browser workflows pass** in a single final run (6.2m) with `npm run test:e2e -- --timeout=60000`, using two workers and a 60-second per-test budget. This covers new and existing career tools plus onboarding, exams, classes, requests/calendar goals, Journey, skills, backups, save recovery, battles, exploration, town stocks, hybrid conditions, reminders and local-midnight recovery.
- Seven new workflows cover a real Manufacturing skill purchase and combined bill; phone folio inspection/navigation; Sales material comparisons; Administration date filtering and text downloads; Hospitality shop travel and Sales travel to another town’s guild board; departure checks/loadout routing; and expedition inspection versus deliberate town travel. Gold, inventory and persistent HP/MP are checked around read-only reports and navigation.
- **Eight final phone/desktop views** have no horizontal overflow, uncaught page errors or flagged axe-core WCAG A/AA issues. The folio uses text states as well as color and stage marks, and its area buttons support keyboard selection. [Capture fixtures and scans](town-1.20/README.md) · [Screenshots](screenshots/README.md). These are screened sample fixtures, not a full accessibility audit.
- Strict TypeScript/Vite and Android Gradle debug builds pass. Main startup JavaScript is approximately **963.2 KB**. All **38** production web files match the packaged `assets/public/` bytes; only the two generated Cordova stubs are additional. Current pixel artwork is present and the superseded atlas is absent.

## Android artifact

| Field | Verified value |
| --- | --- |
| App | The Adventurers Guild |
| Package | `com.theguild.personal` |
| Version / code | **1.20.0 / 22** |
| Minimum / target API | **24 / 36** |
| Size | **14,025,963 bytes** |
| APK SHA-256 | `78d840584ec80a039076f215a40014eb35512dc8a0cf1c338c5f7619e31c26a6` |
| Signing certificate SHA-256 | `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5` |
| Primary database | `the-guild.primary.v1` — unchanged |
| Character schema | Version 1 — no migration added |

Signature verification passes with the same certificate as 1.19. The copied download checksum matches. [Machine-readable results](apk-verification-1.20.json).

## Remaining limits

All twenty career disciplines have an initial utility. This completes P07’s first category pass; deeper later-node uses, deliverable review, mastery and user feedback remain on [the roadmap](../ROADMAP.md). Tools read the currently loaded character. Crafting baskets are temporary, and ordinary board/shop actions still control rewards and spending. Receipt totals are recorded commission income, not wallet balance or profit. Folio landmark counts cover only the retained 120-entry journal; lifetime visit counts are separate. Travel does not heal.

Google setup remains deferred. No live Firebase configuration, deployed-rules validation or physical Android runtime testing is claimed. Installed upgrades, storage pressure, lifecycle/resume, reminders, keyboards and native sharing remain P05 checks. [Readiness record](readiness-1.17.md). Large startup bundles and full-history reporting remain broader performance work. P08 will model income, supplies and equipment spending before economy changes.

[Changes](update-1.20.md) · [Roadmap](../ROADMAP.md) · [Android installation](../downloads/README.md)
