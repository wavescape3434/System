# The Adventurers Guild

An Android app for real-world objectives, class and profession progression, branching skill trees, and turn-based party combat. Built with React, TypeScript, Vite, and Capacitor. Fonts and artwork are bundled for offline use.

## Try it

Download the prebuilt [Android APK](downloads/the-guild-debug.apk?raw=true), or open the [download instructions](downloads/README.md). Browse the [phone hub](docs/screenshots/guild-actions-mobile.png), [battle preview](docs/screenshots/battle-polished.png), and [screenshot gallery](docs/screenshots/README.md).

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

## Version 1.12.0

Requests open as detailed parchment commissions, and compact board icons identify their training attribute. Every adventure area now has ten stages, displayed through one current-stage panel. The new guild emblem combines a sword, staff and shield. Existing area unlocks and exploration remain available when upgrading. [Changes](docs/update-1.12.md) · [Verification](docs/verification-1.12.md) · [Previews](docs/screenshots/README.md).

Install over the existing app to retain its character: version code **14**, package `com.theguild.personal`, and the same signing certificate.

## Version 1.11.0

This update fixes exam typing/focus and cross-cadence Taken navigation, brings Guild actions forward, streamlines phone filters, opens readable skill trees, adds earned mastery exams and raw-performance reports, and indexes long histories. Local recovery snapshots and segmented cloud backups improve data recovery. [Changes](docs/update-1.11.md) · [Verification](docs/verification-1.11.md) · [New previews](docs/screenshots/README.md).

Install over the existing app to retain its character: version code **13**, package `com.theguild.personal`, and the same signing certificate. Google login still needs Firebase/OAuth configuration; deploy the updated `firestore.rules` before using the new cloud snapshot format. Live sign-in, deployed cloud rules, and native reminders require project/device verification.

## Version 1.10.0

[Full UI, UX, performance, and product review — 24 October 2026](docs/reviews/2026-10-24/README.md), including reproduced issues, screen notes, screenshots, and long-history measurements.

Install the updated APK over the existing app to retain its character. Package `com.theguild.personal` and the signing certificate are unchanged; version code is 12. Export a backup before upgrading. The APK is compiled and signature-verified; it has not been exercised on a physical Android device in this environment. [Verification details](docs/verification-1.10.md).

Guild Cards follow the member's rank metal: **Tin, Copper, Bronze, Iron, Silver, Gold, Platinum, Mythril, Orichalcum** for F through SSS. Objectives are pinned parchment commissions on a timber board. The fixed header includes an in-app notification inbox. [View the screenshots](docs/screenshots/README.md).

All 24 looks now have a stronger pixel-art treatment, close-up turn-order portraits, and full-sprite/portrait preview modes. The three-member phone formation keeps the complete sprites inside the scene. [Version 1.10 refinements](docs/update-1.10.md).

**24 original character appearances** are available in registration, Settings → Appearance, and Adventures → Party. They use slimmer silhouettes, detailed costumes, varied complexions and hairstyles, and a range of knight, dancer, scholar, rogue, minstrel, and traveler designs. A chosen look remains independent of class. [Roster and battle previews](docs/screenshots/README.md) · [Version 1.9 changes](docs/update-1.9.md).

The Guild hub shows taken requests, login rewards, and card links to the relevant sections. Objectives use compact expandable cards. Battles have direct stage/exploration continuation, a new forest backdrop, a turn queue, party HUD, and attack feedback. Trees support pinch zoom, Fit, a searchable list, and more early choices. Android submission/deadline reminders are configurable in Settings, defaulting to 9pm local time. [Version 1.8 changes and reward values](docs/update-1.8.md).

### Request balance and simulation report

Related objective ranks now share one request card. Choose a rank before accepting, search by topic, filter by stat/category, and pin useful requests. The sample Warrior / Analyst / Networking catalog contains **259 rank variants in 145 groups**, including class trials. Actual options follow the selected class, profession, vocation, and eligibility.

