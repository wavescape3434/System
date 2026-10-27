# The Adventurers Guild — product roadmap

This is the working backlog from the version 1.13 product review. Update the status, release and evidence here as each batch ships. Keep unfinished work visible rather than treating a first pass as a completed system.

## Product direction

**Mission:** help Christian adults improve fitness, knowledge, faith practice, relationships and professional abilities through persistent RPG progression.

**Core loop:** deliberately take a request → complete real-world work → record earned character progress → use that character in Adventures → choose the next useful goal. The best-fit initial audience is Christian LitRPG, isekai and JRPG fans; actual demand and long-term retention still need a small user pilot.

## Priorities

| ID | Priority | Work | Status | Completion check |
| --- | --- | --- | --- | --- |
| P01 | Highest | Meaningful skill upgrades | **First pass shipped — 1.14.0**; broader skill identity/balance remains | Higher investment changes a skill's power, efficiency or utility. Repeated ranks improve one technique without consuming extra slots. Existing ownership and purchase costs survive. |
| P02 | High | Adventures demonstrate class identity | **Opening pass shipped — 1.14.0**; other regions and role tuning remain | Readable enemy patterns reward guarding, class signatures and learned skills. Opening encounters remain accessible to different basic classes. Expand enemy families after this first regional pass. |
| P03 | High | Faster daily request flow | **Delivered — 1.15.0** | Current commitments and class/career requests are easy to reach on a phone; parchment Take/Submit actions stay accessible without reading through the whole sheet again. |
| P04 | High | Record actual improvement | **Submission logging delivered — 1.15.0**; independent entry/editing/imports remain future work | Optional quick inputs for sets/reps, duration/distance and completed work feed existing Journey trends. No compulsory journal writing. One activity can feed legitimate accepted goals under explicit stacking rules. |
| P05 | Before wider release | Accounts, recovery and device reliability | **Primary-save migration shipped — 1.17.0**, following recovery/session hardening in 1.16. Android runtime/live service checks remain; Google setup deferred by owner. | Verify Google linking, backup recovery, upgrades, reminders and keyboards on Android. Evolve primary storage beyond a whole-character synchronous record as histories grow. |
| P06 | Medium | Durable plans | **Delivered — 1.16.0** | Skill goals and relevant planning preferences survive app restarts and character backup/restore. Independent goals for each shared, focused, career and universal tree. |
| P07 | Medium | Career progression payoffs | **Initial utilities for all twenty disciplines — 1.20.0**; deeper skill uses and deliverable workflows remain | Career requests produce useful deliverables; non-combat competencies gain meaningful exploration, information or town uses without granting automatic base stats. |
| P08 | Medium | Economy and long-term challenge | **Supply pass and simulations — 1.21.0**; gold surplus, later challenge and sinks remain | Model gold sources, spending and consumable use together. Add challenges for high-stat characters while preserving earned power and unrestricted exploration. |

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

**Next:** continue P08 with useful gold/material sinks, equipment and graded-supply demand, plus P02/P08 high-stat and companion scaling probes. Retain both currency sources, earned balances and the agreed guild-rank curve. P05 physical-device/live-service checks remain a release gate; Google setup remains deferred.

## Guardrails

- Keep manual request acceptance, retained class history, home-friendly training and automatic Journey reporting.
- Base stats grow through the existing class/profession milestones and explicit special rewards. Combat modifiers apply in Adventures.
- Combat never awards real-world progression XP or base stats. Preserve the current calendar-bound weekly/monthly design.
- HP/MP persist between encounters and fully recover at 12:00 AM local time. Keep separate reserves for benched party members.
- Keep Christian faith content explicit. Mental assessments remain game estimates; do not present them as validated IQ, character or spiritual-worth scores.
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
