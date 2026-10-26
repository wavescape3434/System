# Version 1.17.0 verification

Verified **26 October 2026**, America/Denver.

## Automated checks

- **213 unit checks pass across 22 files**. The full run completed in 24.55 seconds; the eight save-queue/career checks also pass after final changes. Coverage includes serialized durable receipts, optimistic pending state, failure rollback without losing acknowledged progress, retry/reset, retained career context, learned-only utilities, shared enemy definitions and read-only supply reports.
- All **76 browser workflows have passing results**. The full suite passed 73 in five minutes. Three added cases and subsequent save-flow changes were checked in a focused pass, with all nine primary-store workflows passing on the final recheck. The two career workflows also pass after the final ledger correction. This is combined evidence, not a single full 76-test run.
- New storage workflows cover legacy migration and failed-migration recovery, unchanged-chunk writes, transaction abort, failed submission without a saved-reward announcement, stale-window rejection, six-megabyte import/save/reload/export, impossible history metadata with safe restoration, reset tombstones and failed mental-exam submission with retained answers and successful retry. Browser fixtures now read/seed the actual primary database; fresh-context captures include IndexedDB.
- Existing workflows retain request acceptance, class history, assessments/exams, plans, credential unlocks, calendar rewards, Journey, party battles, exploration, hybrid requests and persistent HP/MP with local-midnight recovery. The full suite covers request checklists; the final focused pass also rechecks sequential mental checks.
- **Six final phone/desktop views** have no horizontal overflow, uncaught page errors or flagged axe-core WCAG A/AA issues. Contrast fixes cover the new blue field-information panel and existing profession/reminder labels revealed by these views. [Fixtures and scans](career-1.17/README.md) · [Screenshots](screenshots/README.md). This is fixture screening, not a complete accessibility audit.
- A **6,077,942-byte** synthetic character retains all 1,500 notes. Its initial primary commit took **17.2 ms** and read took **16.5 ms** in this browser probe. Ten core-only updates wrote **10 core records and zero history chunks**, with a median of **2.6 ms** per update. These timings are observations from this environment, not Android performance guarantees. [Raw probe](career-1.17/storage-probe.json).
- Strict TypeScript/Vite and Android Gradle debug builds pass. Main startup JavaScript is approximately **915.7 KB**. All **38** production web files match their packaged `assets/public/` bytes; the only extras are the two generated Cordova stubs. Current pixel artwork is included and the superseded atlas is absent.

## Android artifact

| Field | Verified value |
| --- | --- |
| App | The Adventurers Guild |
| Package | `com.theguild.personal` |
| Version / code | **1.17.0 / 19** |
| Minimum / target API | **24 / 36** |
| Size | **14,347,499 bytes** |
| APK SHA-256 | `ae2c38e9bed03874d97b519f642346703d54a30a640ad4bdfad6889fa4cc1678` |
| Signing certificate SHA-256 | `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5` |
| Primary database | `the-guild.primary.v1` |
| Legacy character key | `the-guild.character.v1` — migrated after commit |

The signature verifies with the same certificate as 1.16. The copied download has the same checksum. [Machine-readable results](apk-verification-1.17.json).

Google/Firebase setup remains deferred. Physical Android upgrades, storage pressure, interrupted lifecycle, keyboards, reminders and native sharing are not verified here. Account protocol tests still use SDK doubles; live Firebase sign-in/rules behavior is not established. P05 remains open for those checks. Full-character loading/validation and report calculations still require further long-history profiling. [Readiness record](readiness-1.17.md).

[Changes](update-1.17.md) · [Roadmap](../ROADMAP.md) · [Android installation](../downloads/README.md)
