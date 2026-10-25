# The Adventurers Guild — UI, UX, performance, and product review

Reviewed **24 October 2026**, version **1.10.0**, source commit [`2044bbd`](https://github.com/wavescape3434/System/tree/2044bbd565ff32b63c36ece908c011b98aa29fa1).

The app has a coherent identity and a worthwhile core loop: **take responsibility for a request → do real work → develop a character → use that development in Adventures**. The Guild Card, request board, independent appearance choices, retained class history, and automatic Journey are worth keeping.

The next priority should be **reliability, faster daily use, and better progression feedback**. More classes and regions will have less value until choosing, completing, and understanding a small set of requests feels easy. This is suitable for continued personal testing; it needs another reliability and device-validation pass before a wider beta.

This review adds notes, evidence, and repeatable audit scripts. It does **not** change application behavior or issue a new APK.

## Review scope and evidence

- Inspected the main screens, secondary tabs, assessment and exam rules, rewards, combat, world progression, storage, backups, notifications, and styles.
- Walked **66 production-build screen states** at **1440×1000** and **390×844**, using isolated sample characters, Chromium 154 and axe-core 4.14.0. Automated accessibility findings are screening results, not a conformance certification. Counts can include repeated shared components and the rendered background of a dialog; they are not a count of unique defects.
- Exercised additional workflows with a personal-character fixture, a ready examination, and an accepted weekly request. Checked core pages at **320, 390, and 600 px** with Large text.
- Benchmarked synthetic **30-day, one-year, and three-year histories**, with six completions per day. These measure history growth, not retention, fitness outcomes, or a new balance simulation.
- Rebuilt the app successfully. The prior release verification records 160 unit checks and 41 browser workflows; this audit used additional exploratory checks rather than rerunning that entire suite.
- Android keyboard behavior, TalkBack, system bars, reminders under battery restrictions, Google login, and native backup recovery still require real-device testing. Browser findings should not be described as device validation.

Evidence: [screen and accessibility observations](interface-evidence.json), [workflow reproductions](workflow-evidence.json), [history benchmarks and combat probes](history-evidence.json), and [release verification](../../verification-1.10.md).

## Highest-priority findings

Priority describes the next development order. **P1** blocks or misleads a core flow; **P2** adds recurring friction or long-term risk; **P3** is a refinement. “Confirmed” means reproduced in the browser; “source” means established by implementation inspection; “judgment” means a design recommendation requiring user feedback.

| ID    | Priority / evidence                                    | Finding and effect                                                                                                                                                                                                                                                              | Recommended change / completion check                                                                                                                                                                                  |
| ----- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-01 | P1 · confirmed                                         | **Exam inputs lose focus after one character.** Typing `42` produced `4`; the field was no longer focused. A normal result entry is broken.                                                                                                                                     | Stabilize the modal's focus lifecycle when its callback changes. Verify sequential typing, textarea entry, editing, and the phone keyboard; `.fill()` alone will miss this.                                            |
| UX-02 | P1 · confirmed                                         | **Taken can look empty while its count is nonzero.** Accept a weekly request → Guild → Open requests: `Taken (1)` appears above “No taken requests.” The shortcut opens the Daily tab.                                                                                          | Open an All taken view, or select the cadence containing work. Empty states should identify the active cadence and link to other accepted work.                                                                        |
| UX-03 | P1 · confirmed                                         | **Reverse keyboard focus escapes the modal.** Open an exam and immediately press Shift+Tab: focus moves to the background examination-record summary.                                                                                                                           | Keep forward and reverse Tab inside the dialog, including from its initial container focus. Make the background inert; restore focus on close.                                                                         |
| UX-04 | P1 · measured                                          | **Phone request discovery is dominated by controls.** A personal-character fixture has its first request at y≈585; only two whole cards fit before bottom navigation. The sample banner pushes the first card to y≈672.                                                         | Keep Search and Taken prominent; put less-used filters in a compact filter sheet. Target four complete requests on a 390×844 screen without shrinking text or tap areas.                                               |
| UX-05 | P1 · measured                                          | **Legibility and touch accessibility need a deliberate pass.** Contrast failures occur across most reviewed states. Board pin buttons are 17×17 px and fail the automatic target-size check.                                                                                    | Darken secondary text, establish readable utility typography, and enlarge actual hit areas. Use 44–48 CSS px as the phone design target, with WCAG minimum-size/spacing checks as a floor.                             |
| PR-01 | P1 · source / probe                                    | **Unbounded character levels meet bounded improvement exams.** A perfect mental score at equal completion time fails; balance must eventually exceed its 45-second protocol cap. Alternatives exist, but continuing to improve forever is not a sustainable certification rule. | Retain improvement exams early. Add defined mastery/maintenance standards and harder equivalent protocols later; make alternative baselines and retained XP explicit. Preserve the milestone gates the user requested. |
| DA-01 | P1 before wider beta · source                          | **The account promise is incomplete in the distributed build.** Google linking is unconfigured, and cloud saves are manual snapshots even after configuration.                                                                                                                  | Complete OAuth/device verification and show last successful backup plus local/cloud differences. Keep the local mode useful and clearly identified.                                                                    |
| PE-01 | P2 now; P1 for long-lived accounts · measured / source | **Every saved change does substantial whole-character work.** Journey compares all class levels, derives stats, and serializes the full history, including during combat and preference changes. Cost grows with history.                                                       | Cache/index progression by character revision; limit comparisons to affected paths; move history to structured asynchronous storage. Keep transactional save behavior and recovery.                                    |
| DA-02 | P2 now; P1 before cloud rollout · source / measured    | **An entire lifetime is stored in one local string and one Firestore document.** The three-year synthetic history is 1.37 MB of JSON before rich Journey events.                                                                                                                | Split profile/progression snapshots from append-only activity and adventure history. Page cloud history; add versioned migration and round-trip backup checks.                                                         |
| CO-01 | P2 · observed / source                                 | **Content count overstates authored variety.** Many class commissions share a generic template. A Warrior request currently mentions a “recording, simulation, or checked example” rather than prescribing a concrete training session.                                         | Author a smaller excellent set for each archetype and career family, with clear volume, outcome, alternatives, and recovery. Then extend to hybrid classes.                                                            |

Sources: [modal](../../../src/ui.tsx), [exam form](../../../src/ClassExams.tsx), [Guild hub](../../../src/screens.tsx), [request board](../../../src/RequestBoard.tsx), [exam passing rules](../../../src/exam-rules.ts), [save pipeline](../../../src/App.tsx), [storage](../../../src/storage.ts), [cloud snapshots](../../../src/auth.ts), [task templates](../../../src/training-tasks.ts).

## Screen-by-screen notes

| Area                       | Keep                                                                                                         | Friction / next improvement                                                                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registration               | Clear local/sample options; original appearance selection; searchable professions.                           | Google is a prominent unconfigured route. The profession defaults to Analyst without the new user choosing. Save an unfinished application so assessment work survives interruption.                                                                                        |
| Body assessment            | Metric/imperial controls, explicit repetition/time units, equipment-free alternatives, expandable protocols. | A six-minute walk and multiple body tests are a substantial first-session commitment. Offer an explicit provisional registration path and a short list of unfinished checks afterward. Missing results already remain unassessed at 10; preserve that distinction.          |
| INT / WIS / CHA            | Questions stay hidden until Start; answer explanations; recorded form IDs.                                   | Fifteen questions add 6–12 minutes before physical testing. Different forms use very similar reasoning structures. Show progress and permit an interrupted attempt to resume. Treat these as game checks, not validated measurements of intelligence, wisdom, or charisma.  |
| Assessment results         | Raw measurements, published/provisional distinctions, source links.                                          | A stat of 10 can mean a measured reference result or an unknown result. That distinction is less apparent on the Guild Card. Keep the card's art intact; surface assessment status in its linked details.                                                                   |
| Guild                      | The engraved card is distinctive and its links are useful. Login rewards have no missed-day penalty.         | On the phone fixture, Taken starts around y≈1036, below the first screen. Add a small actionable strip above or alongside the card without redesigning it: pending submissions, closest deadline, resume expedition. Reduce the allowance's visual priority.                |
| Objectives — board         | Grouped ranks, parchment treatment, compact names, details on demand.                                        | Too much height is spent on two tab rows and five filtering controls. Icon meaning relies on small pictograms/tooltips. Keep labels available on tap and to assistive technology. Show a concise accepted/completed status in addition to color.                            |
| Objectives — details       | Explicit Take request; original-path credit; visible reward and requirement data.                            | Reward tags repeat Player/class credit in ways that can look like separate spendable XP awards. Lead with action, workload, rank and payout; collapse the credit breakdown. Some rank labels and practice-day descriptions need a consistency check.                        |
| Taken / Pinned / Suggested | Manual reacceptance matches the user's responsibility mechanic; pins reduce searching.                       | Taken count is cross-cadence while results are single-cadence. Suggested can repeat familiar templates without explaining why they fit today. Remember search/filter state when returning from another page.                                                                |
| Class register             | Compact grid, tier/archetype filters, real-world goals, signature previews, comparison.                      | In the sample, “51 classes · 1 available” makes Basic classes look inaccessible despite entry trials being possible. Distinguish **active**, **trial available**, and **requirements unmet**. Add a visible next promotion route with the nearest unmet requirement.        |
| Vocation / profession      | Independent career choice and 20 shared tree families are sensible.                                          | Profession selection appears in registration, Vocation, and Skills. Vocation is under Class Paths even though it is non-combat. Consolidate career management into one destination while retaining card shortcuts. Explain the distinction in Help with one worked example. |
| Examinations               | Gates retain XP; alternate physical/work-sample tests exist; exam history is useful.                         | Fix typing first. A list of locked exams gives little sense of the next step. Show “one commission needed,” “XP needed,” or “ready,” then open the appropriate request. Avoid increasing requirements indefinitely on the same test.                                        |
| Skills & Stats             | Raw latest check, separate earned/baseline numbers, credential requirements, retained purchases.             | The radar rescales with the largest stat; shape alone cannot show improvement over time. Add comparable raw-performance trends and a compact explanation of the next earned stat milestone in details.                                                                      |
| Skill tree                 | Real branching, pinch/pan, Fit, and a searchable list are good foundations.                                  | Fit is an overview, not a readable selection view. At ~28% phone zoom, labels are tiny. Start with reachable branches or a readable list on a phone, provide “center on available skills,” and retain branch/zoom on return. Keep the full web for planning.                |
| Credentials                | Explicit self-reporting; certification unlocks connect professional work to progression.                     | Remove is immediate, without Undo. Make expiry/evidence/date handling clearer and confirm what happens to already learned skills if a credential is removed. Avoid suggesting that a self-reported credential is independently verified.                                    |
| Journey — Chronicle        | Automatic history with no extra writing; filters, timeframe summaries, and pagination.                       | Empty/new accounts show mostly zeroes. Start with registration and the next recorded milestone, not an empty analytics wall. Distinguish accepting work from completing it.                                                                                                 |
| Journey — Reports          | Comparison periods, cumulative XP, calendar, data tables.                                                    | Charts mostly report game activity. Add repeated pushup/load/walk/check results over time so users can see real improvement. Calendar cells are 17×17 px; interactive chart points sit inside an SVG exposed as one image.                                                  |
| World map                  | Persistent places, named towns, unlocks, gathering and repeat exploration.                                   | A long region/town list precedes the immediate next action. Lead with current town, current expedition, and local requests; put distant locked territory behind a compact map/register. The world currently has breadth before narrative depth.                             |
| Battles                    | Phone commands fit; party HUD and portraits are readable; Continue preserves expedition flow.                | Enemy sprites are much simpler than the detailed heroes. HP information repeats over fighters and in the HUD. Action outcomes resolve immediately, so damage and actor changes can be difficult to follow. Add short controllable sequencing and a clear action summary.    |
| Party / appearance         | 24 independent looks, explicit preview/apply, distinct companions, cosmetic choice retained across classes.  | Long phone roster pages need a sticky or nearby apply action when browsing far down. Companion choices need clearer tactical comparisons. Preserve variety, including the requested alluring adult designs.                                                                 |
| Skill loadout              | Active class signature is visible without purchase; learned combat skills can be equipped.                   | Make the route from a locked/unlearned ability to its tree, prerequisites and point cost direct. Show targeting and utility before a user enters combat.                                                                                                                    |
| Adventure guild requests   | Local commissions, completion tracking and supply delivery make towns feel responsive.                       | This duplicates the word “Guild requests” used for real-world Objectives. Keep one vocabulary: e.g. Requests with explicit Real world / Hybrid / Adventure labels. Required hybrids should link directly to their destination.                                              |
| Shops / equipment          | Stock shortages and different smith quality are good world-building mechanics.                               | Forging can purchase and equip in one operation. Show exact before/after combat values, material cost, equipped item, and stock effects. Make shortage-restocking requests reachable from the out-of-stock item.                                                            |
| Notifications / reminders  | Attention-only inbox; claimable rewards; configurable local time.                                            | Daily reminders can fire even with no taken daily work. A weekly/monthly request taken after the scheduled deadline reminder is skipped. Offer a late-acceptance reminder path and a permission/status check on a real phone.                                               |
| Settings / backups         | Units, Large text, reduced motion, equipment and explicit baseline recalibration.                            | Long General page mixes multiple concerns. Clearly distinguish auto-saved preferences from explicit Save profile / Save assessment. Show backup recency and preserve incomplete edits when leaving.                                                                         |
| Help                       | Searchable mechanics belong here; ordinary pages mostly avoid slogans.                                       | Some important actions remain hard to discover from the relevant screen. Use short contextual labels/links, not explanatory paragraphs everywhere. Help should resolve terminology and concrete examples.                                                                   |

Visual evidence: [Guild](guild-390.png), [board](board-390.png), [request detail](request-detail-390.png), [classes](classes-390.png), [tree](tree-390.png), [battle](battle-390.png), [reports](reports-390.png), [assessment](assessment-390.png), [world](world-390.png), [exam input](exam-focus-390.png). Screens use fixtures, not the user's saved character.

## Additional confirmed interaction issues

- **Pagination text disagrees with behavior:** “Show 12 more” increases cards from 30 to 60. The handler adds 30 while the label says 12. Small fix; include it in the request-board pass.
- **Navigation discards context:** searching Pushup, visiting Journey, and returning to Objectives clears the search. Main pages are remounted on navigation. Preserve request filters, tree branch/zoom, adventure subtab and meaningful scroll positions.
- **Android Back uses a shallow route:** the native handler closes a dialog or returns straight to Guild. A browser-style/history-aware back model would better preserve a chain such as request → related tree → return to request. Decide this deliberately; do not silently make every tab a history entry.
- **Accessibility labels on board icons are invalid:** the automatic checker reports 60 invalid `aria-label` uses on generic spans across 30 cards. Give meaningful icons appropriate semantics or include visually hidden text. Avoid making decorative icons redundant with the request label.
- **Contrast is systemic:** examples include board count text at 2.55:1, the sample label at 3.19:1, and gold-balance text at 3.23:1. These are below the usual 4.5:1 requirement for small normal text. Change shared color/type rules rather than patching individual screens.
- **Charts need accessible interaction semantics:** two report SVGs expose focusable descendants within `role="img"`; the data tables are a good fallback worth keeping. Provide a correctly labeled interactive region and larger date navigation.

All 66 screen states had **no uncaught page errors or horizontal document overflow**. Twelve additional Large-text/core-page width combinations also had no document overflow. These are useful strengths, but they do not establish that every tab is discoverable or every control is readable. The mobile cadence tab row, for example, clips its last label inside a horizontal strip rather than overflowing the document.

## Progression and rewards

### Preserve the split between effort and measured capability

The design correctly avoids adding permanent stats for every completed daily task or combat item. Keep four concepts distinct in the model and linked details:

1. **Raw performance:** actual repetitions, load, distance, or assessed work.
2. **Earned base stats:** game progression from certified milestones and special rewards.
3. **Combat modifiers:** skill, gear, and class effects used in Adventures.
4. **Player/class/career XP:** progression credit with different purposes.

The user wants game stats to grow faster than real ability. That is compatible with this split, but it means STR 100 cannot honestly mean five times the real strength of STR 20. The raw-performance trend is the evidence; the higher game number is the motivational reward. Current data structures retain useful assessment history, but Reports does not yet make enough use of it.

The “10 = average” assessment is only partly supported. Published grip and walking references are cohort-specific; pushup/bench/balance anchors and the authored mental checks are provisional. The existing [metrics audit](../../../metrics-audit.md) explains this correctly. Do not present the whole stat system as population-normalized until it has actually been validated. Age groups with no supported reference should remain visibly provisional.

### Keep early progress visible without weakening the long-term ranks

The existing 30-day simulations show an important UX risk:

| Routine   | Player level, day 7 → day 30 | Class / profession at day 30 | Guild rank at day 30 |
| --------- | ---------------------------- | ---------------------------- | -------------------- |
| Light     | 2 → 7                        | 1 / 1                        | E                    |
| Moderate  | 6 → 19                       | 4 / 4                        | D                    |
| Intensive | 12 → 32                      | 4 / 4                        | C                    |

Source: [existing calendar-balance simulation](../../balance-1.7/simulation-results.json); **not rerun for this audit**. These scripted accounts do not sit exams, so level 4 is an expected gate, not proof that progression is broken. It does show why a full XP bar must explicitly say **Exam ready**, with banked XP visible and a direct action. “More XP” is the wrong recommendation at that point. Universal-only routines also need a visible class commission/trial route if they are to develop a class.

Keep the exponential guild thresholds and the agreed roughly 9–12 month Gold goal as a design target. The 276-day estimate is an extrapolation from a fixed moderate routine, not observed retention or a guarantee. Pair slow metal promotions with frequent early skill choices, first-week milestones and useful equipment. A big rank interval should not feel like weeks without progress.

### Exams need a long-term mastery rule

Physical passing currently requires at least 5% or one unit of improvement; mental passing requires at least 4/5 plus improved score or 5% faster completion. A 30-second balance baseline reaches a required result beyond the 45-second protocol after nine successive 5% increases. The app already offers alternate tests and explicitly suggests them at the ceiling. That helps, but repeated fresh baselines are not a complete lifelong progression design.

Recommended rule: early milestones demonstrate improvement; later milestones can demonstrate a retained mastery standard under consistent conditions, transfer to a harder protocol, or complete a longer assessed project. Give recovery, illness and temporary plateaus a fair route without granting automatic stats. Do not reward speed over thoughtful judgment in WIS/CHA, or claim that two differently worded five-question forms are equivalent measurements.

### Reward work without turning the board into an optimization chore

The daily/weekly/monthly rank caps and manual acceptance are good constraints. The next balance work should examine **reward per realistic effort, overlapping requests, class certification, gold sinks, and choice overload together**. A fixed rank multiplier alone cannot ensure that two activities take comparable work.

Use a plan of coherent requests: one session should generate one recorded activity, then feed the accepted weekly/monthly milestones that legitimately reference it. Keep separate reward rules visible in details so retrospective credit feels earned. Explain period-end rules and achievable remaining practice days before taking a request late in a week/month. Preserve the user's latest calendar-bound design; do not restore month-to-month commitments accidentally.

Adventure gold is also repeatably obtainable through encounters, caches and commissions. Combined with free login supplies and full HP/MP at each new encounter, it can reduce the reason to buy healing supplies or care about town shortages. This is an economy/design risk, not a request to add an energy timer. Model item consumption, forging, and earning routes before adding more currencies or increasing rewards.

## Adventures: current depth and potential

Adventures works best as a place to **use a character built through real life**. Unlimited exploration is consistent with that. The game should still make a learned skill or class promotion noticeably change a decision.

In an audit probe, the sample character cleared all four stages of the first place using **Attack only**, both solo and with two companions. Solo fights took four attack actions each; the full party took four to six actions per fight. Easy opening fights fit the intended early progression. They do not establish later combat difficulty, and this was not an all-class combat-balance test. They do show that the opening currently does little to demonstrate the value of skills.

Recommended content sequence:

1. Make the first area's encounters introduce distinct choices: guard against a telegraphed hit, use a class signature, heal a selected ally, then exploit a learned skill. Avoid requiring one specific class to progress.
2. Build one strong regional arc with a town problem, a named opponent, supply consequences and a meaningful companion moment. Then extend its structure to the other regions.
3. Give enemy families different behaviors. Current enemy targeting and every-third-round boss heavy strikes are highly predictable; variety should come from readable patterns rather than concealed randomness.
4. Unify visual scale: detailed adult heroes, simpler low-resolution enemies, generated forest backgrounds and abstract pixel scenes currently feel like several art systems. Establish sprite dimensions, pixel density, palettes, animation frames and biome direction before another roster expansion.
5. Make hybrid requirements a direct route. A reading quest with an herb-gathering condition should link to the commission and location, show required versus bonus clearly, and retain credit correctly. Too many unrelated mandatory hybrids could make a real-world win feel withheld by a game chore.

Do not spend heavily on a large narrative yet. The immediate test is whether a 5–10 minute expedition feels rewarding and creates a reason to pursue a useful real-world objective afterward.

## Performance, persistence, and maintenance bottlenecks

### Measured history growth

Warmed five-run median function timings in desktop Linux Chromium, using source modules. These are diagnostic comparisons, **not Android load times**. Synthetic histories contain six completion records per day, one class and limited credits; actual accounts with more classes, exams and events can differ.

| Operation                      | 30 days / 180 completions | 1 year / 2,190 | 3 years / 6,570 |
| ------------------------------ | ------------------------: | -------------: | --------------: |
| Character JSON                 |                   38.7 KB |       458.8 KB |      1,374.2 KB |
| Derive stats                   |                    0.8 ms |         4.4 ms |         13.5 ms |
| Build objectives               |                    2.7 ms |        12.4 ms |         19.2 ms |
| Compare/record Journey         |                    1.4 ms |        21.8 ms |         45.2 ms |
| Build 30-day report            |                    3.9 ms |        13.8 ms |         34.8 ms |
| Build all-time report          |                    5.9 ms |        23.4 ms |         53.9 ms |
| Serialize and write local save |                    0.1 ms |         2.3 ms |         12.4 ms |

All three fixtures passed character validation. A separate **4× CPU throttle** probe recorded Journey comparisons of approximately **11 / 234 / 349 ms** at those history sizes. Those were single-run measurements with a simpler fixture and should not be treated as stable device benchmarks or added to the median table. They establish a plausible main-thread interaction bottleneck worth profiling on a midrange phone.

The current save path performs migration checks, automatic awards, Journey comparisons, full serialization and React updates for each action. Repeated scans through all completion records and classes are the main concern; the app does not need a framework rewrite. Build reusable derived indexes, avoid comparing all progression on a cosmetic or battle-only change, and keep history queries outside every render. Preserve the current behavior that a failed save leaves the committed character unchanged.

### Storage and cloud

`localStorage` is synchronous and stores one whole-character JSON value. The backup importer caps files at 5 MB. Cloud upload writes that same character to one Firestore document; Firestore has a [1 MiB document limit](https://firebase.google.com/docs/firestore/quotas). JSON bytes are not Firestore's encoded document size, so this audit does not claim an exact failure date. The measured growth makes the single-document design inappropriate for an unbounded lifetime history.

Use an asynchronous local database with profile/progression snapshots and append-only records. Separate cloud history into bounded documents and support paged restore. Add automatic local recovery snapshots plus explicit export, backup recency, cloud conflict information, and a tested migration. Keep the stable character identity and existing earned history.

A shared-device sign-in also needs an explicit association between the local character and the selected Google account. Authentication presently enables manual upload/restore rather than automatically choosing a unique account's character. Resolve that interaction before calling the app multi-account ready. Self-reporting is fine for personal motivation; leaderboards or a shared economy would require a separate trusted progression design.

### Startup and code organization

- Production build: approximately **969 KB main JavaScript** (296 KB gzip), **155 KB CSS** (33 KB gzip). Firestore has a separate ~456 KB chunk, loaded on demand by cloud operations. Most screen/catalog code is eagerly imported.
- The new character atlas is ~2.88 MB; Android assets are bundled locally, so this is primarily package/decode cost rather than a repeated network download. Avoid fetching or rendering the roster unnecessarily on unrelated screens.
- Nine CSS files contain **10,629 lines**, with sequential update styles layered over earlier rules. This makes regressions and accidental overrides more likely. Consolidate design tokens and component ownership incrementally, preserving the approved card and board visuals.
- `App.tsx`, `screens.tsx`, `domain.ts` and large catalogs mix many concerns. Extract request-detail, persistence, navigation and derived progression responsibilities when those areas are next changed. Avoid a broad rewrite during a UX pass.
- README contains documentation drift: its later limitations paragraph describes notifications as inbox-only, while newer sections correctly describe native local reminders. Make setup, capability and release limits consistent before inviting testers.

## Likely usage and product direction

These are product judgments based on the implementation and the user's goals, not market research or observed customer demand.

**Best current fit:** an individual who already enjoys LitRPG/JRPG progression and wants structure for fitness, study, Christian practice and a concrete career goal. Your own Warrior/Paladin plus Analyst → Networking use case is strong because the activities have a natural purpose outside the game. Christianity can remain the app's faith framework as requested; describe that focus honestly if sharing with other people.

**Less suitable today:** someone wanting a quick generic checklist, a serious exercise programming tool, a verified cognitive assessment, a fully developed standalone JRPG, or automatic activity tracking. Trying to satisfy all of those at once would make the app harder to maintain and explain.

A healthy intended rhythm would be:

| Moment                            | Intended use                                           | What the app must make easy                                                   |
| --------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Start of day, 1–2 minutes         | Deliberately take two or three suitable requests.      | Resume pinned/suggested work, choose rank, see workload and deadline.         |
| After an activity, under a minute | Submit completed work and see useful progress.         | Record once, explain earned credit, avoid repeated checklists and navigation. |
| A few times a week, 5–15 minutes  | Spend points, use skills and explore.                  | Resume exactly where the expedition stopped; make new choices matter.         |
| Weekly, about 5 minutes           | Review consistency, performance and next goal.         | Show real-world trends, upcoming trial/exam and achievable weekly requests.   |
| Monthly                           | Finish a sustained goal and review the next promotion. | Show preparation credit, meaningful reward and realistic next steps.          |

The main retention risks are administrative load, apparent class stalls, generic commissions, exam frustration, and a battle loop that becomes repetitive before new real-world progress arrives. There is also a risk that an enjoyable unlimited game becomes a way to postpone the very activity it is meant to support. Solve this through a satisfying connection between work and capability, rather than punishing missed days or forcing daily streaks.

Keep account creation, taking, completing, earning and using one skill as the primary route. Class comparisons, advanced trees and regional catalogs can remain available for deeper planning. Removing flowery copy was the right direction; good task names and visible action/status labels can do more work than explanatory paragraphs.

## Suggested next development order

1. **Correctness pass:** fix exam typing and focus trapping; repair cross-cadence Taken navigation; correct pagination; preserve navigation/draft context. Add workflow checks using actual key sequences and a weekly-only accepted account.
2. **Phone-use pass:** keep the approved card and board artwork; bring pending actions higher, collapse board filters, enlarge hit areas, repair contrast, and make reachable skills readable. Validate at 390×844, Large text, and with TalkBack on a phone.
3. **Progression clarity pass:** show the next class requirement and banked XP/exam action; define long-term mastery alternatives; add raw-performance trend reports. Author concrete archetype/career request sequences before increasing counts.
4. **Data-lifetime pass:** indexed local history, bounded cloud documents, recovery snapshots, backup state and account association. Verify restoration after upgrade and at multi-year record counts.
5. **Adventure-depth pass:** one authored region, consistent art scale, distinct enemy behaviors, skill demonstrations, equipment comparisons and an economy consumption simulation. Extend the rest of the world after that loop works.

Before a wider beta, observe a small group of willing testers using their own characters for **four weeks**. Record task success and confusion with consent; a personal build can use a simple feedback sheet rather than adding analytics immediately. Useful measures are time to first taken request, time to submit, return-to-unfinished-work success, exam abandonment, unspent points, voluntary weekly return, and whether a chosen real-world measure improved or stayed consistent. More screen taps, game time, or total XP alone are not proof that the app is helping.

The best next milestone is a version where a user can reliably take today's work, submit it quickly, understand the next promotion, and enjoy a short adventure with the reward. The existing scope is already enough to test that.

## Reproducing the review

The audit scripts only modify isolated browser fixtures and review artifacts. They do not modify the app's production data or require runtime dependencies to be added to the app.

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4174
# In another terminal, install the accessibility scanner outside the repo:
npm install --prefix /tmp/guild-ui-audit --no-save --package-lock=false axe-core@4.14.0
AUDIT_URL=http://127.0.0.1:4174 node scripts/audit-interface.mjs
AUDIT_EXTRA=1 AUDIT_URL=http://127.0.0.1:4174 node scripts/audit-interface.mjs
# History/workflow probes additionally use Vite source imports on port 5173:
npm run dev -- --port 5173
node scripts/audit-history.mjs
node scripts/audit-workflows.mjs
```

The history/workflow probes use fixed local ports; the workflow fixture contains September 2026 records. Update those fixtures when repeating the review for a later release. Audit results depend on browser/host load. Screenshot and metric values here refer to the saved evidence rather than promising identical timings on another machine.
