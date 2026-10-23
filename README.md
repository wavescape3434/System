# The Guild

An Android app for real-world objectives, class and profession progression, branching skill trees, and turn-based party combat. Built with React, TypeScript, Vite, and Capacitor. Fonts and artwork are bundled for offline use.

## Try it

Download the prebuilt [Android APK](downloads/the-guild-debug.apk?raw=true), or open the [download instructions](downloads/README.md). Browse the [phone preview](docs/screenshots/guild-android.png), [desktop overview](docs/screenshots/guild-desktop.png), and [skill tree](docs/screenshots/skill-tree.png).

The APK requires Android 7.0 or newer. This is a development build, not a Play Store release. A device may ask you to allow installation from the app used to open the APK. Local builds produce `android/app/build/outputs/apk/debug/app-debug.apk`.

On first launch, choose **Register character** to create your character, or **Try a sample character** to try all features without entering personal information. Sample progress is explicitly labeled and can be replaced with your own application.

### Run the web interface

Requires Node 22+ and npm. Use the existing checkout; cloud tasks are already isolated and do not need a Git worktree.

```sh
npm ci
npm run dev
```

### Check the app

```sh
npm test          # progression, recurrence, persistence validation
npm run build    # strict TypeScript check and production build
npm run test:e2e # browser workflows at desktop and phone sizes
```

Browser tests use `/usr/bin/chromium` by default. Set `CHROMIUM_PATH` to your Chromium installation on another machine. Vite is started automatically for the tests. The app's Android plugins need device testing; browser tests do not establish native sign-in or sharing readiness.

## Version 1.1.0

Install the updated APK over the existing app to retain its character data. The package identifier and signing certificate are unchanged; the Android version code is increased to 2. Export a backup before upgrading. Existing baselines, objective history, class XP, credentials, earned skills, reflections, and keepsakes are retained. Derived attribute totals now follow the revised progression rules below.

### Professions and assessment

- 283 searchable roles in 23 US SOC major occupation groups plus a personal/undecided group. Includes common recruiting titles in analysis, business, technology, trades, healthcare, education, and other fields. This is a curated catalog organized by SOC, not an exhaustive or verbatim O*NET/BLS database.
- Assessment inputs can be cleared and left blank; there is no forced leading zero. Walking uses minutes, balance uses seconds, reading/study uses minutes per week, and other fields state their repetition, weight, or weekly units.
- Bodyweight and weighted strength options are supported. Pushup variation affects the game score. Weighted strength needs a body weight; an unknown value does not receive an assumed strength advantage.
- Baseline scores range from 3–30. Scoring thresholds are **guild game benchmarks**, not measured population averages, percentiles, or medical/intelligence/spiritual assessments.

### Progression rules

- **Base stats** increase only from class level-ups, profession level-ups, and explicitly listed weekly/monthly stat rewards. A class level gives +1 to its core attribute. A profession level gives +1 to its role-group focus attribute. Subclass selection, skill purchases, gear, ordinary daily attribute XP, and combat victories never directly change base stats.
- **Class and profession levels:** 100 progression XP per level. Class objectives progress the active class; profession and technical objectives progress the selected profession. Subclass objectives progress both the specialization and its parent class. Universal objectives progress the adventurer and universal skill wallet.
- **Skill currency:** each path earns one skill shard per 25 path XP and two additional shards per path level. Shards are tracked separately for universal, each class, each subclass, and each profession. Purchases debit their recorded wallet once. Changing focus does not refund or remove purchases.
- **Guild rank:** F through SSS. Each promotion costs twice the preceding promotion: 500, 1,000, 2,000, 4,000, and so on. Cumulative thresholds are 0 / 500 / 1,500 / 3,500 / 7,500 / 15,500 / 31,500 / 63,500 / 127,500 rank XP.
- **Starting placement:** ordinary or incomplete assessments start at F. E requires an average baseline score of at least 18, at least three attributes at 22+, and at least two physical attributes at 22+. D requires an average of at least 25 and five attributes at 25+. Starting placement is capped at D. Placement credit affects guild rank only; it does not grant adventurer levels, class/profession XP, or skill shards. Older characters keep their original F starting placement.
- Each objective rewards once per local calendar period: midnight, Monday, or the first of the month. Monthly checklists persist across closing the dialog and restarting the app.

