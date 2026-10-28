# The Adventurers Guild — product roadmap

This is the working backlog from the version 1.13 product review. Update the status, release and evidence here as each batch ships. Keep unfinished work visible rather than treating a first pass as a completed system.

## Product direction

**Mission:** help Christian adults improve fitness, knowledge, faith practice, relationships and professional abilities through persistent RPG progression.

**Core loop:** deliberately take a request → complete real-world work → record earned character progress → use that character in Adventures → choose the next useful goal. The best-fit initial audience is Christian LitRPG, isekai and JRPG fans; actual demand and long-term retention still need a small user pilot.

## Priorities

| ID | Priority | Work | Status | Completion check |
| --- | --- | --- | --- | --- |
| P01 | Highest | Meaningful skill upgrades | **Ranked effects 1.14; martial/element/focus pass 1.24**; broader identity/balance remains | Higher investment changes a skill's power, efficiency or utility. Repeated ranks improve one technique without consuming extra slots. Existing ownership and purchase costs survive. |
| P02 | High | Adventures demonstrate class identity | **Opening 1.14; elite hunts/companions 1.23; prestige/build pass 1.24**; broader campaign tuning remains | Readable enemy patterns reward guarding, class signatures and learned skills. Opening encounters remain accessible to different basic classes. Expand enemy families after this first regional pass. |
| P03 | High | Faster daily request flow | **Delivered — 1.15.0** | Current commitments and class/career requests are easy to reach on a phone; parchment Take/Submit actions stay accessible without reading through the whole sheet again. |
| P04 | High | Record actual improvement | **Submission logging 1.15; per-set workouts and topic accuracy 1.25**; independent entry/editing/imports remain future work | Optional quick inputs for sets/reps, duration/distance and completed work feed existing Journey trends. No compulsory journal writing. One activity can feed legitimate accepted goals under explicit stacking rules. |
| P05 | Before wider release | Accounts, recovery and device reliability | **Primary-save migration shipped — 1.17.0**, following recovery/session hardening in 1.16. Android runtime/live service checks remain; Google setup deferred by owner. | Verify Google linking, backup recovery, upgrades, reminders and keyboards on Android. Evolve primary storage beyond a whole-character synchronous record as histories grow. |
| P06 | Medium | Durable plans | **Delivered — 1.16.0** | Skill goals and relevant planning preferences survive app restarts and character backup/restore. Independent goals for each shared, focused, career and universal tree. |
| P07 | Medium | Career progression payoffs | **Initial utilities for all twenty disciplines — 1.20.0**; deeper skill uses and deliverable workflows remain | Career requests produce useful deliverables; non-combat competencies gain meaningful exploration, information or town uses without granting automatic base stats. |
| P08 | Medium | Economy and long-term challenge | **Supply/workshop passes 1.21–1.22; elite challenge pass 1.23**; **ninety-day study 1.24**; gold surplus and longer-term tuning remain | Model gold sources, spending and consumable use together. Add challenges for high-stat characters while preserving earned power and unrestricted exploration. |
| P09 | High | Effective, progressive real-world practice | **Two-day balanced regimen — 1.25.0**; specialist standards, substitutions and real-user outcomes remain | Repeatable prescriptions, comparable reps/load/effort and topic-specific checked results; progress from current ability with recovery, not elapsed time alone. |

## Batch 1 scope

- **P01:** introduce shared combat profiles, distinct ranked effects, automatic upgrades within repeated technique families, one slot per family, and consistent descriptions in skill details and battle commands.
- **P02:** introduce breakable enemy shells and telegraphed heavy attacks in Briar Road, then test varied basic classes with and without tactical commands. This is a first pass, not a claim that all 240 stages have been rebalanced.
- Preserve base stats, real-world XP, rank thresholds, assessments, earned skill IDs, recorded point spending, character identity and older active battle snapshots.
- Combat CHA now strengthens party buffs; Mira has an offensive light spell to support different player roles.
- Verification and remaining limits are linked in the delivery log below.

## Batch 2 — 1.15.0

- **Requested reserve change:** save party HP/MP across encounters, retreats and party changes; restore at device-local midnight, including offline return. Healing abilities and supplies retain their uses.
- **P03:** put current commitments and class/career shortcuts above the unchanged Guild Card; add board shortcuts and fixed parchment actions/checklist access.
- **P04:** attach optional measured results to submissions, validate and preserve them in backups, show separate Journey practice charts, and preview one-per-date calendar-goal credit without extra payouts.
- Follow the next priorities with P05 account/device preparation and P06 durable plans. Live owner-project and physical-device checks remain part of P05. Return to P01/P02 for distinct weapon/element behavior, broader prestige/build balance, support-class battle length and later-region continuity.
- Persistent reserves increase the importance of P08 supply/equipment balancing. The fixed Bard fixture clears nine opening stages but cannot clear the guardian within seven days without learned skills, resupply or better equipment; keep this limitation visible in P02/P08.

