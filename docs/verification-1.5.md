# Version 1.5.0 verification

Verified 24 October 2026.

- Strict TypeScript and Vite production build passed.
- 98 unit checks passed. The added coverage checks rotating forms, retained legacy quiz scores, unit display without score changes, five-level exam gates, alternates, later-day comparisons, stat rewards, migration, career examinations, class requirements, request gold, spending settlement, solo tasks, mixed training credit, skill-web routes, and notification persistence.
- All 26 browser workflows passed: 21 existing regression workflows and five new update workflows. New checks cover sequential imperial registration, questions hidden before Start, remembered form rotation, an actual passed class milestone, fixed phone header, reward notifications, gym access, rank metal, weapon branches, and the Adventure Guild requests placeholder.
- Refreshed desktop and phone browser previews reported no page errors or horizontal page overflow. The rank-metal and full Fighter-web previews use labeled sample fixtures.
- Android Gradle debug build passed. Display name **The Adventurers Guild**, package `com.theguild.personal`, version name `1.5.0`, version code `6`, minimum API `24`, target API `36`.
- All 24 production web files matched the bytes bundled under `assets/public/` in the APK after the final build.
- APK signature verified. Certificate SHA-256 `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5` is unchanged from the previous release.

The development APK is **6,210,487 bytes**. SHA-256: `1a83d09307bf7496cb41195d4532cb2faa6f6e9f64637dbab46ecf88960e8545`. Its checksum is also stored beside the download. The package and key support updating the existing installation; export a backup before installing.

This environment did not run the APK on a physical Android device or emulator. Native sign-in, sharing, keyboard/system bars, and the installed-app upgrade still need device verification. Google sign-in remains disabled until the Firebase/OAuth configuration described in the main README is supplied.

Automated checks validate implementation behavior, not exercise outcomes, population averages, psychometric validity, or equivalence between mental forms. The [assessment audit](../metrics-audit.md) distinguishes verified references from provisional anchors, and the [update notes](update-1.5.md) document exam thresholds and their limits.
