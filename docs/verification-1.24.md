# Version 1.24.0 verification

Verified **27 October 2026**, America/Denver.

## Automated checks

- **300 unit checks across 29 files pass** using `npm test -- --maxWorkers=2`. Eighteen new checks cover discipline timing, armor/intercept math, DEX counters, integral HP, focused scaling, elemental upgrades/matchups, two-round boss chill, storm arcs, prestige effects, backup validation and older battle snapshots. The early-choice content assertion now includes the three new first-point Mage routes.
- **All 120 browser workflows have passing results against the final app code.** The full two-worker run passed 119, with one outdated shell assertion failing (**7.3m**). That assertion counted the new elemental readout as a remaining shell. The test now selects shell messages and also verifies saved shell state; all **three combat workflows pass** in the final targeted run (**16.1s**). No app code changed after the full run. Commands: `npm run test:e2e -- --timeout=60000` and `npm run test:e2e -- e2e/combat-upgrades.spec.ts --timeout=60000`. The five new workflows cover phone loadout/element inspection, persisted chill, sword preparation/consumption, prestige party protection, legacy neutrality and Frostcraft prerequisites. Existing registration, exams, requests, calendar credit, careers, storage/recovery, towns, supply/workshop, hunts and exploration remain covered.
- **5,424 synthetic combat snapshots** compare 2,640 baseline builds and 2,784 updated builds, including all 51 classes. Actual intended signatures are asserted; final saves validate, combat preserves real-world stats/XP and victory payouts reconcile. No fixture remains at its 180-action bound. [Method, raw results, CSV and figure](builds-1.24/README.md).
- **32 ninety-day accounts / 2,880 account-days** include calendar/career rewards, actual purchasing/brewing/tempering and weekend Elite stress cases. Every daily gold balance reconciles and every daily character validates; no battle reaches its safety bound. No certifications, exam passes or promotions are fabricated. [Report, actual assumptions, checkpoints, sample saves and figure](economy-1.24/README.md).
- **Six phone/desktop views** have no horizontal overflow, uncaught page errors or axe-core WCAG A/AA findings. The loadout, target matchup, phone technique guide, selected-skill parchment, prestige panel and report figures were visually inspected. This is screen-level evidence, not a full accessibility audit. [Scans and fixtures](builds-1.24/screens/README.md).
- Strict TypeScript, Vite production and Android Gradle debug builds pass. Startup JavaScript: **994.3 KB**. All **38** production web files match packaged `assets/public/` bytes; only two generated Cordova stubs are additional. The current pixel roster is included; the superseded roster is absent.

## Android artifact

| Field | Verified value |
| --- | --- |
| Package | `com.theguild.personal` |
| Version / code | **1.24.0 / 26** |
| Minimum / target API | **24 / 36** |
| Size | **14,404,512 bytes** |
| APK SHA-256 | `ed63af4c70672280035a93931b070b6c0ea7c1e09d994b3260c81e923a9d9b78` |
| Signing certificate SHA-256 | `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5` |
| Primary database | `the-guild.primary.v1` — unchanged |
| Character schema | Version 1 — additive optional combat fields |

The copied download checksum, version badging and signing certificate are checked. Optional ability disciplines/elements/signature effects and unit preparation/chill/precision/affinities validate. Existing characters and active battles remain valid without these fields. New command metadata is copied only when a battle starts. [Machine-readable verification](apk-verification-1.24.json).

## Limits and remaining work

This delivers another P01/P02 batch and longer P08 evidence. It does not establish equal solo viability, optimal player tactics or a completed economy. Synthetic build snapshots inject ownership/access to isolate combat; the economy scenarios instead use actual earning/purchases but assume the described real-world work was done. The economy bot does not pass milestone exams, recruit a full party, buy all +5 upgrades or downgrade its failed Elite choices.

Gold surplus and Royal supply demand remain unresolved. Wider prestige/loadout balance, normal-region tactics, deeper careers, authored world content, performance and a real-user pilot remain on [the roadmap](../ROADMAP.md). Companion-led builds, earned ownership/spending, both gold sources, request/rank curves, manual choices and automatic local-midnight recovery are preserved.

Google setup remains deferred. No live Firebase/rules or physical Android runtime validation is claimed. Installed upgrades, lifecycle/storage pressure, reminders, keyboards, sharing and overnight behavior remain P05 checks. [Readiness record](readiness-1.17.md).

[Changes](update-1.24.md) · [Install](../downloads/README.md) · [Previews](screenshots/README.md)