## Batch 3 — 1.16.0

- **P06:** move goals and tree/style/list choices into the character; retain available legacy session plans, keep separate goals per tree, browse planned trees without changing combat class, and keep learned goals visible until cleared.
- **P05 recovery:** add asynchronous IndexedDB copies, retaining three daily copies and two copies from before replacement. Preserve the exact current record before a restore/new character; use an independent local fallback if needed. Review copies and compare records before restoring, including from registration or a damaged-save screen. Preserve plans, results and reserves.
- **P05 account operations:** cancel pending cloud operations after a Google account/session change, keep a failed upload from publishing a partial generation, and attempt Firebase sign-out even if native Google logout fails. SDK-double tests establish this protocol, not live Firebase readiness.
- **Owner direction, 26 October 2026 (America/Denver):** leave Google/Firebase setup for later. No project is configured in this build and no live account or rules deployment is claimed.
- **Still open in P05:** primary progress uses synchronous whole-character localStorage; file import remains capped at 5 MB. IndexedDB recovery supports larger copies but does not remove the primary-save limit. Physical Android runtime/upgrade checks remain separate. [Readiness record](docs/readiness-1.16.md).

## Batch 4 — 1.17.0

- **P05 storage:** asynchronous primary saves with separate 100-entry history chunks, atomic commit receipts, serialized writes, rollback of dependent unsaved changes, stale-window protection, safe legacy migration, explicit empty-record resets and a 25 MB file-import limit. Legacy source removal happens only after commit. Normal exports remain portable character JSON.
- **P07 first pass:** career work records from optional request outcomes across all twenty disciplines, a complete text export and a next-work-sample brief. Learned Business and Computing skills unlock current-town supply routes and next-stage diagnostics; information uses do not grant stats or progression/resources.
- **Owner direction:** the next P07 pass should cover **more profession categories**, rather than deepen only Networking/Analysis. Build useful discipline-specific field utilities and deliverable guidance around the maintained twenty-tree structure. Do not treat the two initial utility families as a completed career system.
- **P05 remains open:** physical Android upgrades/lifecycle/storage, reminders, keyboards, native file sharing, live Google/cloud/rules checks. Google setup stays deferred. The full character still loads into memory and validation/reports still scan history; profile these separately from write amplification.

## Batch 5 — 1.18.0

- **P07 breadth:** add Management, Logistics, Land/Agriculture, Trades, Safety and Finance utilities, bringing coverage to eight of twenty career trees. Use actual accepted commission progress, inventory, accessible routes, equipped slots, probability matrices and shop prices. No progression or resources are awarded for inspecting reports.
- **P07 access:** one selected tool per Fieldwork desk, one selected appraisal item, a category-labeled competency directory, shortcuts from learned skills/work records, and an expedition dialog that can be closed without ending the expedition.
- Keep tool ownership after profession changes. No character-schema migration, stat bonuses, automatic acceptance, free healing or reward/rank changes.
- Twelve disciplines still need field utilities: Engineering, Science, Healthcare, Education, Law, Community Services, Creative, Sales, Administration, Hospitality, Manufacturing and General Practice. Their existing trees, requests and work records remain usable.

## Batch 6 — 1.19.0

- **P07 breadth:** Engineering route prerequisites, Science observation records/export, Healthcare party supply projections, Education next-stage preparation, Law commission terms and hybrid conditions, and Community Services companion recruitment planning. Fourteen of twenty disciplines now have learned field utilities.
- Use actual route locks, recorded events/defeat counters, reserve/item rules, equipped abilities, acceptance baselines, calendar receipts and recruitment requirements. Reports leave progression and campaign state unchanged. Shortcuts open existing area, party, loadout, shop and commission screens.
- Six disciplines remain: Creative, Sales, Administration, Hospitality, Manufacturing and General Practice. Continue useful discipline-specific tools; coverage does not establish deeper skill mastery or real-world outcomes.

## Batch 7 — 1.20.0

