# Version 1.23.0 verification

Verified **27 October 2026**, America/Denver.

## Automated checks

- **282 unit checks pass across 28 files**, using `npm test -- --maxWorkers=2`; the clean final core/companion run completed in 25.36 seconds. Fourteen new checks cover catalog/grade boundaries, access/snapshot locks, fixed enemy strength, backup validation, idempotent claims/replays, reserves/midnight, roaming-boss preservation, shell reform, targeting/taunt, guarded mana drain, enrage/cleave and companion commands. An earlier concurrent run hit the existing request-balance test’s five-second timeout; it passed without test edits when rerun apart from the browser/build load.
- All **115 browser workflows pass** in a full two-worker run (7.8m), using `npm run test:e2e -- --timeout=60000`. Existing onboarding, assessments, exams, classes, trees, requests/calendar credit, Journey, backups, recovery, professions, towns and exploration remain covered.
- The final **seven hunt workflows pass again** (33.2s) after correcting the Return to map action to select the map tab. Updated previews remain clean and the Android build is regenerated after that navigation change.
- The seven hunt workflows cover phone inspection/locks, saved fight/tactic state, exact replay rewards and reserves, retreat/boss-state preservation, map/board navigation, reward/start rollback and retry, and actual recruitment/use of Orin’s protection.
- **1,568 synthetic combat probes** validate their final saved characters, retain real-world progression, reconcile actual victory gold and all terminate before the 160-action safety bound. They cover eight Basic classes, eight regions, four grades, tactical/Attack-only play, supplies, focused/all-stat fixtures, learned loadouts and companion/player levels. Source hashes match the actual core/harness files. [Report, two standalone figures, CSV and raw data](hunts-1.23/README.md).
- **Eight phone/desktop screen scans** flag no horizontal overflow, uncaught page errors or axe-core WCAG A/AA violations. Board, enemy illustrations, mobile intentions and report figures were visually inspected. [Fixtures/scans](hunts-1.23/screens/README.md) · [Gallery](screenshots/README.md). This is a screen-level check, not a complete accessibility audit.
- Strict TypeScript/Vite and Android Gradle debug builds pass. The main startup JavaScript is approximately **985.2 KB**. All **38** production web files match their packaged `assets/public/` bytes; only two generated Cordova stubs are additional. The current pixel roster is present; the superseded roster is absent.

## Android artifact

| Field | Verified value |
| --- | --- |
| App | The Adventurers Guild |
| Package | `com.theguild.personal` |
| Version / code | **1.23.0 / 25** |
| Minimum / target API | **24 / 36** |
| Size | **14,397,259 bytes** |
| APK SHA-256 | `4c25e5fb79d22d3f136e0eaddc6bd3b7ba45337c8cd4579f908057ebb77a2980` |
| Signing certificate SHA-256 | `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5` |
| Primary database | `the-guild.primary.v1` — unchanged |
| Character schema | Version 1 — additive optional last-hunt and tactic fields |

The signature matches 1.22. The copied download checksum matches. New battle source/tactic IDs validate against the current catalog. Old saves remain valid without the new optional fields; old active fights retain their existing command lists. [Machine-readable verification](apk-verification-1.23.json).

## Remaining limits

This ships the next P02/P08 batch, not the whole roadmap. The combat fixtures are synthetic snapshots with explicit access, player-level credits, catalog skill ownership and carried stock. They do not simulate acquiring those builds, prove optimal play or establish daily elite-hunt budgets. Royal use in preloaded inventories does not prove sustainable purchase demand. Existing gold surplus and calendar/career-inclusive long-term spending remain open.

Companion-led builds remain valid by explicit owner direction. No companion stats/growth are reduced. Broader prestige, learned-loadout, weapon/element and normal-region tuning, authored stories, deeper career workflows and performance work remain on [the roadmap](../ROADMAP.md).

Both gold sources, earned balances, request/rank rewards, existing prices and automatic midnight recovery remain. Combat, hunts and new companion commands never grant real-world XP or base stats. Roaming-boss appearance/ambush state is preserved by a separate hunt.

Google setup remains deferred. No live Firebase/rules or physical Android runtime validation is claimed. Installed upgrades, lifecycle/storage pressure, reminders, keyboards, native sharing and overnight behavior remain P05 checks. [Readiness record](readiness-1.17.md).

[Changes](update-1.23.md) · [Combat report](hunts-1.23/README.md) · [Install](../downloads/README.md)