Weekly goals use Monday–Sunday and monthly goals use the calendar month. They include relevant work already logged earlier in that period. Acceptance and checklist progress expire at the boundary; earned activity and history remain. Daily tasks retain F–C limits, weekly quests F–A, and monthly adventures F–SSS. Expert achievements check prior preparation before rewarding a current-month outcome.

Adventures now has **eight regions, 24 places, 240 stage battles, six towns, 60 guild commissions, seven companions, and 30 town-crafted items**. Clear a place's ten stages for repeatable exploration, gathering, caches, and roaming bosses. Boss appearances and ambush danger have separate rising probability curves. Town stocks respond to guild deliveries; smiths differ in power, materials, and prices. Original pixel scenes and sprites use command windows and a separate party HUD.

Hybrid requests either require a named adventure commission or pay an optional bonus when it is completed. Ordinary requests remain available. [Content, calendar, exploration, and shop rules](docs/update-1.7.md) · [New screenshots](docs/screenshots/README.md).

The four-account 7-/30-day balance check was rerun under calendar rules. Results remain **3,200 / 17,550 / 45,260 / 2,225 XP** after 30 days for light, moderate, intensive, and intermittent routines. The moderate schedule projects Gold at 276 days; schedules and reward totals are reproducible through `npm run simulate:balance`. [Current data](docs/balance-1.7/simulation-results.json). The [1.6 report](docs/balance-report-1.6.md) records the previous persistence design.

The app includes sequential assessments with metric or feet/inches inputs, gym access, 24 mental-check forms per attribute, improvement exams at five-level stat milestones, solo daily tasks, group quests with shared training focus, request gold, and wider skill webs with sword, spear, axe, and unarmed Fighter routes. Adventures has a reserved **Guild requests** board. [Update rules and limits](docs/update-1.5.md).

### Assessment, ranked training, and Settings

The full [assessment and progression audit](metrics-audit.md) evaluates the previous metrics, verified reference values, scoring formulas, task ranks, and limitations. The assessment centers supported reference results on 10, leaves missing tests labeled unassessed at 10, and has no stat ceiling. It includes maximum consecutive pushups or chair stands, balance and six-minute walking distance; optional bench-press and dynamometer measurements; and five-question INT/WIS/CHA checks. Questions stay hidden until Start; checks rotate through 24 scenario sets for each attribute. No test includes Bible verses. Published age/sex grip means and supported walk equations are distinguished from sample-pooled and provisional references. The mental checks, pushup variants, bench anchor and balance anchor are not presented as validated population averages.

Request rewards account for rank and duration. Floor pushups 3×20 remain a C daily task at **150 XP / 30 gold**. Strict pullups 5×20 now form an S adventure at **32,400 XP / 6,480 gold**, requiring prior preparation of 56 days and 24 dates, current-month practice and outcome, appropriate equipment, capacity, and recovery. Lower ranks have easier long-term habit goals. SS/SSS require sustained preparation and independently assessed outcomes; elapsed time alone does not qualify. [Reward table and rank thresholds](docs/balance-report-1.6.md).

Universal work awards player XP once and partial related class, profession, and vocation credit. New class entry requires a trial, banks 25% of relevant earlier work, and starts that class at level 1. Class-specific work certifies further levels while retaining banked XP. Player and class levels remain separate. Technical requests follow the selected profession/vocation; Networking and Data Analysis are absent from global category filters.

**Settings** has General, Appearance, Training, Assessment, and Account & data pages. Name, units, text size, reduced motion, opening screen, equipment, and locked-request visibility persist. **Gym equipment** enables weighted and pullup-bar requests. Assessment has its own unit selector: cm or separate feet and inches for height. Its bottom button advances Body → INT → WIS → CHA → Results. Performance checks save raw results without automatically changing base stats; baseline recalibration requires a separate confirmation and retains earned points. Account sign-in, export, and restore remain under Settings → Account & data → Account & backups.

### Help, commitments, and Journey

Page subtitles, decorative slogans, and repeated explanations have been removed from normal screens. **Help** is a searchable handbook for requests, attributes, levels, classes, vocation, skills, combat, reports, and backups. It is available from registration, navigation, and the question-mark button.

