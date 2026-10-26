# Version 1.16.0 verification

Verified **26 October 2026**, America/Denver.

## Automated checks

- **205 unit checks pass across 20 files** in 27.82 seconds. New coverage verifies independent tree goals, view preferences, backup round trips, one-time legacy migration, invalid plan rejection, retained learned goals, repaired optional snapshots and account-session guards.
- Cloud protocol tests exercise the actual auth module with Firebase/native SDK doubles: chunk commits before pointer publication, retained published copies after failure, legacy restore, corruption rejection, account/session changes and Firebase sign-out when native logout fails. These are protocol tests, not live Google/Firebase verification.
- All **65 browser workflows have passing results**. The full suite passed 64 in four minutes. Five planning/recovery workflows were rechecked after the final copy/date changes. The added sixth workflow verifies a queued daily copy across midnight; its initial test clock crossed midnight during navigation, so it now pauses explicitly before the boundary and passes on recheck. These results do not represent a single full 65-test run.
- New browser coverage selects combat, career and universal goals through the interface, opens a fresh browser session without sessionStorage, checks file export, submits measured work, restores an older record, recovers the exact replaced record after primary-save corruption, restores from registration, and exercises storage failures. IndexedDB checks include atomic abort, three-daily/two-replacement retention, invalid payloads, a history larger than 5 MB, local fallback and both stores failing without replacement. The large-history check establishes recovery storage capacity; it does not remove the primary localStorage or 5 MB file-import limits.
- **Seven final phone/desktop views** have no horizontal overflow, uncaught page errors or flagged axe-core WCAG A/AA issues. [Method and scan results](planning-1.16/README.md) · [Screenshots](screenshots/README.md). These are automated screens of sample fixtures, not a complete accessibility audit.
- Production TypeScript/Vite and Android Gradle debug builds pass. The main startup JavaScript is approximately **902.1 KB**. All **38** production web files match their packaged `assets/public/` bytes; the only extras are two generated Cordova stubs. The current pixel roster, guild crest and battle artwork are packaged; the superseded roster atlas is absent.

## Android artifact

| Field | Verified value |
| --- | --- |
| App | The Adventurers Guild |
| Package | `com.theguild.personal` |
| Version / code | **1.16.0 / 18** |
| Minimum / target API | **24 / 36** |
| Size | **14,004,591 bytes** |
| APK SHA-256 | `1a1d030c53d20e155e2202713b214e8d9670963045b3448cd6f72fa8eaa0f1a5` |
| Signing certificate SHA-256 | `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5` |
| Character storage | `the-guild.character.v1` |

Signature verification passes with the same certificate as the preceding release. The copied download's checksum matches. [Machine-readable results](apk-verification-1.16.json).

Google/Firebase setup is deferred at the owner's request. Primary-save migration, physical Android upgrades/restarts, WebView storage behavior, keyboards, reminders, native sharing and live Google/cloud behavior remain unverified. [P05 readiness record](readiness-1.16.md).

[Changes](update-1.16.md) · [Roadmap](../ROADMAP.md) · [Android installation](../downloads/README.md)
