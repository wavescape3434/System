# Version 1.14.0 verification

Verified **25 October 2026**, America/Denver.

- **185 unit checks passed across 17 files**, using two workers. New coverage verifies stronger and more efficient ranked techniques, a single upgraded loadout slot with retained ownership/spending, unchanged real stats/XP, utility and counter scaling, active-battle snapshot compatibility, CHA-based party buffs, shell breaks, cleave telegraphs/guarding and validation of saved enemy tactics.
- All **55 browser workflows have passing results**. The full run passed 54 and encountered one click timeout in stage continuation; that workflow passed unchanged on recheck. The three new upgrade/shell/cleave workflows passed again after the final combat and phone refinements. Four earlier board/constellation/pinch workflows also passed on the final code.
- The phone upgrade workflow buys Spark: Refinement through the actual skill panel, retains one equipped technique slot and old purchase records, opens navigation while the panel is present, uses the upgraded command after reload and confirms unchanged base INT and real-world XP. It also checks that the selected star stays above the lower panel.
- **Sixteen deterministic combat fixtures** cover eight basic classes with Attack-only and tactical policies. All tactical fixtures clear Briar Road's ten stages with starting equipment/Mira/supplies and no learned player skills. Attack-only clears nine and loses at the guardian. All fixtures retain zero real-world XP. These are available approaches under fixture conditions, not an all-build or human-difficulty guarantee. [Results, method and limits](combat-1.14/README.md).
- **Seven final desktop/phone views** have no uncaught page errors, no horizontal overflow and no flagged issues in the axe-core WCAG A/AA scan. This screening is limited to those fixtures. [Screen evidence](combat-1.14/screens.json).
- Production TypeScript/Vite and Android Gradle debug builds passed. Main startup JavaScript is approximately **878.9 KB**. All **38** production web files match their packaged `assets/public/` bytes. The only additional web-directory files are the two generated Cordova stubs. Current pixel art is present; the superseded atlas is absent.
- APK package **`com.theguild.personal`**, version **1.14.0**, code **16**, minimum API **24**, target API **36**, label **The Adventurers Guild**. Signature verification passed. Certificate SHA-256 remains **`f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5`**; storage remains **`the-guild.character.v1`**.

APK size: **14,320,531 bytes**. SHA-256: **`5af844973952df215baa7e1a99b4f39e16bb3cbf498c20dc5f6291b731de48bc`**. [Machine-readable APK results](apk-verification-1.14.json). A matching checksum accompanies the download.

The APK has been built and inspected here, not exercised on a physical Android device or emulator. Native sign-in, reminder delivery, keyboards, sharing and installed-app upgrades still require device verification. Google/Firebase features need the owner's project configuration and deployed rules. Later regions, high-stat challenges, the full economy and wider skill/build diversity remain on the roadmap; this release does not claim to complete those systems.

[Roadmap](../ROADMAP.md) · [Changes](update-1.14.md) · [Screenshots](screenshots/README.md) · [Android installation](../downloads/README.md)
