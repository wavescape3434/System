# Town and preparation previews

Eight Chromium views show six new career tools on a phone, the route folio on desktop, and the town concierge during an expedition. [Gallery](../screenshots/README.md) · [Screen scans](screens.json).

The fictional sample owns all twenty utility root skills. Briar Road’s ten stages are scripted as cleared, opening Brassford. The hero has one HP and zero MP; Mira is fallen. Starting inventory has eight Sunleaf and one Softwood, with 200 gold. A real clinic commission turn-in consumes six herbs, adds 100 gold and restocks eight potions. An older receipt of 25 gold is scripted outside the thirty-day window. A local monster hunt is taken after that turn-in.

The folio has twelve lifetime explorations and one retained landmark. The Manufacturing preview selects a Woodland Blade and Armor: 300 gold and four Softwood total, with three materials missing. The Sales preview filters Softwood; Hospitality selects Brassford. The final dialog uses the real exploration action and does not restore party reserves.

These are interface fixtures, not earned personal progress or evidence of professional ability. Separate browser tests purchase a Manufacturing skill with points from completed career requests and exercise reports, exports, navigation and reserve preservation.

Capture uses America/Denver, reduced motion, 390×844 phone and 1440×1100 desktop viewports. The JSON screens horizontal overflow, uncaught page errors and axe-core 4.14 WCAG A/AA issues. These checks are not a full accessibility audit or native Android verification.

With the dev server on port 5173:

```sh
npm install --prefix /tmp/guild-ui-audit --no-save axe-core@4.14.0
node scripts/capture-town-tools.mjs
```

The script expects `/usr/bin/chromium`. Use this release’s commit when reproducing historical captures.
