# Version 1.18.0 — more profession fieldwork

Six more career disciplines now have learned field tools. Together with Business and Computing, **eight of the twenty maintained career trees** have an adventure utility.

| Discipline | Field competency | Learned skill, either option | What it does |
| --- | --- | --- | --- |
| Management & Projects | Steward’s Docket | Scope Charter / Work Breakdown: Primer | Accepted commissions, remaining requirements, turn-in readiness and report town |
| Transport & Logistics | Caravan Manifest | Flow Mapping / Inventory Accuracy: Primer | Combined accepted delivery quantities, carried materials, shortages and accessible source routes |
| Land, Agriculture & Facilities | Herbalist’s Atlas | Site Observation / Seasonal Planning: Primer | Resource filter, carried quantities, open locations and exploration readiness |
| Construction & Skilled Trades | Artisan’s Appraisal | Tool Knowledge / Measurement: Primer | Equipment-slot comparison, both gains and losses, ownership, and gold/material shortages |
| Safety & Protection | Sentinel’s Watch | Preparedness / Situation Reports: Primer | Discovery or ambush chance for the next exploration, known bosses and remaining steps to the guaranteed encounter |
| Finance & Accounting | Treasurer’s Plan | Ledger Foundations / Reconciliation: Primer | A temporary potion/ether basket, canonical shop prices, gold shortage and separate stock shortages |

## Using fieldwork

The Fieldwork desk shows **one selected learned competency**. On the normal map it starts collapsed; a skill shortcut opens the selected tool directly. The equipment appraisal also shows one selected item. The profession record lists current-discipline and retained learned tools; **All available disciplines** exposes the full eight-tool directory with its category and skill requirements.

A learned tool has a **Use** shortcut in the profession record and selected-skill panel. The shortcut opens the matching Fieldwork panel directly. During an expedition, **Fieldwork** opens a dialog; reviewing or closing it keeps the expedition in place. It is available outside battles. Normal map use still supports continuous adventures and exploration.

Reports have actions to open the relevant area, guild board or current-town shop. Viewing an area does not start a fight. From an expedition, choosing one of these destinations explicitly leaves the expedition view while retaining party reserves. Closing Fieldwork alone does not leave it.

## Rules and accuracy

- Learned ownership is required. Choosing a job title, vocation or skill goal does not unlock a tool. Earlier learned tools remain available after changing professions.
- Docket progress uses the same accepted-contract baselines and requirements as the guild board. A hunt does not receive credit for kills before acceptance. Reporting in another town is identified separately from being ready to turn in here.
- The manifest totals delivery demands before subtracting carried stock. An item carried once is not treated as enough for several simultaneous delivery needs. Routes distinguish a location being open from its exploration mode being ready.
- The atlas lists accessible areas. A newly opened route can require its stage clear before repeat exploration. It does not promise an immediate random drop or invent undiscovered regions.
- Appraisal compares the candidate against the currently equipped item in the same slot. Negative changes remain visible. Displayed modifiers apply to combat, not base stats. Owned equipment does not show another purchase requirement.
- Safety reports call the existing boss and ambush probability functions. They show the next roll and the existing pity threshold; they do not reroll, reduce risk or resolve an encounter. An encounter can occur before the guaranteed step.
- The Finance planner shares the store’s existing **20-gold potion / 25-gold ether** prices. Blank, negative or fractional quantities are rejected. Budget and stock are checked separately. Planning does not purchase anything; the normal shop performs each purchase. Basket quantities are temporary view state.

Reading or filtering tools does not award XP, base stats, gold, items, healing or free quest completion. Existing rewards, ranks, skill costs, combat effects and local-midnight HP/MP recovery remain. The character schema is unchanged; no new migration is needed for these derived tools.

## Remaining scope

Twelve career disciplines still need field utilities. Their profession/vocation requests, twenty-tree progression and career work records remain available. P07 remains in progress; deeper career utility effects and later profession coverage are separate work. P08 economy balancing remains planned.

Google/Firebase setup stays deferred. Physical Android storage/lifecycle, upgrades, reminders, keyboards, sharing and live service checks remain open under P05.

[Roadmap](../ROADMAP.md) · [Verification](verification-1.18.md) · [Screenshots](screenshots/README.md) · [Android download](../downloads/README.md)