### Classes, subclasses, and skill trees

12 classes and 23 subclasses have 348 skill nodes across universal, class, subclass, profession, networking, and data-analysis trees. Nodes have visible prerequisite connections, practice requirements, prices, and level gates. The tree supports scrolling, dragging, zooming, and node inspection. Class and subclass sections unlock at levels 1, 3, 5, 10, and 20 (Novice, Apprentice, Adept, Expert, Master).

| Class     | Combat role       | Examples                                      |
| --------- | ----------------- | --------------------------------------------- |
| Warrior   | Vanguard          | Shield Bash, Cleave, Riposte                  |
| Ranger    | Marksman          | Aimed Shot, Twin Arrows, Hail of Arrows       |
| Scholar   | Caster            | Arcane Bolt, Elemental Burst, Blazing Field   |
| Bard      | Support           | Battle Song, Inspiring Chorus, Guiding Chorus |
| Disciple  | Healer            | Restoration, Sanctuary, Group Restoration     |
| Sentinel  | Defender          | Brace, Hold the Line, Unbroken Bulwark        |
| Paladin   | Frontline support | Radiant Strike, Aegis, Merciful Blow          |
| Sage      | Tactician         | Focused Bolt, Insight, Shared Understanding   |
| Monk      | Skirmisher        | Flurry, Centering, Counter Stance             |
| Rogue     | Striker           | Backstab, Evasion, Finishing Strike           |
| Artificer | Combat engineer   | Spark Charge, Field Repair, Incendiary Array  |
| Marshal   | Commander         | Command, Coordinated Strike, Grand Strategy   |

Subclasses add daily, weekly, and monthly objectives plus their own branching tree. Selection itself grants no stat or combat bonus. Named techniques include Warpriest's Healing Prayer and Consecrated Guard, Eldritch Knight's Spellblade and Runic Guard, and Guardian's Interpose and Shield Wall. Paladin requires Warrior level 5 and Disciple level 3; Sage requires Scholar level 8 and Disciple level 3, in addition to their displayed attributes and XP.

CCNA/Network+/JNCIA-Junos and CCNP Enterprise/JNCIP-ENT remain self-reported credential milestones. Recording them earns the associated credential node, which does not itself provide a free combat modifier. Practice and combat skill purchases use their normal requirements and wallets.

### Objectives and JRPG adventures

- A character has 27 available objectives before specialization, with class-specific training, profession projects, networking labs, subnetting, SQL, spreadsheets, Bible study, service, and other activities. Subclasses add three more. Category filters help select a focus.
- The JRPG has five regions and 15 ordered encounters, including bosses. Battles use individual party turns, HP/MP, attacks, guard, equipped abilities, healing items, and enemy turns. Bosses use Heavy Strike every third round.
- Four companions are available; three can be recruited through region progression. The party holds your character plus two companions.
- Combat effects include armor piercing, multi-hit attacks, area damage, stun, taunt, counterattacks, party wards, healing, MP recovery, combined attacks, and damage over time.
- Eleven gear items, potions, ether, and a gold shop are included. Equip up to four purchased skills. Equipment, skill modifiers, and class stances affect combat only.
- Victories award combat gold and supplies and unlock further encounters and recruitment. They never award real-world XP or base attributes. Battle state, inventory, party, gear, and skill loadout persist across app restarts.
- Faith-related real-world content uses Christian Scripture, prayer, study, and service. The Monk class is physical bodyweight training, without another religion's practices.

Journal, completion history, private local saves, native backup sharing, validated import/restore, and Google/Firebase integration remain available.

## Google accounts and cloud backups

The APK works locally without any cloud setup. Google sign-in and cloud backup **have not been exercised against a live Firebase project** because no app-specific Firebase/OAuth configuration was provided. They remain disabled until configured. Cloud backups are deliberately manual: linking an account never silently overwrites a local or cloud character.

1. Create or choose your Firebase project. Add a web application and copy its public Firebase configuration.
2. Enable **Authentication → Sign-in method → Google**. Add your web hosting domain to Authentication's authorized domains. Use `localhost` for local web development if appropriate.
3. Create a Cloud Firestore database. Deploy the included rules, which restrict a character document to its authenticated owner:

   ```sh
   npx firebase-tools deploy --only firestore:rules --project YOUR_PROJECT_ID
   ```

