# Version 1.19.0 verification

Verified **26 October 2026**, America/Denver.

## Automated checks

- **234 unit checks pass across 24 files** with `npm test -- --maxWorkers=2`; the final run completed in 36.25 seconds.
- Eleven new checks cover purchased-tool ownership, real region and same-region prerequisites, preserved access, observation/lifetime scopes and export, capped supply effects and local-midnight rest, real potion actions, equipped abilities/MP/fallen actors, delivery consumption, hunt baselines, once-only commissions and calendar-linked conditions, companion eligibility versus membership, and absence of progression/campaign mutations. The registry check now validates learnable non-combat prerequisites for all fourteen utility disciplines.
- All **90 browser workflows pass** in a single final run (6.9m) with `npm run test:e2e -- --timeout=60000`. The per-test budget is 60 seconds with two workers. This covers the new tools and existing onboarding, exams, class history, objectives/calendar rewards, Journey, skill purchases, backup/recovery, saves, battles, exploration, town stocks, hybrid requests, reminders and local-midnight recovery.
- Seven new workflows cover Engineering’s destination/area navigation; Science’s text download and area filtering; Healthcare’s capped projections and party shortcut; Education’s next-stage information/loadout shortcut; Law’s consumption preview and board navigation; Community’s locks and membership; and reading new tools during an expedition without leaving it or changing reserves.
- **Eight final phone/desktop views** have no horizontal overflow, uncaught page errors or flagged axe-core WCAG A/AA issues. Visual review separated detail lines and corrected fallen-actor readiness text. [Capture fixtures and scans](service-1.19/README.md) · [Screenshots](screenshots/README.md). These are screened sample fixtures, not a full accessibility audit.
- Strict TypeScript/Vite and Android Gradle debug builds pass. Main startup JavaScript is approximately **944.7 KB**. All **38** production web files match the packaged `assets/public/` bytes; only the two generated Cordova stubs are additional. Current pixel artwork is packaged and the superseded atlas is absent.

## Android artifact

| Field | Verified value |
| --- | --- |
| App | The Adventurers Guild |
| Package | `com.theguild.personal` |
| Version / code | **1.19.0 / 21** |
| Minimum / target API | **24 / 36** |
| Size | **14,019,847 bytes** |
| APK SHA-256 | `08643e4da313cbf173212d4aaef4f041d8a8e103bf83c5c934f24367525a1dea` |
| Signing certificate SHA-256 | `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5` |
| Primary database | `the-guild.primary.v1` — unchanged |
| Character schema | Version 1 — no migration added |

Signature verification passes with the same certificate as 1.18. The copied download checksum matches. [Machine-readable results](apk-verification-1.19.json).

## Remaining limits

Fourteen of twenty career disciplines have field utilities. Creative, Sales, Administration, Hospitality, Manufacturing and General Practice remain on [the roadmap](../ROADMAP.md). All twenty retain existing requests, trees and work records. These tools use current loaded game records and do not establish professional qualifications or real-world improvement. Science exports retained journal observations and lifetime defeat counters with separate labels; it does not reconstruct older journal events. Report inspection never performs purchases, turn-ins, healing or recruitment.

Google setup remains deferred. No live Firebase configuration, deployed-rules validation or physical Android runtime testing is claimed. Installed upgrades, storage pressure, lifecycle/resume, reminders, keyboards and native sharing remain P05 checks. [Readiness record](readiness-1.17.md). The existing large startup bundle and full-history reporting costs remain broader performance work.

[Changes](update-1.19.md) · [Roadmap](../ROADMAP.md) · [Android installation](../downloads/README.md)
