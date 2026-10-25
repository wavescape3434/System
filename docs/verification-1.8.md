# Version 1.8.0 verification

Verified 24 October 2026 (America/Denver).

- **154 unit checks passed across 12 files.** Coverage includes reward-cycle persistence and duplicate-claim prevention; supplies claimed during combat; exact victory settlement and Journey recording during continuation; retained expedition/boss state; unrelated profession/vocation XP separation; early skill purchases; invalid-save rejection; calendar deadline plans; native scheduling without unsolicited permission prompts; notification deduplication, cancellation, and tap routing. Existing assessment, examination, calendar-objective, shop, hybrid-reward, and four-account 7-/30-day balance regressions also pass.
- **All 38 browser workflows passed.** The six new workflows cover compact cards and detailed rank selection, Guild Card links and reward claiming, stage/exploration continuation, real two-touch pinch zoom through Chromium touch events, saved reminder preferences and attention-only notifications, and buying/equipping/using a one-point skill through the accessible list. Those six workflows were rerun after the Journey settlement fix and passed again.
- Production TypeScript/Vite build and Android Gradle debug build passed. Phone/desktop screenshot capture completed without page errors or horizontal page overflow.
- APK package **`com.theguild.personal`**, version **1.8.0**, version code **10**, minimum Android API **24**, target API **36**. The app name remains **The Adventurers Guild**.
- All **31 production web files** match their packaged `assets/public/` bytes, including the original forest artwork and bundled font licenses. Capacitor's packaged plugin registry includes native Local Notifications.
- APK signature verification passed. The signing certificate SHA-256 remains `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5`, supporting installation over the prior build. The storage key remains `the-guild.character.v1`.
- The merged manifest contains normal Android notification and reboot permissions plus the reminder restore receiver. Special exact-alarm permission is absent; reminders explicitly use inexact scheduling.

The APK is **9,611,597 bytes**. SHA-256: `aa39e69516d6034dc11bfdf45f0108b54f339f54aecd065dbb80b298a3322d9e`. The matching checksum is beside the download. [Machine-readable APK results](apk-verification-1.8.json).

The APK has not been run on a physical Android device or emulator here. Notification permission prompts, delivery during battery saving, reboot restoration, notification tap navigation from a stopped app, and an installed-app upgrade still need device testing. Native Google login still requires the existing Firebase/OAuth configuration. Browser touch and mocked native-adapter tests do not replace device verification.

Login rewards affect only adventure gold and supplies. Real-world objective XP and rank thresholds are unchanged; this update does not establish a new long-term reward-economy balance. New skill choices and the revised battle presentation need personal playtesting.

[Changes and reward values](update-1.8.md) · [Screenshots](screenshots/README.md) · [Android download instructions](../downloads/README.md)
