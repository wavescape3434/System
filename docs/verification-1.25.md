# Verification — 1.25.0

## Automated and visual checks

- **325 unit checks across 30 files pass** with one worker (53.9 seconds). `npm test -- --maxWorkers=1`. New checks cover exact recipes, actual-set validation, comparable progress, no automatic stats, acceptance snapshots, class/weekly credit, recovery overlaps, draft retention, imperial rounding, calendar start dates, checked topic results hybrid-class focus and exclusion of technique-only days from full-body goals.
- **All 128 browser workflows pass** against the final app code in the full two-worker run (**9.6 minutes**). `npm run test:e2e -- --timeout=60000`. The eight new workflows cover beginner setup/manual acceptance, unfinished reload, failed-save retry, edited-plan snapshots and independent walks, two-day class/weekly credit, imperial logs, zero-correct study results and Paladin focus gating. Existing registration, exams, calendar expiry, manual recurrence, class/career credit, storage/recovery, skill trees, combat, towns, supplies, workshops and exploration remain covered.
- **Eight phone/desktop views** have no horizontal overflow, uncaught page errors or axe-core WCAG A/AA findings. Home, technique, set-entry, weekly parchment, gym desktop and enlarged-text screens were visually inspected. These are screen-level checks, not a full accessibility audit. [Fixtures/scans](training-1.25/screens/README.md).
- **24 sixty-day ledger cases / 1,440 account-days** exercise real acceptance, completion, calendar credit, save validation and reward APIs with scripted exercise inputs. Final source hashes and checkpoints are in the [raw report](training-1.25/ledger-results.json). These verify software, not human training outcomes. [Efficacy review](training-1.25/README.md).

## Android artifact

Strict TypeScript, Vite production and Android Gradle debug builds pass. All **38 production web files** match the packaged `assets/public/` bytes; only two generated Cordova stubs are additional. The current pixel roster is included and the superseded raster roster is absent. Startup JavaScript is **1,037,836 bytes**. The copied download's checksum, package badging and signing certificate are verified.

| Field | Verified value |
| --- | --- |
| Package | `com.theguild.personal` |
| Version / code | **1.25.0 / 27** |
| Minimum / target API | **24 / 36** |
| Size | **14,056,447 bytes** |
| APK SHA-256 | `6a50be0f5811cf9942c8f3a79fbf73564e2b85498c34b6e655a5b0ddf667e57e` |
| Signing certificate SHA-256 | `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5` |
| Primary database | `the-guild.primary.v1` — unchanged |
| Character schema | Version 1 — optional training/result fields |

Existing saves remain valid without the new fields. Accepted training context/prescriptions and submitted logs validate; plan edits do not rewrite taken contracts. V1 recipe contracts must stay immutable; future recipe revisions need a new supported version so old results/backups remain readable. [Machine-readable verification](apk-verification-1.25.json).

## Remaining limits

The source review and regimen implement established training/learning principles; exact prescriptions and rank cutoffs are authored game choices. Public reference retrieval returned proxy 403, so no freshly verified 2026 guidance or clinical efficacy is claimed. Specialist B–SSS standards, substitutions, independently saved partial work and subject-equated knowledge exams remain open.

Google setup is deferred. This environment has no physical Android device or emulator/KVM; installed upgrade/storage pressure, reminders, keyboard, lifecycle, sharing and overnight behavior still require P05 device checks. Native compilation and packaged-byte/signature checks cannot establish installed runtime reliability. The game retains midnight HP/MP recovery, companion-led builds and its existing progression/economy curves.

[Changes](update-1.25.md) · [Install](../downloads/README.md) · [Screenshots](screenshots/README.md) · [Roadmap](../ROADMAP.md)
