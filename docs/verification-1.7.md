# Version 1.7.0 verification

Verified 24 October 2026.

- **139 unit checks passed** across ten files. New coverage exercises grouped rank rewards, current-week/current-month retrospective credit, period expiry, checklist reset, save migration, named-monster tracking, first-clear dungeon rewards, material consumption, shop restocking, smith requirements, repeat exploration, separate boss/ambush probabilities, opening ambush attacks, retreat persistence, and required/optional hybrid rewards. Prepared SSS outcomes can complete within February and remain one-time.
- **All 32 browser workflows passed.** New workflows cover choosing a rank from one card, persistent pins, accepting a weekly goal after already logging its practice, boss discovery and leaving, saved danger across reload, an actual ambush, gathering herbs and restoring a store, and unlocking a real-world hybrid objective after the adventure delivery. The phone workflow was additionally expanded and rerun to verify three party members fit on screen without overlapping the enemy row.
- The full four-account 7-/30-day simulation rerun uses **1 February–2 March 2027**, crosses the February boundary, and validates saved snapshots each day. Day-30 XP remains 3,200 / 17,550 / 45,260 / 2,225 for light/moderate/intensive/intermittent schedules. The moderate earning-rate projection remains Gold at 276 days. All 35 accepted day-one adventure attempts in the stress check were blocked from paying rewards. [Data](balance-1.7/simulation-results.json).
- The screenshot/content audit reports **259 variants / 145 groups** for the sample Warrior / Analyst / Networking profile, **eight regions, 24 places, 96 stages, six towns, 48 adventure commissions, 30 crafted items, and seven companions**. Desktop/phone preview scripts reported no page errors or horizontal page overflow. Scripted preview fixtures are labeled as samples.
- Strict TypeScript and Vite production build passed.
- Android Gradle debug build passed. Package **`com.theguild.personal`**, display name **The Adventurers Guild**, version **1.7.0**, version code **8**, minimum API **24**, target API **36**.
- All **29** production web files matched the bytes under `assets/public/` in the APK, including bundled font licenses.
- APK signature verified. Certificate SHA-256 remains `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5`.

The APK is **6,436,787 bytes**. SHA-256: `41915320584b3d90c3fba6ae734f732ab1b13e64524f4ad65483551cd7401467`. The checksum is stored beside the download. Package and signing key support updating an existing installation; export a backup first.

The APK was not run on a physical Android device or emulator here. Native sign-in, sharing, keyboard/system bars, and installed-app upgrades still require device verification. Google sign-in remains disabled until Firebase/OAuth configuration is supplied. No live Google accounts were created for the simulations.

The new stage catalog and probability rules are tested programmatically; all 96 battles have not been manually played through. Encounter difficulty, long-term shop sinks, and a longer authored narrative need further playtesting/design. Fitness references and mental-check limitations remain documented in the metrics audit. Automated software checks do not validate real-world outcomes.

[Update rules and content](update-1.7.md) · [Screenshots](screenshots/README.md)
