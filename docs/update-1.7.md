# The Adventurers Guild 1.7.0

Objectives now group related difficulties into one request with a rank selector. Weekly and monthly requests use calendar periods with retrospective credit for relevant logged activity. Adventures adds a repeatable exploration world, town economies, guild commissions, and original pixel graphics.

## Objectives

The Warrior / Analyst / Networking sample catalog has **259 variants in 145 request groups**, including seven class trials. It contains 140 daily variants, 53 weekly variants, and 66 monthly variants. Counts vary with the selected paths and eligibility; technical activities follow the selected profession or vocation. [Generated catalog audit](content-audit-1.7.json).

New activities include core control, hinges, loaded carries, footwork, hand coordination, cycling, stair walking, retrieval, explanatory writing, language practice, Scripture context, decision review, speaking rehearsal, listening analysis, message writing, sleep routines, meal planning, career competencies, and networking labs. Weekly and monthly plans cover sustained practice and reviewed outcomes.

Comparable ranks share one card: for example, Pushup practice offers wall, incline, and floor options at F–C. Named achievements such as the marathon remain separate requests. Choose the rank before pressing Take request; release an unfinished choice to select another. Each group pays once per period, so completing a low rank cannot also pay its higher variants that day/week/month.

The board has full-text search, category/rank/stat filters, current-focus/name/reward sorting, saved pins, Taken and Suggested views, and a twelve-card initial page with explicit Show more. Search applies to the whole catalog. Descriptions and rewards remain visible in the rank picker.

## Calendar periods

- Daily tasks reset at local midnight; weekly quests run Monday through Sunday; monthly adventures run from the first through the last local calendar date.
- Weekly/monthly progress includes relevant daily work already logged within the current period, even before the request was taken. Unrecorded outside activity is not inferred.
- Several completions on one date count as one practice date. Class plans use that class's practice; career plans use their discipline; named habit plans use their training family.
- Requests still require explicit acceptance. Acceptance and checklists expire at the boundary. Earlier activity, rewards, class history, and Journey records remain saved. The next period requires taking the request again.
- S/SS/SSS achievements retain prior preparation requirements of 56/84/168 days and 24/36/72 practice dates across history at completion. Their monthly outcome, current-month practice, and acceptance are separate and expire normally. Independent assessment remains part of the named outcome. One-time achievements stay one-time.
- Older persistent requests are assigned to their original acceptance period during migration. Their checklist is retained in that period; an expired period is not silently accepted into the current one. Existing completions are assigned request groups without changing earned XP, gold, rank, or stats.

Daily/weekly/monthly rank ceilings remain C/A/SSS. Cadence reward multipliers remain 1×/4×/18×, and guild rank prices retain the 2.5× promotion curve.

The four-account 30-day simulation was rerun over the fictional **1 February–2 March 2027** window, including the February boundary. Totals remain:

| Routine      | Day 7 XP / rank | Day 30 XP / rank | Day 30 gold |
| ------------ | --------------: | ---------------: | ----------: |
| Light        |         550 / F |        3,200 / E |         640 |
| Moderate     |       2,695 / E |       17,550 / D |       3,510 |
| Intensive    |       7,760 / E |       45,260 / C |       9,052 |
| Intermittent |         475 / F |        2,225 / F |         445 |

The moderate rate projects A (Gold) at 276 days, about nine months. This estimate describes those scheduled activities; choosing other goals changes earnings. [Results, schedules, and action logs](balance-1.7/simulation-results.json) · [Daily CSV](balance-1.7/daily-progress.csv). `npm run simulate:balance` regenerates the current data. The older 1.6 report and snapshots remain historical records.

## World and stages

| Region           | Town       | Field / wilds / dungeon                             |
| ---------------- | ---------- | --------------------------------------------------- |
| Mossfall Woods   | Alderhaven | Briar Road / Willowmere Grove / Rootbound Barrow    |
| Stonepass Quarry | Brassford  | Stonepass Road / Echoing Mine / Deepforge Works     |
| Ember Ruins      | Embermere  | Ash Gardens / Fallen Archive / Ember Vault          |
| Stormridge       | Greywatch  | Windward Pass / Cloudbreak Plateau / Skywatch Tower |
| Blackthorn March | Greywatch  | Briar Fields / Broken Ramparts / Blackthorn Keep    |
| Amber Coast      | Tidecross  | Pearlstrand / Gullwatch Cliffs / Drowned Palace     |
| Lantern Fen      | Tidecross  | Lantern Causeway / Reedwater Isles / Sunken Cistern |
| Frostmarch       | Frostholm  | Whitepine Trail / Blueglass Cavern / Winter Citadel |

