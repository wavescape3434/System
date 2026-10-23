# The Guild

A personal improvement RPG for Android, built with React, TypeScript, Vite, and Capacitor. Grow your body, mind, and heart through real-world action. The visual interface includes an illustrated guildhall, a personal guild card, attribute charts, and a networking skill tree. All fonts and artwork are bundled for offline use.

## Try it

Download the prebuilt [Android APK](downloads/the-guild-debug.apk?raw=true), or open the [download instructions](downloads/README.md). Browse the [phone preview](docs/screenshots/guild-android.png), [desktop overview](docs/screenshots/guild-desktop.png), and [skill tree](docs/screenshots/skill-tree.png).

The APK requires Android 7.0 or newer. This is a development build, not a Play Store release. A device may ask you to allow installation from the app used to open the APK. Local builds produce `android/app/build/outputs/apk/debug/app-debug.apk`.

On first launch, choose **Begin your story** to create your character, or **Explore a sample character first** to try all features without entering personal information. Sample progress is explicitly labeled and can be replaced with your own application.

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

## What is implemented

- **Guild application:** choose a name and profession, estimate a baseline with bodyweight or weighted exercise, and select an eligible starting class. There is always an open beginner path. Every new character starts at F adventurer rank.
- **Six attributes:** STR, DEX, CON, INT, WIS, CHA. Baselines cover strength, movement, balance, reading, reflection, and connection. These are personal game scores, not medical, intellectual, or spiritual assessments.
- **Eight classes:** Warrior, Ranger, Scholar, Bard, Disciple, Sentinel, Paladin, and Sage. Advanced classes have visible attribute and XP prerequisites. Class changes preserve all earned class XP, levels, skills, and total progress.
- **Subclasses:** including Eldritch Knight, Warpriest, Scripture Scribe, Trailwarden, Guardian, Herald, Apologist, and others. Reach class level 2 and the secondary attribute requirement to choose one. Faith objectives use Christianity, Scripture, prayer, and service.
- **Objectives:** daily tasks, weekly quests, and monthly adventures follow the active class, subclass, and profession. Networking practice and Christian reflection have dedicated objectives. Monthly adventures have a milestone checklist before claiming.
- **Progression:** each objective rewards once per local calendar period. Days reset at midnight, weeks on Monday, and months on the first. Existing rewards never expire. Every 100 attribute XP adds a point; every 100 class XP adds a class level; every 250 lifetime XP adds an adventurer level. Class ranks advance at levels 3, 5, 10, and 20. Adventurer ranks range from F through SSS with visible thresholds.
- **Professions and skills:** freely select a profession. Practice earns foundational skills. Recording a CCNA, Network+, or JNCIA-Junos earns **Architect of Connections**; CCNP Enterprise or JNCIP-ENT earns **Realm Network Architect**. Credentials are self-reported, not issuer-verified. Earned skills remain in the character record.
- **Story realm:** a complete three-encounter adventure uses current real-world attributes to resolve choices. Both high and low scores continue the story through different outcomes. It awards a permanent keepsake, not real-world XP.
- **Journal and backups:** write reflections, inspect the completion chronicle, export/import validated JSON backups, and recover malformed saved data without silently deleting it. Android export uses the native share sheet.
- **Google linking:** actual Firebase Authentication integration with web Google sign-in and Android Credential Manager, plus explicit upload/restore cloud backups. This requires the configuration below; it is not simulated.

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

The current project has meaningful domain and browser tests plus a compiled Android APK. It has not been run on a physical Android device or emulator. Test Google authentication, native backup sharing/import, keyboard and system-bar behavior, and app upgrades on your device before relying on it daily.

## Code map

- `src/domain.ts`: progression rules, classes, objective templates, skills, and calendar periods.
- `src/storage.ts`: local persistence and backup validation.
- `src/Onboarding.tsx`: guild application and baseline assessment.
- `src/screens.tsx`: guild card, objectives, classes, skills, adventure, and journal.
- `src/App.tsx`: navigation, persistence, dialogs, backup flows, native sharing/back button.
- `src/auth.ts`: Google/Firebase authentication and owner-scoped cloud snapshots.
- `android/`: native Android shell and build configuration.
- `public/`: original guild artwork. Fonts are supplied by Fontsource and retain their packaged licenses.