- **P07 initial category coverage:** Creative route folio, Sales delivery-offer comparison, Administration commission receipt register/export, Hospitality town-service guide/travel, Manufacturing combined crafting bill and General Practice departure checks. All twenty disciplines now have a learned field utility alongside requests, trees and work records.
- Use actual access rules, saved progress, inventory, recorded receipt amounts/calendar windows, smith recipes and party reserves. Temporary crafting baskets do not purchase or persist as character plans. Explicit town travel uses the existing travel action and does not heal.
- **P07 still open:** deeper uses for later career nodes, richer deliverable review, skill identity/mastery and owner/user feedback. One utility per category establishes initial coverage, not full career-system completion.

## Batch 8 — 1.21.0

- **P08 evidence:** 80 baseline and 80 updated 30-day simulations with day-7 checkpoints, all eight Basic classes, three/five-attempt budgets, two material policies, login-only/moderate work, exploration seeds and 30/100 base-stat sensitivity fixtures. Gold reconciles daily; saves validate. [Report and figures](docs/economy-1.21/README.md).
- **P08 supply use:** explicit, persistent between-battle potion/ether use; full/fallen targets cannot waste items; stock/gold/inventory commit as a whole batch for quantities 1–99. Midnight remains the automatic full recovery. No daily encounter cap is added.
- **P08 materials/builds:** delivery cost/remaining-material previews with affected smith recipes; one CHA seal accessory per town. No base-stat or real-world XP rewards from these actions. Existing prices, rewards and rank thresholds remain.
- **Owner direction, 27 October 2026 (America/Denver):** calibrate for roughly **3–5 encounters a day**, retain both real-world and adventure gold sources, and tune spending/material demand. The simulation budget is a scenario, not a hard player limit.
- **Still open:** substantial gold surplus, finite campaign breadth, fixed-strength supplies at high stats, companion/player-level carry and broader late-region tactics. The controlled daily basket omits weekly/monthly/career rewards and is not an optimized routine for every class.

## Batch 9 — 1.22.0

- **P08 useful spending:** Greater/Royal brewing consumes gold and local materials; owned town gear gains persistent +1–+5 temper ranks at increasing costs. Live previews, delivery trade-offs, appraisals and triage reflect the new options. Recovery is deliberate; tempering cannot heal or raise base stats.
- **P08 evidence:** 80 current-baseline and 80 updated thirty-day simulations with day-7 checkpoints and 4,800 daily gold reconciliations. Both phases use field supplies; the updated bot additionally tempers and brews. [Report and figures](docs/economy-1.22/README.md).
- All eight moderate equipment-first classes sustain three/five daily encounter budgets. Five-budget wallets decline to 11,285–15,730 gold, but surplus remains. Material choices also reduce delivery income; do not attribute the whole wallet difference to spending.
- **Still open:** Royal supply demand is not demonstrated in the moderate fixtures; synthetic high-stat characters still win every allowed attempt. Companion/player-level carry, regional tactics, repeatable high-stat challenges, long-term revisits and finite campaign breadth remain. No gold source, earned balance, reward/rank curve or midnight recovery rule is removed.

## Batch 10 — 1.23.0

- **P02/P08 optional challenge:** 32 fixed-strength hunts across eight regions and four grades, readable enemy patterns, inspected rewards, immediate replay and a return to the selected hunt. Normal stage enemies, discovery/ambush state and midnight recovery remain unchanged.
- **P02 companion roles:** six new complementary commands alongside every retained signature; Mira keeps her existing second command. Party protection, piercing, analysis, group healing, burning and counters add choices without reducing companion stats or changing growth.
- **Owner direction, 27 October 2026 (America/Denver):** high-level companions carrying a hero with low combat stats remains a **valid support/career-focused route**. Keep it valid and improve roles/tactics. Do not treat companion carry alone as a defect requiring a nerf.
- **Evidence:** 1,568 deterministic synthetic fights across eight Basic classes, regions, grades, policies, supplies, focused/all-stat builds, learned loadouts and companion/player levels. [Report and figures](docs/hunts-1.23/README.md). These are not earned-account or daily-budget simulations.
- **Still open:** prestige/build/weapon/element balance, broader normal-region tactics, authored world arcs, sustainable elite-hunt routines and calendar/career-inclusive long-term economy. Royal item use in preloaded combat fixtures does not establish purchase demand or solve gold surplus.

## Batch 11 — 1.24.0

