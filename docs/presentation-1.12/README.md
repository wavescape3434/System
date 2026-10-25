# Presentation checks — version 1.12

Nine browser fixtures cover the phone Guild, compact request board, parchment commission at the top and bottom, current-stage area panel, desktop board/commission/map, and the tenth-stage guardian. All use the sample character. The guardian fixture seeds nine earlier clears; it does not represent earned personal progress.

Captured at **390 × 844** and **1440 × 1100** with bundled fonts, reduced motion and **America/Denver** time. Every captured view has no horizontal page/dialog overflow, no uncaught page errors, and no flagged issues in the axe-core 4.14 WCAG A/AA scan. The board exposes all six attribute icon types. Each map fixture contains one current-stage panel. This is limited automated screening of these fixtures, not a native accessibility certification.

The visual pass also corrected faint utility text on the Guild, desktop filters, selected map areas and adventure tabs. The Guild Card keeps its existing palette.

Run `node scripts/capture-presentation-previews.mjs` against Vite on port 5173. The script uses Chromium and reads axe-core from `/tmp/guild-ui-audit/node_modules/axe-core/axe.min.js`; install it there or adjust that path on another machine.

[Machine-readable screen evidence](screens.json) · [Screenshot gallery](../screenshots/README.md)
