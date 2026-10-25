# Version 1.8 — Guild hub, expeditions, and reminders

The Guild page now centers the existing engraved card, unfinished taken requests, a claimable daily allowance, ready examinations, and adventure/skill shortcuts. The duplicate attribute panel, bottom verse, and “Body. Mind. Heart.” footer are removed. The card links to the matching class, profession, vocation, stats, skill-tree, and rank screens. Profession and vocation levels appear alongside their names. Vocation levels use related career work and explicit vocation XP transfers; unrelated profession work does not raise them.

## Requests

Compact parchment rows show the request type, real-world/hybrid icon, name, rank or available rank range, and a details button. Expanded details contain the workload, rewards, requirements, rank selection, acceptance, and completion controls. Search, cadence/type/rank/stat filters, pins, and Taken remain available. Vocation-related practice appears under Vocation when it comes from a different discipline than the current profession. Adventure-only commissions have a crossed-swords marker in Adventures.

## Expeditions and battle

Continue adventure automatically claims the victory reward once and starts the next uncleared stage in the same place. Once all four stages are cleared, Continue exploring rolls the next encounter or discovery. Exploration results and roaming-boss choices remain in an expedition view until Return to map is selected. Expedition state survives app reloads. Returning after victory also settles any unclaimed reward; loss and retreat do not grant rewards.

Battle has an original bundled forest backdrop, revised pixel characters, a turn queue, separate party HP/MP panels, target/active-character markers, action banners, and floating damage/healing. Phone commands use a compact grid and do not cover the party HUD. Turn order still follows the actual engine: living party members, then living enemies. As before, each new encounter restores HP/MP; consumables, inventory, gold, stage progress, and boss danger persist. Further battle systems and biome artwork remain future work.

## Login rewards

One manual claim per local calendar day advances a seven-claim cycle. Missing a day pauses it. No streak resets, XP, rank credit, or base stat gains are attached to login rewards.

| Claim | Gold | Supplies |
|---|---:|---|
| 1 | 10 | 1 potion |
| 2 | 15 | 1 ether |
| 3 | 15 | 1 potion |
| 4 | 20 | 1 ether |
| 5 | 20 | 1 potion |
| 6 | 25 | 1 ether |
| 7 | 50 | 2 potions, 1 ether |

The next claim starts day 1 again. A complete cycle grants 155 gold, five potions, and four ether. Claims made during battle update both the inventory and battle item stock, so later commands retain the supplies. This is an initial adventure economy; the established real-world XP/rank pacing is unchanged.

## Notifications

The bell contains claimable login rewards, ready examinations, and unfinished weekly/monthly requests near their deadline. Completed actions remain in Journey.

Settings → General includes daily, weekly, and monthly reminder toggles and a local time, default **21:00**. Enable Android notifications once in the installed app. Daily reminders prompt submission of completed requests. Pending weekly/monthly requests receive a consolidated alert the evening before the final day: Saturday at 21:00 for a Sunday cutoff, or the penultimate calendar date at 21:00 for a month-end cutoff. At the default time this normally leaves 27 hours; daylight-saving changes can shift that interval. Completion, release, settings changes, and app resume refresh the schedule. Removing a character cancels its reminders. Accepting after an alert's scheduled time does not send a retroactive device alert; the deadline remains in the bell.

Device reminders use Capacitor Local Notifications and Android's normal notification permission. They deliberately use inexact scheduling without special alarm access; Android battery management can delay delivery. Browser previews save preferences but do not send device notifications. A physical-device permission/delivery/reboot check is still needed.

## Skill trees

Trees start fitted to their viewport. Drag to pan, pinch with two fingers to zoom around the gesture midpoint, or use +/− and Fit. A searchable Skill list offers readable node inspection and purchases without using the canvas.

Each of eight class families gains three early branches with level 1/3/7 techniques (72 additional nodes). Fighter weapon entry skills are independent one-point choices; universal entry skills now include usable combat actions. Each of the 20 profession trees has 12 maintained nodes, including three level-1 choices. Earlier shared/focus skills are cheaper and unlock sooner; advanced sections retain increasing requirements and costs. Recorded spending and learned skills remain in saves; old purchases are not repriced or refunded. Skills and equipment continue to modify adventure combat only.

Package `com.theguild.personal`, storage key `the-guild.character.v1`, and the upgrade signing certificate remain stable. Version **1.8.0**, Android version code **10**. Native Google login still needs the existing Firebase/OAuth setup.
