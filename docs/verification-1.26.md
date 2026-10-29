# Verification — 1.26.0

## App rules and workflows

- **340 unit checks across 31 files.** Includes a 35-floor-pushup regression, 96 v2 recipe combinations and retained v1 recipes, independent movement setup validation, latest assessment versus older exam precedence, all twenty career categories and twenty-five vocations, all 51 class commission owners, grade-family duplicate prevention, mile protocol validation, independent enumeration of a logic item, old quiz scoring, and new-family exam baselines/mastery isolation.
- **132 browser workflows verified across the full run and targeted reruns.** The full pass had 124 successes and eight failures. After correcting changed units/instruction expectations, sticky-overlay/preview reload interference and deterministic clock/fixture setup, six passed in the eight-case rerun and the final two passed in a separate fifteen-second run. This is not described as a single clean 132-case run. The four new workflows cover imperial mile entry/hidden questions, assessed harder pushing with independent movements and reload, retained challenging healthcare subject work, and a spoken CHA trial with timer without automatic microphone access.
- **90 thirty-day software ledgers / 2,700 account-days.** All twenty career categories and twenty-five vocations have an F and C scenario. Selection, acceptance, results and XP use actual APIs; all 2,700 duplicate attempts are refused, all 2,700 save roundtrips validate, and the declared no-exam/no-special-reward routine leaves base stats unchanged. Six additional capacity fixtures cover 0–60 floor pushups. These are synthetic inputs, not observed improvement or comprehensive yearly balance. [Raw outputs and source hashes](proficiency-1.26/ledger-results.json).
- **Six phone/desktop screen scans** have no horizontal overflow, uncaught page errors or axe-core WCAG A/AA findings. Mile entry, logic, communication, experienced regimen and proficiency views were visually inspected. This is a scoped screen check, not a complete accessibility audit. [Screens and scans](proficiency-1.26/README.md#screens).

Strict TypeScript and Vite production builds pass. The dev server now ignores native Android output directories: Capacitor's copied HTML previously triggered unrelated preview reloads during simultaneous native builds. Native build, source formatting, JSON/source-fingerprint and Markdown-target checks are recorded with the release.

## Android artifact

| Field | Verified value |
| --- | --- |
| Package | `com.theguild.personal` |
| Version / code | **1.26.0 / 28** |
| Minimum / target Android API | **24 / 36** |
| Download size | **14,126,871 bytes** |
| APK SHA-256 | `a36a4dcb118620cd2a9541546da6ea661b1470d794538dee2bc49195086ea2a0` |
| Signing certificate SHA-256 | `f6c745055e1d566d935ce766c749393e4936eca36f7e1d85c26d5176a65181e5` |
| Packaged web files | All **38** production files match; two generated Cordova stubs are additional |
| Primary database | `the-guild.primary.v1`, unchanged |
| Character data | Version 1; optional proficiency, mile and calibrated-recipe fields |

The APK declares audio recording for the optional explicit Record action. Browser failure handling leaves aloud practice available without a microphone. Physical Android microphone permission, WebView capture, lifecycle, installed upgrades, storage pressure, reminders, keyboard, sharing and overnight runtime still need device checks. A native compile or manifest entry does not prove recording works on a phone.

## Evidence limits

OpenStax publisher sources were freshly retrieved and read. Primary papers and guideline sites were proxy-blocked. The [research review](proficiency-1.26/RESEARCH.md) distinguishes established principles, actual source access and authored heuristics. No new mental form, one-mile anchor, proficiency cutoff or exact exercise ladder is presented as a validated population norm. Communication is a self-reviewed performed exercise, not automated speech/personality scoring.

Accepted contracts and original recipe logs remain immutable and readable. Grade changes do not issue free credentials, levels, base stats or rewards. Newly issued Network Weaver commissions have correct class ownership; historical compensating credit remains open. Google setup remains deferred. Companion-led play and local-midnight-only automatic HP/MP recovery remain.

[Changes](update-1.26.md) · [Research, ledgers and previews](proficiency-1.26/README.md) · [APK details](apk-verification-1.26.json) · [Install](../downloads/README.md) · [Roadmap](../ROADMAP.md).
