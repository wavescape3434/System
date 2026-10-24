# Version 1.4.0 verification

- Strict TypeScript and Vite production build passed.
- 81 unit checks passed, including retained-character regression coverage and new assessment/progression rules.
- All 21 browser workflows passed across the suite and the targeted rerun after correcting its completed-request navigation. The full run passed 20; its one outdated navigation check was updated and passed separately.
- Browser previews at 1440 × 1050 and 390 × 844 showed no page errors or horizontal page overflow, including large text in Settings.
- Android Gradle debug build passed. Package `com.theguild.personal`, version name `1.4.0`, version code `5`, minimum API `24`.
- All 24 production web files matched the bytes bundled under `assets/public/` in the APK.
- APK signature verified; certificate SHA-256 `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5`, unchanged from version 1.3.0.

The development APK is 6,441,020 bytes. Its download checksum is stored beside it. Installing over the previous APK preserves app data; export a backup first.

This environment did not run the APK on a physical Android device or emulator. Native sign-in, sharing, keyboard/system bars, and the installed-app upgrade still need device verification. Google sign-in remains dependent on the Firebase/OAuth configuration described in the main README.

Published and provisional assessment references are distinguished in the [metrics audit](../metrics-audit.md). Automated checks validate the implementation; they do not validate physiological outcomes or establish population norms for newly authored tests.