There are **24 places and 96 stage battles**. Each place has four stages; earlier stages and places gate later access. The original region encounter IDs and companion unlocks are retained for existing saves. Clear a place's stages to unlock repeatable exploration there. Regions have their own monsters, material pools, environments, and guild destinations; dungeon battle scenes use interior palettes.

Exploration can produce a monster encounter, resource gathering, a gold cache, a landmark with a material, or a roaming boss. Findings are saved immediately. Battles require claiming victory before loot and kill credit are settled. Each battle pays once; repeat encounters remain available. These rewards supply the adventure wallet and inventory, with no direct real-world XP or base-stat gain.

Seven companions are available across progression: Mira, Orin, Lyra, Gideon, Nessa, Toma, and Elara. A party contains the player and up to two companions. Later recruits add barriers, armor piercing, and taunt alongside the existing healing, physical, ranged, and magic roles. Active class signatures and learned combat skills remain usable.

## Boss and ambush probabilities

Each place keeps its own exploration, deferral, pending-boss, and victory records. Travel and reload preserve them.

| Place type | Base boss chance | Increase per unsuccessful exploration | Guarantee after unsuccessful explorations | Base ambush chance |
| ---------- | ---------------: | ------------------------------------: | ----------------------------------------: | -----------------: |
| Field      |               4% |                +2.5 percentage points |                                        24 |                 8% |
| Wilds      |               7% |                  +3 percentage points |                                        20 |                10% |
| Dungeon    |              10% |                  +4 percentage points |                                        16 |                14% |

Boss chance is `min(85%, base + step × unsuccessful explorations)`, with a guaranteed discovery on the next exploration once the listed unsuccessful count is reached. A discovery offers challenge or leave. Only one roaming boss is pending per place.

Leaving adds a deferral. Subsequent explorations add further deferrals and check a separate ambush probability: `min(95%, base ambush + 8 percentage points × prior deferrals)`, guaranteed at ten deferrals. An ambush gives enemies an actual opening turn. Defeating and claiming a roaming boss resets its discovery counter and danger; retreat keeps the threat nearby.

## Towns, shops, and commissions

Every town has a general store and a smith. Store stocks are independent and persisted. Alderhaven starts with **zero healing potions**; delivering six Sunleaf through its clinic commission consumes the herbs, pays gold, and adds eight potions to that store. Supply-route commissions replenish ether. Buying reduces stock. Ordinary world victories drop regional materials instead of granting a guaranteed free potion.

Thirty craftable items cover blades, staves, bows, armor, and charms across six towns. They consume local materials and gold. Smith tiers produce combat modifiers of **3 / 5 / 9 / 17 / 33**, with prices **150 / 450 / 1,350 / 4,050 / 12,150 gold**. Alderhaven is Apprentice, Brassford Journeyman, Embermere and Tidecross Adept, Greywatch Master, and Frostholm Grandmaster. Materials and item identities differ between towns. Legacy owned equipment remains equippable.

The guild posts **48 adventure commissions**: medicinal deliveries, smith materials, patrols, named-monster hunts, research materials, supply routes, dungeon clears, and roaming-boss bounties. Hunts count kills after acceptance, including the required species when named. Deliveries consume inventory. Completed dungeon bounties are one-time; recurring hunts and deliveries require fresh work/resources before they can pay again.

## Hybrid objectives

Eight real-world hybrid requests link the two modes. For example, Chapel supplies combines three Scripture-study dates with Alderhaven's herb delivery. Forge discipline combines strength practice with Brassford's ore commission. Other conditioning, study, and communication requests offer optional adventure bonuses.

**Adventure required** holds the real-world reward until the named guild commission is complete in the same period. **Adventure bonus** leaves the base reward available and adds its displayed XP/gold if the commission is completed when the reward is claimed. It cannot be added after a base-only claim. Ordinary walking, Bible study, and other real-world requests have no adventure requirement.

## Presentation and verification

Adventures uses original block-based pixel scenes and sprites, the bundled Pixelify Sans font, and blue command windows. Real-world guild pages retain parchment cards and the timber board. Sample screenshots include scripted discoveries and unlocked late-game fixtures for illustration.

The world geography and working town descriptions support exploration now. A longer authored narrative and deeper encounter/economy balancing remain future design work. Combat worlds, resource stock, and difficulty curves are game rules rather than claims about real-world improvement.

[New screenshots](screenshots/README.md) · [Verification](verification-1.7.md)