**Objectives** now has **Guild board**, **Taken**, **Pinned**, and **Suggested** pages. Press **Take request** to accept a daily task, weekly quest, or monthly adventure. Taken contains current calendar commitments, including their completion status. Release removes the commitment without removing earned progress. A taken request retains its original class/profession/vocation credit even if the current focus changes. Canonical request templates supply all rewards.

Recurring requests **never accept themselves**. Daily commitments expire at local midnight and weekly commitments on Monday. Monthly commitments expire on the first of the next month. Previously taken or completed requests can appear in Suggested. Each request group pays once per period. Relevant daily activity is counted retroactively within the current week/month after an explicit acceptance.

**Journey** replaces the Journal page and requires no new writing. Its chronological timeline combines existing completions, credentials, and archived notes with automatically recorded new class/vocation changes, skills, level and stat gains, rank promotions, and adventure results. Existing journal text is retained as read-only archived notes. Restoring a backup does not manufacture new milestones.

Journey offers 7-day, 30-day, 90-day, and all-time summaries, plus a **Reports** view with interactive cumulative XP and completion charts, accessible data tables, a 12-week activity calendar, XP by progression path, class contributions, and registration-to-current attribute comparisons. Selecting a calendar day opens that day’s completed requests. Comparisons use the preceding equal-length period. Older milestone dates that were never recorded are not invented; new milestone tracking begins with this update. XP charts use recorded objective XP, separate from legacy progression credits.

### Class register and prestige

There are **51 classes**: eight Basic, 21 Advanced, 14 Prestige, and eight Ascendant. Search by name or real-world goal, filter by archetype, tier, or availability, inspect a class, and compare up to three before choosing. The same register is used during onboarding; locked options remain visible.

Every dossier includes its fantasy role, real-world goal, archetype proportions, signature skill, and entry requirements. Eight basic classes are open to anyone. Every nonbasic path requires stats above 10, sometimes combined with purchased or credential skills, a profession category, or prior class levels. Advanced paths can qualify from high starting assessments; Prestige and Ascendant paths also require prior class progression. Once a class is unlocked, it stays available.

Classes train eight shared archetype trees: **Fighter, Guardian, Ranger, Rogue, Mage, Cleric, Bard, and Artificer**. Fighter has 28 nodes, including sword, spear, axe, and unarmed branches; the other shared trees have 12 nodes. Independent routes and alternate prerequisites create cross-training choices. Every class also has four focused nodes. A Paladin is 70% Fighter and 30% Cleric; its class XP contributes to those archetype trees in those proportions. Shared skills already purchased remain learned when changing class.

Prestige and Ascendant classes require experience in earlier classes. Promotion retains total adventurer level and every earlier class record, while the newly selected class begins at level 1. Previously trained classes resume their own retained level when selected again. [Browse all classes and requirements](class-register.md).

Each active class grants one uniquely named **signature combat skill** without purchasing it or consuming a loadout slot. Advanced signatures have 5% increased potency, Prestige 20%, and Ascendant 40%; damage, healing, recovery, and protective effects use that potency. Other combat skills are learned through trees and equipped in **Adventures → Skill loadout**. Class stances, equipment, and equipped skill modifiers apply only in combat.

### Professions and vocation

The searchable catalog retains 283 common job titles, originally organized using US SOC major groups. Roles now map to **20 shared career trees**, each with ten named competencies, individual learning descriptions, branching prerequisites, practice gates, level requirements, and point prices. This is a curated role catalog, not an exhaustive or verbatim O*NET/BLS dataset.

A **profession** is the selected job role; a **vocation** is an independent career focus. For example, **Warrior / Analyst → Networking** combines strength objectives with job applications and CCNA/networking practice. Changing combat class does not change profession or vocation. Select a vocation in **Class Paths → Vocation**. Its daily, weekly, and monthly requests train the relevant career discipline, even when the selected profession belongs to another discipline.

