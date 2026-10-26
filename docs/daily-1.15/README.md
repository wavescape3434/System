# Daily-flow preview evidence

Seven views use a fictional sample character and scripted walking history. The screenshots illustrate interface behavior and recorded values, not measured user outcomes. [Scan output](screens.json) · [Gallery](../screenshots/README.md).

The capture script uses the actual request acceptance/submission UI and displays the resulting Journey charts. It also takes the party through a battle before showing reserves, then uses a depleted fixture to screen the exhausted-party view.

Reproduce with Vite on port 5173, Chromium at `/usr/bin/chromium`, and axe-core 4.14 available at `/tmp/guild-ui-audit/node_modules/axe-core/axe.min.js`:

```sh
node scripts/capture-daily-previews.mjs
```

Every captured view is checked for page errors, horizontal overflow and axe-core WCAG A/AA findings. A clean scan is limited to the captured states; physical Android testing remains separate.
