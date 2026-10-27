# Service profession previews

Eight Chromium views show six new tools at phone size, battle preparation at desktop size and recovery projections inside expedition Fieldwork. [Gallery](../screenshots/README.md) · [Scan results](screens.json).

The scripted sample owns all fourteen utility prerequisite root skills. Nine Briar Road stages are cleared; the guardian is next. Its inventory has eight Sunleaf and an accepted Alderhaven clinic-supply commission. Journal fixtures record a herb find, a monster encounter and a Softwood cache. Separate lifetime counters contain twelve Forest Slime and four Briar Wolf defeats. These are fictional interface fixtures, not earned user progress.

The hero is five HP and two MP below maximum; Mira is fallen. This makes item caps, unavailable actors and midnight recovery visible. The route preview targets Deepforge Works; the companion preview shows Orin’s guardian prerequisite. The final dialog uses the real exploration function after scripting the route clear, retaining the party’s saved reserves.

Capture uses America/Denver, reduced motion, 390×844 phone and 1440×1100 desktop viewports. The eight views have no horizontal overflow, uncaught page errors or axe-core 4.14 WCAG A/AA flags. This is a screen-level check, not a full accessibility audit or native Android runtime test.

With the dev server on port 5173:

```sh
npm install --prefix /tmp/guild-ui-audit --no-save axe-core@4.14.0
node scripts/capture-service-tools.mjs
```

The script requires `/usr/bin/chromium`. It writes images under `docs/screenshots/` and scan JSON here. Use this release’s commit when reproducing historical previews.
