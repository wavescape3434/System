# P05 readiness — version 1.17.0

Recorded 26 October 2026, America/Denver. This updates the [1.16 record](readiness-1.16.md).

| Area | Evidence now available | Remaining work |
| --- | --- | --- |
| Primary storage | Real Chromium IndexedDB, split histories, atomic transactions, changed-chunk writes, serialized durable receipts and rollback of dependent failed changes | Physical Android WebView storage quotas, interrupted native lifecycle and low-disk behavior |
| Legacy migration | Older localStorage source retained on failure; removed after commit; retries and retained progress tested | Install over a real 1.16 app and verify its existing character |
| Large histories | Six-megabyte character import, subsequent save, reload and full export; unchanged history chunks not rewritten by a core-only update | Long-history loading/validation/report CPU work still needs further profiling; full records still load into memory |
| Conflict handling | Stale browser window cannot overwrite a newer revision; reload is required | Multi-device merging remains outside the current manual-backup model |
| Replacement recovery | Existing daily/pre-replacement copies and fallback workflows pass against the new primary path | Native file picker/sharing and interrupted restore/reset on a physical device |
| Plans/results/reserves | Browser workflows retain multi-tree plans, measured results and midnight HP/MP behavior | Android suspension/resume, timezone changes, device clock and overnight reminders |
| Career work exports | Actual submission feeds work records, browser text export includes original outcomes, metadata retained | Native sharing of the career text file |
| Account protocol | Existing UID/session guard tests use SDK doubles | Google project/OAuth setup, deployed Firestore rules, live sign-in/account switching and native bridge |
| Google project | Owner explicitly deferred setup | Resume only when requested; no live project deployment is claimed |

No emulator binary/system image or `/dev/kvm` is available in this environment. The Android package can be built and inspected here, but physical-device checks remain open. The update does not mark P05 fully complete.

For the later device pass, export the existing character before installation, install 1.17 over 1.16, confirm retained history/plans/results/reserves, force-stop/reopen, exercise recovery and native file import/export, test numeric/text keyboards and hardware Back, then verify reminders and recovery across midnight. Record the actual Android/WebView versions and results.

[Roadmap](../ROADMAP.md) · [Changes](update-1.17.md) · [Verification](verification-1.17.md)
