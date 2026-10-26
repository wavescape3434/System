# Board and constellation screen checks

Browser fixtures use the sample character at **390 × 844** and **1600 × 1100**, with reduced motion and **America/Denver** time. They cover the universal board hall, Wisdom requests, the full Fighter constellation, Spearcraft and its alternate prerequisites in the selected-skill panel, universal skill paths, and the shared career tree. The sample has no earned combat skills or training points; locked nodes are expected.

The full constellations are captured with **Fit** for an overview. Normal entry centers approachable nodes at a readable scale. Style filters, zoom controls, pinch/pan and the searchable list provide closer inspection.

`node scripts/capture-atlas-previews.mjs` captures the fixtures against Vite on port 5173. It uses `/usr/bin/chromium` and axe-core 4.14 from `/tmp/guild-ui-audit/node_modules/axe-core/axe.min.js`. Update those paths on another machine. Automated WCAG A/AA screening is limited to these fixtures and does not certify native accessibility.

[Screen evidence](screens.json) · [Gallery](../screenshots/README.md)
