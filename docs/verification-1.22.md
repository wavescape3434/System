# Version 1.22.0 verification

Verified **27 October 2026**, America/Denver.

## Automated checks

- **268 unit checks pass across 27 files**, using `npm test -- --maxWorkers=2`; the final run completed in 29.06 seconds.
- Eleven new checks cover exact brewing exchanges and shortages, accessible-town/Royal requirements, percentage recovery at high reserves, full/fallen-target protection, field/battle use and real turns, increasing temper costs and combat effects, retained ranks and JSON backup validation, no healing from CON upgrades, transaction locks, corrupt upgrade rejection and delivery trade-offs. Existing saves without upgrades remain valid.
- All **108 browser workflows pass** in one full run (8.3m), using `npm run test:e2e -- --timeout=60000` with two workers. A final display-only clarification names the selected ally in the battle status; all five workshop workflows pass again after that change, followed by regenerated clean previews and a fresh Android build. Onboarding, requests/calendars, exams, classes, trees, backups, recovery, towns, exploration and midnight recovery remain covered.
- Five new browser workflows cover phone brewing and field recovery/reload, persistent temper ranks without healing, Royal locks and exact shortages, actual brewed battle use, and rollback of gold/materials/items/ranks after a forced primary-store failure. The targeted eleven-workflow run, including prior supply checks, also passes.
- **160 thirty-day simulations** pass daily save validation and gold reconciliation, covering 4,800 account-days with day-7 checkpoints. Baseline release `f1d3ad850c91896c829831c9f7b53e048296c44f` is archived into a temporary checkout and overlaid with the same simulation harness. Both phases use field supplies; only the updated phase adds workshop policies. Actual core/harness hashes match their source. [Report, figures and daily data](economy-1.22/README.md).
- **Eight phone/desktop scans** flag no horizontal overflow, uncaught page errors or axe-core WCAG A/AA violations. The new town controls, parchment Supplies dialog and battle commands were visually inspected. [Fixtures/scans](economy-1.22/screens/README.md) · [Gallery](screenshots/README.md). This is a screen-level check, not a complete accessibility audit.
- Strict TypeScript/Vite and Android Gradle debug builds pass. The main startup JavaScript is approximately **977.7 KB**. All **38** production web files match their packaged `assets/public/` bytes; only two generated Cordova stubs are additional. The current pixel roster is present and the superseded roster is absent.

## Android artifact

| Field | Verified value |
| --- | --- |
| App | The Adventurers Guild |
| Package | `com.theguild.personal` |
| Version / code | **1.22.0 / 24** |
| Minimum / target API | **24 / 36** |
| Size | **14,391,777 bytes** |
| APK SHA-256 | `a8ab90becc02e00de25f8557170038d7bc4390a3fe06449acece577cc63af58f` |
| Signing certificate SHA-256 | `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5` |
| Primary database | `the-guild.primary.v1` — unchanged |
| Character schema | Version 1 — optional validated gear-upgrade map |

The signature matches 1.21. The copied download checksum matches. Brewed items use the existing inventory map; missing gear upgrades default to zero. [Machine-readable verification](apk-verification-1.22.json).

## Remaining limits

Optional workshops create useful spending and material choices. In the moderate fixtures, wallets still grow and Royal supply use is zero; synthetic high-stat characters still win all allowed attempts. The comparison changes bot purchases, material priorities and battle behavior, so wallet differences are not all workshop spending. Weekly/monthly/career earnings, old-town revisits, optimal builds and longer retention are not modeled. See the [report](economy-1.22/README.md) and [roadmap](../ROADMAP.md).

Both gold sources, earned balances, existing general-store prices, real-world rewards, rank thresholds and automatic midnight recovery remain. Combat/items/equipment do not grant base stats or real-world XP. Enemy and companion scaling remain for the next challenge pass.

Google setup remains deferred. No live Firebase/rules validation or physical Android runtime verification is claimed. Installed upgrades, lifecycle/storage pressure, reminders, keyboards and native sharing remain P05 checks. [Readiness record](readiness-1.17.md). Startup-bundle size and whole-character reporting costs remain broader performance work.

[Changes](update-1.22.md) · [Economy report](economy-1.22/README.md) · [Install](../downloads/README.md)
