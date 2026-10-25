# Version 1.9.0 verification

Verified 24 October 2026 (America/Denver).

- **159 unit checks passed across 13 files.** New coverage checks all 24 appearance IDs and render frames, old-save defaults, class-independent selection, unchanged progression and combat statistics, preservation of damaged HP/MP and turn state during a cosmetic change, companion identities, monster rendering, and rejection of unknown saved appearance IDs. Existing assessment, examination, objective, rank, reward, reminder, and 7-/30-day balance regressions pass.
- **All 41 browser workflows passed.** New workflows cover preview without applying, filters, selected-style persistence into battle and turn portraits, registration with a chosen look, and the phone party chooser. Existing requests, classes, skills, assessments, Journey, reminders, exploration, and three-member phone battle layouts also pass. Tests were rerun sequentially after contention during overlapping builds caused timeouts.
- Production TypeScript/Vite and Android Gradle debug builds passed. Roster and battle preview capture completed without page errors or horizontal page overflow.
- APK package **`com.theguild.personal`**, version **1.9.0**, version code **11**, minimum Android API **24**, target API **36**. All **32** production web files match their packaged `assets/public/` bytes, including the transparent character atlas.
- APK signature verification passed. Certificate SHA-256 remains `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5`. Existing package identity and storage key `the-guild.character.v1` are retained for updates.

The APK is **12,302,362 bytes**. SHA-256: `173cd8b3d2b5916aa367f152a325a4c7ccc001b166b7093bb408ebef12cf0944`. [Machine-readable results](apk-verification-1.9.json). The matching checksum is beside the download.

The APK was compiled and inspected here; it has not been run on a physical Android device or emulator. Installed-app upgrade behavior, lower-end device rendering, and native plugin behavior still need phone testing. Google login retains the existing Firebase/OAuth configuration requirement. The roster currently contains standing battle poses with existing battle effects, not separate walking or attack animation frames.

[Appearance rules](update-1.9.md) · [Roster and battle screenshots](screenshots/README.md) · [Android download](../downloads/README.md)