4. Copy `.env.example` to `.env.local` and fill in the four public Firebase fields. Set `VITE_GOOGLE_WEB_CLIENT_ID` to the OAuth client of type **Web application** from the same project. Never put service-account credentials or private keys in this client app. Vite embeds these public settings at build time.
5. For Android, create an OAuth client of type **Android** with package **`com.theguild.personal`** and the SHA-1 fingerprint of the key signing your APK. Use `cd android && ./gradlew signingReport` to inspect fingerprints. A release signing key needs its own registered Android client. Do not use the Android client ID for `VITE_GOOGLE_WEB_CLIENT_ID`.
6. Run `npm run android:build` again and install the rebuilt APK on a device with Google Play services and a Google account. Native authentication uses the Google-only Capgo Social Login plugin and exchanges the Google ID token for a Firebase session. This approach does not require a service-account key or `google-services.json`.
7. Open **Guild settings → Continue with Google**. Upload a character, then test **Restore cloud copy**. Each Firebase UID has its own private character document at `characters/{uid}`. Restore requires confirmation before replacing local progress.

Deploy rules before relying on cloud storage. Firebase console setup, OAuth registration, Firestore deployment, and end-to-end Google login require access to your Firebase/Google project and are not performed by local builds.

## Build Android

Requires JDK 21 and Android SDK 36. The Gradle wrapper is included and its distribution checksum is pinned.

```sh
export JAVA_HOME=/path/to/jdk-21
export ANDROID_HOME=/path/to/android-sdk
export PATH="$JAVA_HOME/bin:$PATH"
npm run android:build
```

Set `sdk.dir` in the ignored `android/local.properties` if your SDK is not found. `npm run android:sync` rebuilds the web bundle and regenerates Capacitor's native plugin configuration. Native launcher/splash artwork and Android back navigation are included. The debug build is signed with a development key. Keep a stable signing key before registering OAuth fingerprints or distributing updates; release signing and Play Store publication are separate steps.

In this cloud workspace, `scripts/cloud-android.sh` activates the prepared JDK, SDK, caches, and the existing network proxy without exposing credentials. It preserves TLS verification using the machine's Java trust store. `scripts/cloud-install.sh` can reproduce these tools from official distributions and verifies their published checksums before extraction.

## Data and limitations

Progress is stored locally in the WebView/browser's private `localStorage`. Clearing app storage or uninstalling can erase it. Export a backup or upload a cloud copy before doing so. Backups contain personal reflections; keep them private. Cloud copies can be removed in your Firebase console. This first version does not offer multi-device merging or automatic background sync.

Objectives and credentials rely on honest self-reporting. The application is personal motivation software and does not validate exercise form, certification authenticity, or health outcomes. Fitness descriptions support gentle and equipment-free alternatives. There are no notifications, wearable integrations, automatic certification checks, purchases, or live multiplayer systems in this version.

The current project has progression, combat, and browser workflow tests plus a compiled Android APK. It has not been run on a physical Android device or emulator. Test Google authentication, native backup sharing/import, keyboard and system-bar behavior, and app upgrades on your device before relying on it daily.

## Code map

- `src/domain.ts`: progression rules, classes, objective templates, wallets, and calendar periods.
- `src/skill-catalog.ts`, `src/class-roles.ts`, `src/SkillTree.tsx`: skill definitions, class combat roles, effects, and branching trees.
- `src/professions.ts`, `src/ProfessionPicker.tsx`: SOC-organized role catalog and searchable selector.
- `src/rpg.ts`, `src/AdventureGame.tsx`, `src/BattleSprite.tsx`: persistent combat engine, world/party/shop interface, and sprite art.
- `src/storage.ts`: local persistence and backup validation.
- `src/Onboarding.tsx`: guild application and baseline assessment.
- `src/screens.tsx`: guild card, objectives, classes, skills, adventure, and journal.
- `src/App.tsx`: navigation, persistence, dialogs, backup flows, native sharing/back button.
- `src/auth.ts`: Google/Firebase authentication and owner-scoped cloud snapshots.
- `android/`: native Android shell and build configuration.
- `public/`: original guild artwork. Fonts are supplied by Fontsource and retain their packaged licenses.
