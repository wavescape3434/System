# Profession fieldwork previews

Eight Chromium views show the new commission docket, delivery manifest, resource atlas, item appraisal, danger watch, spending plan, competency directory and expedition dialog. [Gallery](../screenshots/README.md) · [Scan results](screens.json).

The sample character explicitly owns the eight prerequisite root skills. It has 100 gold, a Woodland Blade, four Sunleaf and one Softwood. Three adventure commissions are accepted; six recorded kills meet one hunt's requirement. Briar Road and Willowmere Grove are scripted as cleared. Briar Road's known boss is at the ambush guarantee. The spending-plan preview requests two potions and one ether while potion stock is empty. For the final dialog view, an actual exploration function creates a gathering event after the known boss flag is reset.

These fixtures illustrate the interface. They do not establish real-world practice, legitimate skill purchases or actual player progression. Separate browser tests purchase a Finance skill through the tree, verify report data/actions, retain tools after a career change, trigger the real ambush and close Fieldwork without ending an expedition.

The capture uses America/Denver, reduced motion, 390×844 phone and 1440×1100 desktop viewports. It screens horizontal overflow, uncaught page errors and axe-core WCAG A/AA rules on the eight views. This is not a complete accessibility audit or a physical Android check.

With the dev server on port 5173:

```sh
npm install --prefix /tmp/guild-ui-audit --no-save axe-core@4.14.0
node scripts/capture-profession-tools.mjs
```

The script expects `/usr/bin/chromium` and writes the images to `docs/screenshots/` and the scan JSON here. Historical release capture scripts should be run against their release commit; the current one above uses the single-tool interface.
