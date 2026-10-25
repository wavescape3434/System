# UI and performance follow-up — 1.11.0

Verified 25 October 2026, America/Denver. The comparison baseline is the [1.10 review](../reviews/2026-10-24/README.md). Fixtures use sample progress, not the user's account.

## Phone results

The personal-character board now shows **four complete requests** in the first 390×844 viewport; the baseline review showed two. Search is immediately available and optional filters open on demand. All taken work appears together, with labeled status and separate 44×44 px details/pin controls.

The Guild actions, board, Taken view, readable class tree, performance reports, class milestone view and mastery dialog were captured and scanned with axe-core 4.14.0. All seven saved views have **no flagged WCAG A/AA violations, no uncaught page errors and no horizontal document overflow**. This is scoped screening, not whole-app accessibility certification or TalkBack/device validation. The full application has additional screens beyond these fixtures.

[Screen measurements](screens.json) · [Screenshot gallery](../screenshots/README.md)

## History timing comparison

Warmed five-run medians in desktop Chromium. Function calls use source modules; these are not Android frame times. Histories contain six synthetic completions per day, one class and limited shared credit. Environment variation affects absolute timings.

| Operation             | 1 year: before → after | 3 years: before → after |
| --------------------- | ---------------------: | ----------------------: |
| Derive stats          |           4.4 → 0.3 ms |           13.5 → 0.8 ms |
| Build objectives      |          12.4 → 2.0 ms |           19.2 → 2.5 ms |
| Build 30-day report   |          13.8 → 9.5 ms |          34.8 → 12.1 ms |
| Build all-time report |         23.4 → 14.6 ms |          53.9 → 32.4 ms |

The cosmetic-change Journey comparison, previously 21.8 / 45.2 ms at those sizes, now skips progression work and rounds to 0 ms at the measurement resolution. That does **not** mean zero execution time. Completion, exam and skill changes still run relevant milestone comparisons. Tests verify that XP, credit, levels and rewards retain their prior rules.

Serialized character sizes remain 458.8 KB / 1,374.2 KB. Local serialization and writing remain synchronous, measuring 2.2 / 15.7 ms in this run. An asynchronous local history database is still future work. Cloud snapshots now use bounded documents, separately from the local save format.

Startup main JavaScript decreased from approximately **969.4 KB / 295.8 KB gzip** to **845.3 KB / 260.7 KB gzip**, primarily by deferring Firebase and native Google-login modules. Total installed assets include those deferred chunks. This measures bundle size, not an observed device-startup speedup.

[New benchmark data](history-evidence.json) · [Baseline data](../reviews/2026-10-24/history-evidence.json)

## Remaining work

Live Google/Firebase configuration, deployed rules, Android notification delivery, system keyboards, app upgrades, sharing and TalkBack require the owner's project and a physical phone. The update includes cloud encoding/integrity and local recovery tests, not a live cloud certification. A cloud-generation retention policy, asynchronous local persistence, deeper encounter design, and a unified enemy/hero art pipeline remain separate work.

[Change details](../update-1.11.md) · [Build verification](../verification-1.11.md)
