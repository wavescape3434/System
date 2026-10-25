# Version 1.10.0 verification

Verified 24 October 2026 (America/Denver).

- **160 unit checks passed across 13 files.** Portrait windows are checked for every appearance against the actual frame dimensions. Existing coverage also validates saved appearance IDs, class-independent selection, ongoing battle state, companion mappings, progression, assessments, examinations, reminders, objectives, and 7-/30-day balance regressions.
- **All 41 browser workflows passed.** Appearance coverage verifies full-body/portrait preview switching, all 24 portrait choices, selection persistence, close-up turn portraits, and full-body battlefield sprites. The three-member phone workflow now checks that complete humanoid sprite bounds stay inside the battlefield. Existing onboarding, classes, skills, objectives, Journey, reminders, exploration, shops, and hybrid quests also pass.
- Production TypeScript/Vite and Android Gradle debug builds passed. The preview script captured the complete sprite roster, portrait roster, seven companions, desktop battle, and three-member phone battle without page errors or horizontal page overflow. Measured phone sprite right edges remain inside the battlefield.
- APK package **`com.theguild.personal`**, version **1.10.0**, version code **12**, minimum API **24**, target API **36**. The update uses the existing signing certificate and storage key `the-guild.character.v1`.
- All **32** production web files match their packaged `assets/public/` bytes. The revised pixel atlas is present; the superseded atlas is absent from the APK.
- APK signature verification passed. Certificate SHA-256 remains `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5`.

The APK is **12,392,808 bytes**. SHA-256: `7651cf95657f040ca6773da37845f2c0c1400d56c1d3ff05fd99099bdf1774fa`. [Machine-readable APK results](apk-verification-1.10.json). The matching checksum accompanies the download.

The APK was built and inspected here; physical Android device and emulator testing were unavailable. Installed-app upgrades, low-end rendering performance, and native plugin behavior still need phone verification. The characters use standing battle poses with existing combat effects. Google login retains its existing Firebase/OAuth setup requirement.

[Refinements](update-1.10.md) · [Screenshots](screenshots/README.md) · [Android installation](../downloads/README.md)
