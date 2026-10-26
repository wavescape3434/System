# Opening combat with persistent reserves

The version 1.15 probe runs the actual app's combat functions through Chromium. It covers eight basic classes, Attack-only and tactical policies, and one-day/seven-day budgets: **32 fixtures**. [Raw results](opening-results.json).

Characters start with reference stats of 10, Mira, starting equipment, three potions and one ether. No learned player skills, shop purchases, login supplies or real-world training are added. A day continues until defeat; retries begin after the next local midnight with full reserves. Gold and remaining supplies carry forward. Failed encounters do not count as cleared. No fixture earns real-world XP from combat.

The tactical policy uses class signatures, Mira's abilities, healing, guarding, barriers and starting potions. It is deterministic and intentionally limited; it is not an optimal player or an in-app autoplay feature.

| Class | Tactical stages on day 1 | Tactical stages within 7 days | Days used to clear / budget |
| --- | ---: | ---: | --- |
| Warrior | 9 / 10 | 10 / 10 | 2 days |
| Sentinel | 9 / 10 | 10 / 10 | 2 days |
| Ranger | 9 / 10 | 10 / 10 | 2 days |
| Rogue | 9 / 10 | 10 / 10 | 2 days |
| Scholar | 9 / 10 | 10 / 10 | 2 days |
| Disciple | 10 / 10 | 10 / 10 | 1 day |
| Bard | 8 / 10 | 9 / 10 | 7-day budget exhausted |
| Artificer | 10 / 10 | 10 / 10 | 1 day |

The reserve change creates an attrition cost without imposing a fixed encounter quota. Healers and technical builds can extend an outing through their abilities. The fixed Bard fixture cannot clear the guardian within this budget after spending its starting supplies; support-role balance and the effect of resupply/equipment remain on P02/P08. These results describe the stated fixtures, not a required player schedule or a guarantee for all builds. Version 1.14's historical report used fresh resources per encounter and should not be read as the current pacing model.

Reproduce with Vite on port 5173 and Chromium available:

```sh
npm run simulate:combat
```

The script writes this release's JSON and checks that combat never adds real-world XP. The unit/browser checks separately verify exact resource carryover, benched members, exhausted retries, old saves, offline recovery and local midnight during an active battle.
