# Version 1.15.0 verification

Verified **25 October 2026**, America/Denver.

## Automated checks

- **194 unit checks pass across 18 files.** The final isolated run completed in 23.8 seconds. The earlier concurrent Android/browser/unit run timed out in two existing balance tests; the unchanged tests pass when the CPU-heavy checks are separated.
- New domain coverage verifies carryover after retreat/re-entry/reload and claim/continue, retained real-world XP/base stats, local midnight during a battle, offline return, benched members, exhausted retries, older saves and resource validation. It also verifies optional submissions, equal measured/unmeasured rewards, invalid records, imperial conversion, calendar practice credit, no double payout, Journey records and result backup validation.
- All **59 browser workflows have passing results**. The final full run passed 58; one pin hit-area assertion read 43.99993896484375px for a 44px target. The assertion now rounds this subpixel measurement and passes on recheck. Earlier test routes were updated to use the new class shortcut and Submit wording.
- Four new browser workflows cover phone shortcuts/fixed parchment actions; optional walking records through actual submission, reload and Journey; blank/invalid results at 360×740; and HP/MP carryover through Continue followed by midnight recovery in America/Denver. Enemies remain unchanged across that recovery.
- **Seven final phone/desktop views** have no horizontal overflow, uncaught page errors or flagged axe-core WCAG A/AA issues. Coverage includes current work, fixed parchment actions, optional results, Journey charts, reserves and a fully defeated party. This is screening of those fixtures. [Scan results](daily-1.15/screens.json) · [Screenshots](screenshots/README.md).
- **32 deterministic combat fixtures** cover eight basic classes, Attack-only/tactical policies and one/seven-day budgets. All retain zero real-world XP. The fixed Bard fixture remains supply/build constrained at nine stages within seven days; support/economy tuning remains P02/P08. [Method and results](combat-1.15/README.md).
- Production TypeScript/Vite and Android Gradle debug builds pass. The main startup JavaScript is approximately **889.5 KB**. All **38** production web files match their packaged `assets/public/` bytes; the only extras are the two generated Cordova stubs. Current pixel art is included and the superseded atlas is absent.

## Android artifact

| Field | Verified value |
| --- | --- |
| App | The Adventurers Guild |
| Package | `com.theguild.personal` |
| Version / code | **1.15.0 / 17** |
| Minimum / target API | **24 / 36** |
| Size | **13,999,951 bytes** |
| APK SHA-256 | `856a0b43a88773febd170615d4fa9cf7e4ae14525a6a3162265e607783319fd3` |
| Signing certificate SHA-256 | `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5` |
| Character storage | `the-guild.character.v1` |

Signature verification passes, with the same certificate as the preceding release. [Machine-readable results](apk-verification-1.15.json). The copied download has a matching checksum.

The APK has been built and inspected here. Physical Android midnight/resume behavior, keyboard layout, reminder delivery, installed-app upgrades, Google sign-in and sharing still require device testing. Live Google/Firebase features also require the owner's project configuration and deployed rules. These limitations remain P05.

[Changes](update-1.15.md) · [Roadmap](../ROADMAP.md) · [Android installation](../downloads/README.md)