Career points are shared across roles in the same discipline. Exact job-role XP and level history remain separate. Networking and data-analysis focus branches supplement the shared trees. CCNA/Network+/JNCIA-Junos and CCNP Enterprise/JNCIP-ENT award self-reported credential milestones; ordinary study does not substitute for those credentials.

Career competencies are explicitly **non-combat** and cannot supply battle attributes or commands. Exploration and other utility uses are reserved for a later design pass. Earlier combat subclasses, objectives, and purchases remain archived in existing characters; current combat specialization advances through class and prestige paths.

### Uncapped levels and attributes

- Adventurer, class, profession, and archetype levels have no configured ceiling. Each successive level requires more XP. Cumulative XP for level `L` is `round(B × ((L−1) + 0.15 × (L−1)²))`, where `B=250` for adventurer levels and `B=100` for other paths.
- Base attributes increase at **passed five-level class or profession examinations**. XP and relevant work qualify the path first; the milestone level and its points wait for measured improvement over the previous exam. Physical paths offer repeatable fitness protocols, mental paths use fresh checks or an alternate work sample. Rewards grow: 2 points at level 5, 3 at 10, 4 at 15, and so on. Hybrid classes distribute accumulated points by archetype focus; profession milestones use the career discipline’s focus attribute. Prior earned levels and points survive migration.
- Explicitly listed weekly/monthly rewards may also grant a base attribute. Ordinary daily completion, purchases, vocation selection, equipment, and combat victories do not directly grant base attributes.
- Every 100 source path XP earns one skill point for its path. Combat points include class objectives and related active-class universal credit once; career points pool the relevant discipline, counting overlapping profession/vocation credit once; universal points use universal objectives. Most new skills cost 4–30 points and require level, practice, and earlier nodes. A purchase is charged once and remains learned.
- **Guild rank** remains F–SSS. Promotion prices grow approximately 2.5×, starting at 2,500 XP; A (Gold) needs 161,094 cumulative guild XP. Older characters retain their rank and fractional progress through a separate guild credit. Guild rank and adventurer level are separate measures.
- Ordinary assessments begin at F. Exceptional starting placement is capped at D. New exceptional placement uses demanding combinations of strength, conditioning, balance, and completed mental checks; legacy placement routes remain supported. Exact thresholds are in the [audit](metrics-audit.md). These are guild game benchmarks, not measured population percentiles.

Older saves receive one-time progression credits that retain their earned levels, base attributes, point balances, purchases, and raw objective XP after the curve changes. Credits do not increase guild rank or claim additional real-world objective rewards. Earlier purchased skills remain visible in the skill archive and combat skills remain equippable.

### Requests, assessment, and adventures

- Request content follows the current class and its secondary archetype, profession, and vocation. Daily tasks are individual; weekly quests can involve other people. Group hikes split training credit between CON and CHA, while player XP is paid once. Category filters select a focus. Daily rewards refresh at local midnight and weekly on Monday. Monthly adventures reset on the first and include relevant activity already logged that month.
- Base rank gold is **2 / 5 / 12 / 30 / 70 / 160 / 360 / 840 / 2,000**, subject to cadence ceilings and the 1× / 4× / 18× duration multipliers. Earned gold joins the adventure wallet for supplies and equipment. Previous completions are not paid retroactively. Adventures → Guild requests contains delivery, patrol, named-monster, dungeon, and roaming-boss commissions.
- Assessment inputs remain clearable, with no forced leading zero. Walking records distance over six minutes, balance uses seconds, and bench estimates require body mass. Bodyweight registration needs no gym equipment. Baselines use reference-centered indexes with no upper ceiling; supported age/sex references and provisional anchors are explicitly distinguished.
- JRPG expeditions have eight regions, 24 places with ten stages each, repeatable exploration, bosses, and individual party turns. Your character can bring two of seven recruitable companions. Commands include attacks, guard, class signatures, equipped skills, potions, and ether.
- Combat includes armor piercing, multi-hit and area attacks, stun, taunt, counters, party barriers, healing, MP recovery, coordinated attacks, and burning. Victories grant combat gold and supplies, encounter access, and recruitment; they never grant real-world XP or base attributes.
- Eleven legacy gear items and 30 town-crafted items, town-specific general stores and smiths, saved battle state, character backup sharing, validated restore, Journey, archived notes, and completion history remain available.
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
7. Open **Settings → Account & data → Account & backups → Continue with Google**. Upload a character, then test **Restore cloud copy**. Each Firebase UID has its own private character document at `characters/{uid}`. Restore requires confirmation before replacing local progress.

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

