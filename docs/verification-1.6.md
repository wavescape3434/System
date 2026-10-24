# Version 1.6.0 verification

Verified 24 October 2026.

- Strict TypeScript and Vite production build passed.
- **110 unit checks passed.** Added coverage checks cadence rank ceilings and prices, F weekly/monthly goals, month-boundary persistence, distinct relevant practice dates, fresh repeat preparation, duplicate habit prevention, old-rank migration, old-checklist migration, and day-one reward attempts. S and SSS completion checks verify that large XP/gold rewards survive backup validation and that legendary commitments stay one-time.
- **All 26 browser workflows passed across the suite and targeted reruns.** The full run passed 24; the two updated workflows then passed after correcting their test selectors and dated-practice fixture times. They verify the F–C / F–A / F–SSS menus, an adventure held until 28 days and 12 practice dates, saved checklists after crossing January into February, the awarded 6,300 XP / 1,260 gold, and a manually accepted repeat starting at zero progress.
- Four fresh synthetic accounts each ran for 30 days with day-7 and day-30 snapshots, request acceptance/completion through the real domain rules, and backup parsing/validation on every day. All four account snapshots validate. The moderate earning rate projects Gold at 276 days. The additional early-claim stress test awarded zero XP and gold.
- Desktop and phone preview scripts reported no page errors or horizontal overflow. Monthly adventure and saved-progress screenshots use a labeled sample fixture derived from the moderate simulation.
- Android Gradle debug build passed: display name **The Adventurers Guild**, package `com.theguild.personal`, version **1.6.0**, version code **7**, minimum API **24**, target API **36**.
- All **24** production web files matched the APK's `assets/public/` bytes.
- APK signature verified. The certificate SHA-256 remains `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5`.

The APK is **6,219,488 bytes**, with SHA-256 `d34e69faec1f291db3feb950254df0a9b38967cc312ac72e33480a095e24e781`. The checksum is stored beside the downloadable APK. Package and signing key are unchanged; export a backup before updating an existing installation.

The [balance report](balance-report-1.6.md) includes account schedules, reward and rank tables, charts, action logs, daily CSV, snapshots, assumptions, and reproduction commands. The nine-month projection is an estimate from the moderate routine's first 30 days. The simulations do not validate exercise outcomes or self-reported assessment evidence.

This environment did not run the APK on a physical Android device or emulator. Google sign-in remains dependent on Firebase/OAuth configuration; no live Google accounts were created for the simulations. Native sign-in, sharing, installed-app upgrades, keyboard, and system bars require device verification.
