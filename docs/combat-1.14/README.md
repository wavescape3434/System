# Opening combat probes — version 1.14

The first roadmap batch compares **eight basic classes × two policies** across Briar Road's ten stages. Every fixture starts with six attributes of 10, its free class signature, Mira, initial equipment, three potions and one ether. No learned player techniques, extra real-world XP or purchased gear are supplied. The opening battle resets HP/MP normally; supplies carry between stages.

| Class | Attack-only clears | Tactical clears | Tactical actions, all stages | Potions used |
| --- | ---: | ---: | ---: | ---: |
| Warrior | 9 | 10 | 45 | 2 |
| Sentinel | 9 | 10 | 64 | 2 |
| Ranger | 9 | 10 | 46 | 2 |
| Rogue | 9 | 10 | 59 | 2 |
| Scholar | 9 | 10 | 41 | 1 |
| Disciple | 9 | 10 | 69 | 0 |
| Bard | 9 | 10 | 74 | 3 |
| Artificer | 9 | 10 | 69 | 0 |

An action is one party-member command, not a round. Attack-only always hits the first living enemy. The tactical policy guards or uses a party barrier for telegraphed heavy attacks, uses a supply if guarded damage would be fatal, heals low allies, buffs on the first round and uses available offensive abilities. It avoids a sweeping attack against a lone target when an ordinary attack is stronger. The source script records the exact policy; this is not an optimized AI or an in-app autoplay feature.

All tactical fixtures clear the guardian; all Attack-only fixtures lose there. This demonstrates available approaches across the basic classes under these initial conditions. Different equipment, stats, companions, mistakes or strategies can change results. Support builds still take more commands and the Bard fixture uses all three starting potions. Human difficulty and later-region continuity need further tuning.

All fixtures finish with **zero real-world XP**. No exercise, assessment improvement, user retention or real-world adherence is established by these simulations. These are combat probes, separate from the earlier 7-/30-day request-balance simulations.

With Vite running on port 5173, run `npm run simulate:combat`. The harness uses Chromium and the app's actual combat/save-transition functions. It writes [opening-results.json](opening-results.json) and fails if a tactical fixture stops clearing the route or gains real-world XP.

The screen-capture harness is `node scripts/capture-combat-previews.mjs`. It uses scripted sample progress, Chromium, reduced motion, America/Denver time, and axe-core from `/tmp/guild-ui-audit/node_modules/axe-core/axe.min.js`. [Screen evidence](screens.json) is limited browser screening, not native accessibility certification.

[Changes](../update-1.14.md) · [Roadmap](../../ROADMAP.md) · [Verification](../verification-1.14.md)
