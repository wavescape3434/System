# Version 1.11.0 verification

Verified **25 October 2026**, America/Denver.

- **169 unit checks passed across 14 files.** New coverage verifies indexed XP/credit totals, earned mastery eligibility and later-day passing, protocol-separated raw trends, Unicode cloud snapshots larger than a Firestore document, missing/corrupt chunk rejection, recovery writes under quota failure, and fixed late-deadline reminders. Existing migration, combat, class, skill, objective and calendar-balance checks pass.
- **47 browser workflows passed.** New workflows cover real keyboard typing and focus trapping, weekly-only Taken navigation, the phone filter/pin layout, retained request search, interrupted registration, earned mastery selection/submission, raw-performance reports and restoration after damaged local storage.
- After the final visual refinements, **seven focused UI regressions passed**. A further **four class/skill view regressions passed** after separating remembered tree state by active class. Pinch zoom, Fit, credential-based skills, class switching and card navigation remain covered.
- Seven updated 390×844 phone fixtures were captured with **no uncaught page errors, no horizontal page overflow and no flagged WCAG A/AA issues in the axe-core scan**. This screening is limited to those fixtures and does not certify all screens or native accessibility. The board shows four complete requests in the first viewport. [Screen evidence](usability-1.11/screens.json).
- The new history benchmark retains valid synthetic characters at 180 / 2,190 / 6,570 completions. Three-year stat derivation decreased from 13.5 to 0.8 ms and objective generation from 19.2 to 2.5 ms in the warmed desktop benchmark. Cosmetic Journey updates skip progression comparisons. [Methods and limits](usability-1.11/README.md).
- Production TypeScript/Vite and Android Gradle debug builds passed. Main startup JavaScript is approximately 845.3 KB, down from 969.4 KB; deferred SDK chunks remain bundled in the APK.
- APK: package **`com.theguild.personal`**, version **1.11.0**, version code **13**, minimum API **24**, target API **36**. All **37** production web files match their packaged `assets/public/` bytes. The current pixel atlas is present and the superseded atlas is absent.
- APK signature verification passed. Certificate SHA-256 remains **`f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5`**. Existing character storage remains **`the-guild.character.v1`**. The engraved Guild Card component and rank-metal definitions are unchanged.

APK size: **12,441,266 bytes**. SHA-256: **`35cc33f82b383d1a85cb5a0d4b46739096e25f1a95ae20bd95129882dcdd4d58`**. [Machine-readable APK results](apk-verification-1.11.json). The matching checksum accompanies the download.

The APK was built and inspected here; it was not run on a physical Android device or emulator. Native sign-in, notifications under device battery policies, system keyboards, backup sharing and installed-app upgrades still need phone verification. Google/Firebase features require the owner's configuration and deployment of the updated `firestore.rules`. Segmented backup encoding/integrity is tested locally; deployed rules and live cloud access have not been exercised.

[Changes](update-1.11.md) · [Screenshots](screenshots/README.md) · [Android installation](../downloads/README.md)