- **P01/P02 build identity:** four martial disciplines, three early elemental routes with three ranks each, focused DEX/WIS combat sources and six prestige-effect families across twelve Prestige/Ascendant classes. Learned focus techniques retain the class effect after switching. One-slot upgrades, ownership, recorded spending, prerequisites and older active fight rules survive.
- **P01/P02 evidence:** 2,640 matched fixtures per phase, plus 144 new elemental fixtures: **5,424 synthetic fights** across all 51 classes. No action-bound fights. These explicitly granted builds do not simulate earning promotions or purchasing skills. [Build report](docs/builds-1.24/README.md).
- **P08 evidence:** 32 ninety-day accounts with actual workshop/supply purchases, calendar renewals, real-world career practice and optional Elite stress days; **2,880 daily balance reconciliations**. No fabricated exam passes, certifications or promotions. [Economy report](docs/economy-1.24/README.md).
- **Still open:** gold surplus, sustainable Royal demand, wider class/loadout/party policies, remaining prestige identity and normal-region tactics. An unprepared Mira-only bot repeatedly loses its furthest-region Elite hunts; this is a stress case, not a recommended routine. No prices, gold sources, request/rank rewards, companion growth or midnight recovery rules change.

## Batch 12 — 1.25.0

- **Owner direction:** balanced strength and fitness; two strength days weekly. F is the entry point for someone not exercising. Ranks should offer useful training and a path toward harder work.
- **P09 initial regimen:** 24 A/B prescriptions across F–C and home/weights/gym, independent walking targets, per-set/setup/load/effort logs, comparable progression and manual rank review. Exact common exercise guidance and a corrected run/walk duration.
- **P04/P09 outcomes:** reload-safe device drafts, committed results in Journey, topic/source and checked correct/attempted answers. Hybrid class focus remains required; existing taken prescriptions survive plan edits.
- **Evidence:** 24 sixty-day ledger cases and a task-family efficacy review. Scripted exercise inputs verify software/rewards, not human fitness gains. [Review and limits](docs/training-1.25/README.md) · [Verification](docs/verification-1.25.md).
- **P09 still open:** qualified exercise review; substitutions, equipment-specific loading and independent partial-session logs; verified B–SSS sport/discipline standards; parallel subject-specific knowledge checks; real-user adherence and efficacy. Public guideline retrieval was proxy-blocked; references are established sources rather than freshly verified 2026 editions.

## Usage study — current 1.25.0

- **32 fictional customers / 35 annual scenarios / 12,775 account-days**, covering 32 job titles, all 20 profession categories, all 25 vocations and 28 classes. Day-7/30/90/180/365 checkpoints, complete backgrounds, retained histories, work samples and experience assessments. [Study](docs/personas-1.25/README.md) · [All profiles](docs/personas-1.25/CUSTOMERS.md).
- **Confirmed U01 defect:** Network Weaver commissions are classified as profession work; the earned class remains level 1. Scope inference and technical filters must distinguish class IDs from career-request prefixes.
- **P03/P04/P09:** explain banked XP, required class work and ready exams as distinct states. Theo's matched review choice changes Scholar 4 / Data Analyst 4 to Scholar 20 / Data Analyst 104 with the same player XP and receipts. Keep independent partial-work records and alternate assessment support open.
- **P01/P07:** advanced-class lineage can require returning to a named basic class despite many advanced levels. Review profession/request stat consistency, cross-category vocation credit, profession-only class gates and later useful career competencies. All 20 utilities are reachable; sampled completed career trees leave hundreds of points unused.
- **P08/P09:** 12/32 primary profiles reach Gold on days 258–348; 11/32 enter prestige classes. Mixed schedules have uneven calendar eligibility and reward yield. Ordinary encounters remain accessible with companions under this study's limited encounter policy. These are modeled outcomes, not retention/efficacy evidence or a class-balance ranking.
- Ranked follow-ups are maintained as [U01–U10](docs/personas-1.25/PRIORITIES.md). This study changes no app rules, rewards, owned progress or APK.

**Next:** fix U01 first; then improve progression-state actions and review advanced-class lineage, schedule feasibility and career depth using U02–U08. Run matched effort/frequency studies before changing rewards. Continue the broader P01/P02 and P08 work, retain companion-led play and both gold sources, and preserve local-midnight recovery. Physical Android/runtime validation remains P05 work; Google setup stays deferred.

## Guardrails

- Keep manual request acceptance, retained class history, home-friendly training and automatic Journey reporting.
- Base stats grow through the existing class/profession milestones and explicit special rewards. Combat modifiers apply in Adventures.
- Combat never awards real-world progression XP or base stats. Preserve the current calendar-bound weekly/monthly design.
- HP/MP persist between encounters and fully recover at 12:00 AM local time. Keep separate reserves for benched party members.
- Keep Christian faith content explicit. Mental assessments remain game estimates; do not present them as validated IQ, character or spiritual-worth scores.
- Keep companion-led support/career builds valid; companion progression remains tied to player level.
- Keep the early experience approachable. Add depth through readable decisions, not required grinding or a specific mandatory class.
- Keep the requested long-term guild-rank curve; combat changes do not rebalance real-world request rewards.

