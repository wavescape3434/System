# P05 readiness record — 26 October 2026 (America/Denver)

The current batch delivers recovery and account-operation protections. P05 remains a release gate.

| Area | Current evidence | Remaining check |
| --- | --- | --- |
| Character plans | Unit/file/cloud-envelope round trips; fresh browser session with no sessionStorage; real UI goal selection | Cross-device live cloud restore after Firebase setup |
| Device recovery | Real Chromium IndexedDB transactions, bounded retention, clone failure, invalid payload, >5 MB history and primary-corruption recovery | Android WebView storage/low-disk behavior |
| Replacement safety | Real UI restore and new-character flows, exact earlier record recovery, IndexedDB failure/local fallback, both stores failing without replacing current progress | Installed-app sharing/import and interrupted native lifecycle |
| Midnight | Local-midnight HP/MP browser coverage retained; deferred checkpoint stays on its captured day | Android suspension/resume across midnight and timezone changes |
| Account identity | UID/session guards and SDK-double protocol tests; failed commits retain the published copy | Live Google login, account switching and token/session behavior |
| Google project | No project configuration in checkout; owner explicitly deferred setup | Resume only when requested; use the public app configuration and OAuth setup steps in README |
| Firestore access | Owner-scoped rules remain in source | Deploy and verify authenticated/unauthenticated/cross-owner reads and writes against the owner's project or emulator |
| Primary save | Existing synchronous localStorage commit retained, with optional recovery failure isolated | Migrate primary saves beyond a whole-character synchronous record, preserve acknowledged progress through migration/failure, and revisit file-size limits |
| Android artifact | Signed version 1.16.0 / code 18, package identity and embedded web assets checked with the build | Install over 1.15, restart/force-stop, keyboard, hardware Back, reminders, sharing and recovery on a physical device |

The environment has no emulator binary/system image or `/dev/kvm`. It provides the SDK/build tools for compilation, but no physical Android validation is claimed. Native Google setup stays deferred; local request, planning, recovery and adventure features work without it.

For the later device pass: export the current character, install the update over the existing app, verify retained plans/results/reserves, force-stop/reopen, test an older-copy restore and recovery of the replaced record, exercise numeric/long-text keyboards, then verify reminders and overnight recovery. Record actual device/WebView versions and results before marking those checks complete.

[Roadmap](../ROADMAP.md) · [Changes](update-1.16.md) · [Verification](verification-1.16.md)
