# Version 1.12.0 verification

Verified **25 October 2026**, America/Denver.

- **173 unit checks passed across 15 files** using two workers. New checks cover ten stages in every place, unique encounter IDs, matching dungeon bounty quantities, stage/region/exploration gates, older-save preservation and validation, and topic-specific request instructions. Existing progression, calendar balance, combat, backup and assessment checks pass.
- All **49 browser workflows have passing results**. The initial full run passed 44; five workflows then passed in a single-worker recheck after correcting the new companion-unlock assertion. Four of those initial failures were timeouts. After the final route/request changes, another **eight focused browser workflows passed**, covering the paper popup, rank-specific instructions and acceptance, attribute icons and navigation emblem, stage persistence and tenth-stage exploration, recruitment availability, boss/ambush behavior, herb deliveries, hybrid objectives and phone world layout.
- **Nine phone/desktop fixtures** were captured after the final contrast corrections, with no uncaught page errors, no horizontal page/dialog overflow and no flagged WCAG A/AA issues in the axe-core scan. This is limited to those fixtures. [Screen evidence and method](presentation-1.12/README.md).
- Production TypeScript/Vite builds passed. Main startup JavaScript is approximately **861.4 KB**. The original new crest is bundled for offline use.
- Android Gradle debug build passed. APK package **`com.theguild.personal`**, version **1.12.0**, code **14**, minimum API **24**, target API **36**, application label **The Adventurers Guild**. All **38** production web files match their packaged `assets/public/` bytes; the new crest and current pixel atlas are present, and the superseded atlas is absent.
- APK signature verification passed. Certificate SHA-256 remains **`f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5`**. Character storage remains **`the-guild.character.v1`**. The engraved Guild Card component and rank-metal definitions are unchanged.

APK size: **13,984,871 bytes**. SHA-256: **`4ccd395521d92dd8c573ee39014fa460badc2d9c24abe520e6b0afd126d546e6`**. [Machine-readable APK results](apk-verification-1.12.json). The matching checksum accompanies the download.

The app has not been run on a physical Android device or emulator here. Native login, reminders, launcher/splash appearance, system keyboards, sharing and installed-app upgrades still require phone verification. Google/Firebase features require the owner's project configuration and deployed rules.

[Changes](update-1.12.md) · [Screenshots](screenshots/README.md) · [Android installation](../downloads/README.md)