## Review evidence

The version 1.13 review found identical effects for 3-point Spark: Control and 6-point Spark: Refinement; four fresh-character fixtures cleared all ten opening stages using Attack and Mira without consumables. At 390px, a direct class/career request began about 854px down and a parchment primary action about 1,242px down. Skill goals survived reload but not a fresh session. Thirty login rewards produced 645 gold, 21 additional potions and 17 ethers. These are implementation probes, not measured user adherence or health outcomes.

## Delivery log

| Batch | Release | Delivered / remaining | Verification |
| --- | --- | --- | --- |
| 1 | **1.14.0** | Ranked technique effects, one-slot family upgrades, CHA support scaling, Briar Road shells/wind-ups/cleave, Mira's Glimmer. Broader combat identity, economy and regional tuning remain. | [185 unit checks, 55 browser workflows, 16 combat fixtures, seven screen scans](docs/verification-1.14.md) |
| 2 | **1.15.0** | P03 current work/shortcuts/fixed parchment actions, P04 optional submission results/Journey charts/practice-credit preview, persistent HP/MP and midnight recovery. | [Verification](docs/verification-1.15.md) · [32 reserve fixtures](docs/combat-1.15/README.md) |
| 3 | **1.16.0** | P06 durable multi-tree plans; P05 asynchronous recovery copies, replacement protection, recovery UI and account/session guards. Primary-save migration and physical Android checks remain; Google setup deferred. | [Verification](docs/verification-1.16.md) · [Readiness and remaining work](docs/readiness-1.16.md) |
| 4 | **1.17.0** | Chunked asynchronous primary saves, safe migration/rollback/conflict handling, 25 MB imports; P07 work records and first two information utilities. More profession categories next; P05 runtime checks remain. | [Verification](docs/verification-1.17.md) · [Changes](docs/update-1.17.md) |
| 5 | **1.18.0** | Six more profession tools, single-tool desk/item appraisal, learned-tool shortcuts, expedition Fieldwork and category directory. Eight of twenty disciplines covered; twelve remain. | [Verification](docs/verification-1.18.md) · [Changes](docs/update-1.18.md) |
| 6 | **1.19.0** | Six service/technical profession tools, observation export and party/loadout shortcuts. Fourteen of twenty disciplines covered; six remain. | [Verification](docs/verification-1.19.md) · [Changes](docs/update-1.19.md) |
| 7 | **1.20.0** | Six remaining category utilities; initial Fieldwork coverage reaches all twenty disciplines. Town travel retains reserves; deeper career uses and P08 economy remain. | [Verification](docs/verification-1.20.md) · [Changes](docs/update-1.20.md) |
| 8 | **1.21.0** | Manual supply use, safe batch shopping, delivery material trade-offs, CHA seals and 160 economy simulations. Surplus/sinks and higher-stat challenge remain. | [Report](docs/economy-1.21/README.md) · [Verification](docs/verification-1.21.md) · [Changes](docs/update-1.21.md) |
| 9 | **1.22.0** | Graded material brewing, permanent combat-only tempering and 160 new comparisons. Gold surplus, Royal supply demand and high-stat challenge remain. | [Report](docs/economy-1.22/README.md) · [Verification](docs/verification-1.22.md) · [Changes](docs/update-1.22.md) |
| 10 | **1.23.0** | 32 optional Elite hunts, four readable patterns, complementary companion commands and 1,568 combat probes. Long-term economy, prestige/loadout tuning and device validation remain. | [Report](docs/hunts-1.23/README.md) · [Verification](docs/verification-1.23.md) · [Changes](docs/update-1.23.md) |
| 11 | **1.24.0** | Martial disciplines, ranked elemental paths, focused-stat scaling, twelve prestige effects and ninety-day economy evidence. Gold surplus, wider build/campaign balance and device checks remain. | [Build report](docs/builds-1.24/README.md) · [Economy study](docs/economy-1.24/README.md) · [Verification](docs/verification-1.24.md) |
| 12 | **1.25.0** | Two-day balanced regimen, rank-specific prescriptions, saved per-set logs, class/calendar alignment and topic accuracy. Expert review, substitutions and observed efficacy remain. | [Review](docs/training-1.25/README.md) · [Verification](docs/verification-1.25.md) |
