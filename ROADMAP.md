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
| P03 | High | Faster daily request flow | Planned — next batch | Current commitments and class/career requests are easy to reach on a phone; parchment Take/Submit actions stay accessible without reading through the whole sheet again. |
| P04 | High | Record actual improvement | Planned | Optional quick inputs for sets/reps, duration/distance and completed work feed existing Journey trends. No compulsory journal writing. One activity can feed legitimate accepted goals under explicit stacking rules. |
| P05 | Before wider release | Accounts, recovery and device reliability | Planned; owner Firebase configuration and physical devices required for live checks | Verify Google linking, backup recovery, upgrades, reminders and keyboards on Android. Evolve primary storage beyond a whole-character synchronous record as histories grow. |
| P06 | Medium | Durable plans | Planned | Skill goals and relevant planning preferences survive app restarts and character backup/restore. Session-only goal storage is the current limitation. |
| P07 | Medium | Career progression payoffs | Planned | Career requests produce useful deliverables; non-combat competencies gain meaningful exploration, information or town uses without granting automatic base stats. |
| P08 | Medium | Economy and long-term challenge | Planned | Model gold sources, spending and consumable use together. Add challenges for high-stat characters while preserving earned power and unrestricted exploration. |

## Batch 1 scope

- **P01:** introduce shared combat profiles, distinct ranked effects, automatic upgrades within repeated technique families, one slot per family, and consistent descriptions in skill details and battle commands.
- **P02:** introduce breakable enemy shells and telegraphed heavy attacks in Briar Road, then test varied basic classes with and without tactical commands. This is a first pass, not a claim that all 240 stages have been rebalanced.
- Preserve base stats, real-world XP, rank thresholds, assessments, earned skill IDs, recorded point spending, character identity and older active battle snapshots.
- Combat CHA now strengthens party buffs; Mira has an offensive light spell to support different player roles.
- Verification and remaining limits are linked in the delivery log below.

**Next planned batch: P03 and P04**, unless the user redirects priorities. Return to P01/P02 for distinct weapon/element behavior, broader prestige/build balance, support-class battle length and later-region difficulty continuity after that first daily-use pass.

## Guardrails

- Keep manual request acceptance, retained class history, home-friendly training and automatic Journey reporting.
- Base stats grow through the existing class/profession milestones and explicit special rewards. Combat modifiers apply in Adventures.
- Combat never awards real-world progression XP or base stats. Preserve the current calendar-bound weekly/monthly design.
- Keep Christian faith content explicit. Mental assessments remain game estimates; do not present them as validated IQ, character or spiritual-worth scores.
- Keep the early experience approachable. Add depth through readable decisions, not required grinding or a specific mandatory class.
- Keep the requested long-term guild-rank curve; combat changes do not rebalance real-world request rewards.

## Review evidence

The version 1.13 review found identical effects for 3-point Spark: Control and 6-point Spark: Refinement; four fresh-character fixtures cleared all ten opening stages using Attack and Mira without consumables. At 390px, a direct class/career request began about 854px down and a parchment primary action about 1,242px down. Skill goals survived reload but not a fresh session. Thirty login rewards produced 645 gold, 21 additional potions and 17 ethers. These are implementation probes, not measured user adherence or health outcomes.

## Delivery log

| Batch | Release | Delivered / remaining | Verification |
| --- | --- | --- | --- |
| 1 | **1.14.0** | Ranked technique effects, one-slot family upgrades, CHA support scaling, Briar Road shells/wind-ups/cleave, Mira's Glimmer. Broader combat identity, economy and regional tuning remain. | [185 unit checks, 55 browser workflows, 16 combat fixtures, seven screen scans](docs/verification-1.14.md) |
