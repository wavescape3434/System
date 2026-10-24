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

## Version 1.2.0

Install the updated APK over the existing app to retain its character. Package `com.theguild.personal` and the signing certificate are unchanged; version code is 3. Export a backup before upgrading. The APK is compiled and signature-verified; it has not been exercised on a physical Android device in this environment.

The Guild Card is an engraved brass membership card inspired by isekai guild registers. Objectives are posted as pinned parchment commissions on a timber guild board. [View the screenshots](docs/screenshots/README.md).

### Class register and prestige

There are **51 classes**: eight Basic, 21 Advanced, 14 Prestige, and eight Ascendant. Search by name or real-world goal, filter by archetype, tier, or availability, inspect a class, and compare up to three before choosing. The same register is used during onboarding; locked options remain visible.

Every dossier includes its fantasy role, real-world goal, archetype proportions, signature skill, and entry requirements. Eight basic classes are open to anyone. Other classes require attributes, purchased or credential skills, a profession category, prior class levels, or combinations of those requirements. Once a class is unlocked, it stays available.

Classes train eight shared archetype trees: **Fighter, Guardian, Ranger, Rogue, Mage, Cleric, Bard, and Artificer**. Each has 12 connected skills and branching choices. Every class also has four focused nodes. A Paladin is 70% Fighter and 30% Cleric; its class XP contributes to those archetype trees in those proportions. Shared skills already purchased remain learned when changing class.

Prestige and Ascendant classes require experience in earlier classes. Promotion retains total adventurer level and every earlier class record, while the newly selected class begins at level 1. Previously trained classes resume their own retained level when selected again. [Browse all classes and requirements](class-register.md).

Each active class grants one uniquely named **signature combat skill** without purchasing it or consuming a loadout slot. Advanced signatures have 5% increased potency, Prestige 20%, and Ascendant 40%; damage, healing, recovery, and protective effects use that potency. Other combat skills are learned through trees and equipped in **Adventures → Skill loadout**. Class stances, equipment, and equipped skill modifiers apply only in combat.

### Professions and vocation

The searchable catalog retains 283 common job titles, originally organized using US SOC major groups. Roles now map to **20 shared career trees**, each with ten named competencies, individual learning descriptions, branching prerequisites, practice gates, level requirements, and point prices. This is a curated role catalog, not an exhaustive or verbatim O*NET/BLS dataset.

A **profession** is the selected job role; a **vocation** is an independent career focus. For example, **Warrior / Analyst → Networking** combines strength objectives with job applications and CCNA/networking practice. Changing combat class does not change profession or vocation. Select a vocation in **Class Paths → Vocation**. Its daily, weekly, and monthly requests train the relevant career discipline, even when the selected profession belongs to another discipline.

Career points are shared across roles in the same discipline. Exact job-role XP and level history remain separate. Networking and data-analysis focus branches supplement the shared trees. CCNA/Network+/JNCIA-Junos and CCNP Enterprise/JNCIP-ENT award self-reported credential milestones; ordinary study does not substitute for those credentials.

Career competencies are explicitly **non-combat** and cannot supply battle attributes or commands. Exploration and other utility uses are reserved for a later design pass. Earlier combat subclasses, objectives, and purchases remain archived in existing characters; current combat specialization advances through class and prestige paths.

### Uncapped levels and attributes

- Adventurer, class, profession, and archetype levels have no configured ceiling. Each successive level requires more XP. Cumulative XP for level `L` is `round(B × ((L−1) + 0.15 × (L−1)²))`, where `B=250` for adventurer levels and `B=100` for other paths.
- Base attributes increase **every five class or profession levels**, rather than at every level. Hybrid class milestones follow the archetype balance; ten Paladin milestones distribute seven points to STR and three to WIS. Profession milestones use the career discipline’s focus attribute.
- Explicitly listed weekly/monthly rewards may also grant a base attribute. Ordinary daily completion, purchases, vocation selection, equipment, and combat victories do not directly grant base attributes.
- Every 100 objective XP earns one skill point for its path. Combat points pool all class objective XP; career points pool the relevant discipline; universal points use universal objectives. Most new skills cost 4–30 points and require level, practice, and earlier nodes. A purchase is charged once and remains learned.
- **Guild rank** remains F–SSS with doubling promotion costs: cumulative thresholds 0 / 500 / 1,500 / 3,500 / 7,500 / 15,500 / 31,500 / 63,500 / 127,500. Guild rank and adventurer level are separate measures.
- Ordinary assessments begin at F. Exceptional starting placement is capped at D. E requires mean baseline 18+, three attributes 22+, and two physical attributes 22+; D requires mean 25+ and five attributes 25+. These are guild game benchmarks, not measured population percentiles.

Older saves receive one-time progression credits that retain their earned levels, base attributes, point balances, purchases, and raw objective XP after the curve changes. Credits do not increase guild rank or claim additional real-world objective rewards. Earlier purchased skills remain visible in the skill archive and combat skills remain equippable.

### Requests, assessment, and adventures

- Request content follows the current class and its secondary archetype, profession, and vocation. Category filters select a focus. Daily rewards refresh at local midnight, weekly on Monday, and monthly on the first; each request rewards once per period. Monthly checklists persist.
- Assessment inputs remain clearable, with no forced leading zero. Walking is in minutes, balance in seconds, and study in minutes per week. Bodyweight training needs no equipment; weighted strength requires body weight for scoring. Baselines range from 3–30.
- JRPG expeditions have five regions, 15 ordered encounters, bosses, and individual party turns. Your character can bring two of four recruitable companions. Commands include attacks, guard, class signatures, equipped skills, potions, and ether.
- Combat includes armor piercing, multi-hit and area attacks, stun, taunt, counters, party barriers, healing, MP recovery, coordinated attacks, and burning. Victories grant combat gold and supplies, encounter access, and recruitment; they never grant real-world XP or base attributes.
- Eleven gear items, a supply shop, saved battle state, character backup sharing, validated restore, journal, and completion history remain available.
- Faith-related real-world content uses Christian Scripture, prayer, comprehension, and service. Monk training is physical bodyweight practice.

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
