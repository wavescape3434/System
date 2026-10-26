# Saved plans and recovery previews

Seven Chromium views cover independent planned skills, a learned goal, character comparison, recovery copies, registration restore and a damaged primary save. [Gallery](../screenshots/README.md) · [Scan results](screens.json).

The fixtures use sample Rowan records. A scripted Warrior request has a 3×10 pushup result; three goals are seeded across class, career and universal trees. The learned-goal preview explicitly seeds the prerequisite skills and selected goal as learned. It illustrates the retained-goal state rather than proving a purchase or real-world improvement. Restore and new-character actions then run through the actual interface.

The browser uses America/Denver, reduced motion, 390×844 phone and 1440px desktop viewports. The registration screenshot includes the full page. All seven views report no horizontal overflow, uncaught page errors or flagged axe-core WCAG A/AA issues. This is automated screening of these views, not a complete accessibility audit or a physical Android check.

To reproduce with the dev server running on port 5173:

```sh
npm install --prefix /tmp/guild-ui-audit --no-save axe-core@4.14.0
node scripts/capture-planning-previews.mjs
```

The capture script expects `/usr/bin/chromium` and writes images into `docs/screenshots/` and the scan JSON here. Browser workflow tests separately exercise actual goal selection, fresh sessions, export, restoration and failure handling. [Verification](../verification-1.16.md).
