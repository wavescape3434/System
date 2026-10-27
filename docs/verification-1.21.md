# Version 1.21.0 verification

Verified **27 October 2026**, America/Denver.

## Automated checks

- **257 unit checks pass across 26 files**, using `npm test -- --maxWorkers=2`; the clean run completed in 24.04 seconds.
- Twelve new checks cover batch quotes, atomic spending/stock, invalid and partial purchases, capped manual recovery, persistent reserves and midnight recovery, full/fallen/absent targets, battle/field transaction boundaries, no-effect battle items/turn preservation, delivery material previews, CHA recipes and actual support effects, and short deterministic gold-conservation simulations. Base stats and real-world XP stay separate from supply/equipment actions.
- All **103 browser workflows pass** in one final run (8.2m) with `npm run test:e2e -- --timeout=60000`, using two workers and a 60-second per-test budget. Existing onboarding, exams, class history, requests/calendars, skills, backups/recovery, field tools, battles, towns, exploration and midnight recovery remain covered.
- Six new workflows cover the phone satchel and expedition/reload persistence, clearable quantity inputs and exact batch spending, delivery recipe trade-offs and real turn-in, seal forging/equipping, disabled full-target battle items, and rollback of both recovery and stock after a forced save failure.
- **160 thirty-day simulations** pass daily save validation and gold reconciliation, covering 4,800 account-days and day-7 checkpoints. The baseline is reproduced from release commit `76d9167dc198df8758f038b474cd64a4c3524007` in a temporary checkout; the candidate uses the current implementation. [Report, two figures and raw data](economy-1.21/README.md). These are controlled bot fixtures with stated omissions and policies, not measured users or proof of final balance.
- **Eight final phone/desktop screen scans** flag no horizontal overflow, uncaught page errors or axe-core WCAG A/AA issues. Visual review corrected light text inherited by the parchment supply dialog. [Capture fixtures and scans](economy-1.21/screens/README.md) · [Gallery](screenshots/README.md). This is a screen-level check, not a complete accessibility audit.
- Strict TypeScript/Vite and Android Gradle debug builds pass. The main startup JavaScript is approximately **968.8 KB**. All **38** production web files match their packaged `assets/public/` bytes; only the two generated Cordova stubs are additional. Current pixel artwork is present and the superseded atlas is absent.

## Android artifact

| Field | Verified value |
| --- | --- |
| App | The Adventurers Guild |
| Package | `com.theguild.personal` |
| Version / code | **1.21.0 / 23** |
| Minimum / target API | **24 / 36** |
| Size | **14,028,447 bytes** |
| APK SHA-256 | `eb54a910419b4c368eb6812c10617f15d2a09f6c4712e057b6dc2191532d0c14` |
| Signing certificate SHA-256 | `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5` |
| Primary database | `the-guild.primary.v1` — unchanged |
| Character schema | Version 1 — no migration added |

The signature matches 1.20. The copied download checksum matches. [Machine-readable verification](apk-verification-1.21.json).

## Remaining limits

P08 is a supply/use and evidence pass. Reward rates, prices, rank thresholds and automatic midnight recovery are unchanged. Gold surplus, finite campaign breadth, companion carry, higher-stat challenge, graded supplies and meaningful sinks remain on [the roadmap](../ROADMAP.md). The owner chose to keep both gold sources and tune spending/material demand. Three/five attempts are simulation budgets; there is no new daily encounter cap. The comparison changes manual supply policy and available gear, so it is not a price-only experiment.

The new seal recipes are backward-compatible additions to inventory/equipment catalogs. There is no base-stat or real-world XP grant from item use, shopping, forging or battles. Existing recovery/session safeguards still apply to their saved changes.

Google setup remains deferred. Live Firebase/rules validation and physical Android runtime testing are not claimed. Installed upgrades, lifecycle/storage pressure, reminders, keyboards and native sharing remain P05 checks. [Readiness record](readiness-1.17.md). The large startup bundle and history-reporting costs remain broader performance work.

[Changes](update-1.21.md) · [Economy report](economy-1.21/README.md) · [Install](../downloads/README.md)
