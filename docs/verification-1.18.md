# Version 1.18.0 verification

Verified **26 October 2026**, America/Denver.

## Automated checks

- **223 unit checks pass across 23 files**. The clean full run used `npm test -- --maxWorkers=2` and completed in 24.63 seconds. An initial run with default concurrency exceeded the five-second limit in an existing request-balance case; the unchanged suite passes with bounded workers.
- Ten new checks cover registered/learnable non-combat prerequisite skills, ownership across career changes and backup serialization, hunt acceptance baselines, delivery shortages, exploration readiness and locked regions, equipment gains and losses, discovery/ambush probabilities and guarantees, canonical shop prices, invalid/zero basket quantities, and no mutation of progression or campaign state.
- All **83 browser workflows have passing results**. A full 83-test run passed in 5.6 minutes. After the compact-map adjustment, 13 of 15 targeted workflows passed; two existing world workflows exceeded their time limits with ready controls present. They pass separately with one worker and a 60-second test budget in 16.5 seconds. The final appraisal wording also passes its targeted recheck. This is combined final evidence, not a single full run after every layout/color adjustment.
- Seven new workflows cover purchasing a Finance skill through the actual tree and opening its planner; clearing numeric inputs; planning without spending; Management/Logistics reports and board routing; Agriculture filtering and area routing; Trades comparison and shop routing; Safety predictions followed by the real ambush; expedition Fieldwork without losing the expedition; and learned-tool retention after changing profession. The Finance case also checks that returning from the shop opens the normal map with Fieldwork collapsed.
- Existing workflows retain onboarding, assessments/exams, classes and history, skill constellations and purchases, objectives/calendar rewards, Journey, backups/recovery, party battles, town stocks and hybrid requests. Midnight HP/MP recovery remains covered.
- **Eight final phone/desktop views** have no horizontal overflow, uncaught page errors or flagged axe-core WCAG A/AA issues. The audit corrected low-contrast desktop breadcrumb and paper-dialog title text. [Capture fixtures and scans](fieldwork-1.18/README.md) · [Screenshots](screenshots/README.md). These are screened fixtures, not a full accessibility audit.
- Strict TypeScript/Vite and Android Gradle debug builds pass. Main startup JavaScript is approximately **929.2 KB**. All **38** production web files match their packaged `assets/public/` bytes; only the two generated Cordova stubs are additional. Current pixel artwork is packaged and the superseded atlas is absent.

## Android artifact

| Field | Verified value |
| --- | --- |
| App | The Adventurers Guild |
| Package | `com.theguild.personal` |
| Version / code | **1.18.0 / 20** |
| Minimum / target API | **24 / 36** |
| Size | **14,014,203 bytes** |
| APK SHA-256 | `0132acb77e896d39d2dfc9a5927bcb3f22ae7b804733644cb9173d1a31ca1338` |
| Signing certificate SHA-256 | `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5` |
| Primary database | `the-guild.primary.v1` — unchanged |
| Character schema | Version 1 — no migration added |

Signature verification passes with the same certificate as 1.17. The copied download checksum matches. [Machine-readable results](apk-verification-1.18.json).

## Remaining limits

Eight of twenty career disciplines have field utilities. The remaining twelve stay on [the roadmap](../ROADMAP.md); all twenty retain their existing requests, trees and work records. Reports inspect the current loaded character. Finance baskets are temporary and perform no purchases. Normal guild/shop actions remain authoritative for payouts and spending.

Google setup stays deferred. No live Firebase configuration, deployed-rules validation or physical Android runtime testing is claimed. Installed upgrades, storage pressure, lifecycle/resume, reminders, keyboard behavior for the new inputs and native sharing remain P05 checks. [Readiness record](readiness-1.17.md).

[Changes](update-1.18.md) · [Roadmap](../ROADMAP.md) · [Android installation](../downloads/README.md)
