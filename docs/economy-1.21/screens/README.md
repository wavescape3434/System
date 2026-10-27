# Supply interface previews

Eight Chromium views cover the Supplies dialog at desktop and phone sizes, a fallen target, batch shopping, a CHA seal, the delivery material trade-off and Supplies during an expedition. [Gallery](../../screenshots/README.md) · [Scan results](scans.json).

The fictional sample has 500 gold, six Softwood, three potions and one ether. Alderhaven has eight potions and six ethers in stock. Its hero is 45 HP and 12 MP below maximum; Mira is fallen. A smith delivery is already accepted. The batch preview requests three potions without purchasing them. The affected-recipe section shows six alternatives that each need two Softwood. Delivering five would leave only one.

For the expedition view, the fixture scripts Briar Road as cleared and invokes the real exploration function. No supply is consumed during capture. Separate browser workflows verify actual spending/recovery, persistence, batch purchases, delivery consumption, seal forging/equipping and save-failure rollback.

The capture uses America/Denver, reduced motion, 390×844 phone and 1440×1100 desktop viewports. All eight final views have no horizontal overflow, uncaught page errors or axe-core 4.14 WCAG A/AA flags. Visual review corrected inherited light text on parchment. These are screen-level checks, not a complete accessibility audit or native Android testing.

With the dev server on port 5173:

```sh
npm install --prefix /tmp/guild-ui-audit --no-save axe-core@4.14.0
node scripts/capture-supply-economy.mjs
```

The script expects `/usr/bin/chromium`. Use this release’s commit to reproduce historical captures.