Objectives and credentials rely on honest self-reporting. The application is personal motivation software and does not validate exercise form, certification authenticity, or health outcomes. Fitness descriptions support gentle and equipment-free alternatives. Notifications include an attention inbox and configurable Android local reminders. There are no remote push notifications, wearable integrations, automatic certification checks, real-money purchases, or live multiplayer systems in this version.

The current project has progression, combat, and browser workflow tests plus a compiled Android APK. It has not been run on a physical Android device or emulator. Test Google authentication, native backup sharing/import, keyboard and system-bar behavior, and app upgrades on your device before relying on it daily.

## Code map

- `src/domain.ts`: progression rules, classes, objective templates, wallets, and calendar periods.
- `src/skill-catalog.ts`, `src/class-roles.ts`, `src/SkillTree.tsx`: skill definitions, class combat roles, effects, and branching trees.
- `src/professions.ts`, `src/ProfessionPicker.tsx`: SOC-organized role catalog and searchable selector.
- `src/rpg.ts`, `src/AdventureGame.tsx`, `src/BattleSprite.tsx`: persistent combat engine, world/party/shop interface, and sprite art.
- `src/storage.ts`: local persistence and backup validation.
- `src/Onboarding.tsx`: guild application and baseline assessment.
- `src/screens.tsx`: guild card, objectives, classes, and skills.
- `src/metrics.ts`, `src/AssessmentForm.tsx`: reference models, assessment protocols, and original mental checks.
- `src/exam-bank.ts`, `src/MentalCheck.tsx`: rotating question forms and timed assessment UI.
- `src/exam-rules.ts`, `src/exams.ts`, `src/ClassExams.tsx`: milestone certification, improvement checks, alternatives, and records.
- `src/rank-metals.ts`, `src/GuildCard.tsx`, `src/Notifications.tsx`: rank cards and in-app reward/progression inbox.
- `src/task-ranks.ts`, `src/training-tasks.ts`: ranked catalog, work requirements, and recovery.
- `src/Settings.tsx`, `src/preferences.ts`: persisted display/training preferences and performance checks.
- `src/Journey.tsx`, `src/journey-events.ts`: automatic history and reports.
- `src/App.tsx`: navigation, persistence, dialogs, backup flows, native sharing/back button.
- `src/auth.ts`, `src/cloud-backup.ts`: deferred Google/Firebase authentication and owner-scoped segmented cloud snapshots.
- `src/progression-ledger.ts`: indexed history totals and progression-change detection.
- `src/performance-history.ts`: protocol-specific raw-performance trends.
- `src/registration-draft.ts`: recoverable unfinished applications.
- `android/`: native Android shell and build configuration.
- `public/`: original guild artwork. Fonts are supplied by Fontsource and retain their packaged licenses.

The balance harness is in `src/balance-simulation.ts`; prices are in `src/request-balance.ts`. Current simulation data is under `docs/balance-1.7/`; historical 1.6 data stays in `docs/balance/`.

- `src/objective-catalog.ts`, `src/RequestBoard.tsx`: grouped ranks, expanded activity catalog, search, pins, and filters.
- `src/calendar-goals.ts`: calendar periods, retrospective credit, and hybrid rewards.
- `src/world-catalog.ts`, `src/world-state.ts`, `src/world.ts`: towns, places, stages, discoveries, boss danger, stock, and commissions.
- `src/WorldMap.tsx`, `src/PixelScene.tsx`, `src/world.css`: pixel world, stores, guild boards, and battle presentation.
