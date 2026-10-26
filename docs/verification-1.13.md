# Version 1.13.0 verification

Verified **25 October 2026**, America/Denver.

- **177 unit checks passed across 16 files**, with two workers. New checks lay out every current skill tree without losing or changing skill data, retain mandatory and alternative prerequisites when focusing a style, handle empty/cyclic graph input safely, and enforce learned/combat-only loadouts, four slots, active-fight restrictions and unchanged real stats.
- All **52 browser workflows have passing results**. The full run passed 51; the remaining gym workflow was updated to enter the new Strength board and passed on recheck. Four board/constellation/Help workflows were rechecked after the final refinements and passed. Three board/constellation workflows passed again after correcting learned-route colors; the added ownership assertion verifies that an unused alternate route stays unlearned. Coverage includes explicit universal-board selection, directly listed class work, combined Taken requests, remembered board state, alternate prerequisites, goal highlighting, skill-panel purchases and equipping, pinch zoom, the searchable list, credentials, progression, reports and combat.
- **Eight final phone/desktop fixtures** have no uncaught page errors, no horizontal overflow and no flagged issues in the axe-core WCAG A/AA scan. Fixtures include the stat-board hall, Wisdom requests, Fighter/Spearcraft maps and the selected-skill panel, universal skills and career skills. This screening is limited to those fixtures. [Evidence and method](atlas-1.13/README.md).
- Production TypeScript/Vite and Android Gradle debug builds passed. Main startup JavaScript is approximately **872.5 KB**. All **38** production web files match their packaged `assets/public/` bytes. The current pixel atlas and guild crest are present; the superseded atlas is absent.
- APK package **`com.theguild.personal`**, version **1.13.0**, code **15**, minimum API **24**, target API **36**, label **The Adventurers Guild**. Signature verification passed. Certificate SHA-256 remains **`f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5`**. Character storage remains **`the-guild.character.v1`**; existing skill IDs and purchase records are retained.

APK size: **13,994,863 bytes**. SHA-256: **`e39647d07a53358de6ef5596621be8f731d3da77b24b93be5fcea59fb6e6f0dc`**. [Machine-readable APK results](apk-verification-1.13.json). The matching checksum accompanies the download.

The APK was built and inspected here; it has not been exercised on a physical Android device or emulator. Native sign-in, notifications, system keyboards, sharing and installed-app upgrades require phone verification. Google/Firebase features still require the owner's project configuration and deployed rules. Skill goals are session view preferences and are not included in character backups; the Help page states that limit.

[Changes](update-1.13.md) · [Screenshots](screenshots/README.md) · [Android installation](../downloads/README.md)
