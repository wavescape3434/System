# Verification of the annual scenario study

The published dataset contains **32 primary fictional customers and three matched alternatives**, each with 365 days and five checkpoints. All 35 runs use the same app version, source fingerprint and declared scenario inputs.

| Check | Result |
| --- | --- |
| Profession coverage | 32 distinct starting titles / all 20 categories |
| Vocation coverage | All 25 selectable vocations |
| Observed class coverage | 28 / 51; all eight Basic classes plus Monk at registration |
| Learned field-tool coverage | All 20 category utilities available somewhere in the cohort |
| Daily observations | 12,775, with complete CSV rows |
| Daily gold/time-budget assertions | 12,775 each, passed |
| Weekly/checkpoint JSON round trips | 56 per scenario; 3,920 schema-validation calls before/after round trips |
| Completed requests | 23,315 |
| Repeated-payout probes | 479, all rejected |
| Ordinary encounters | 5,543 wins; 0 defeats; 0 action-bound cases |
| Adventure progression invariant | Player XP and base stats unchanged by each Adventure session |
| Matched no-Adventures check | Maya's five real-world progression checkpoints match exactly |
| Independent repeatability replay | Leila's 365-day case JSON and daily CSV are byte-identical |
| Final supplied character fixtures | Seven, all schema-validated; future-dated inspection records |
| Production source / APK | Unchanged from app 1.25.0 |

The supplementary probes reproduce **one class-scope defect**, **20 role/category-versus-request stat differences to review**, cross-category vocation credit, bounded-rubric behavior and remaining points in seven saved accounts. Finding those issues is part of the result; this is not a claim that the app has no defects.

Both standalone report figures were visually inspected. All local Markdown file links in the report, profile pages, repository README and roadmap resolve. Script syntax checks pass. The published machine-readable [verification record](verification.json), [repeatability hashes](repeatability.json), [source hashes](results.json) and [mechanics probes](mechanics-probes.json) provide the underlying evidence.

The run does not constitute a new Android device, notification, native storage, Google-service, UI usability, retention or real-world efficacy test. The [1.25 release verification](../verification-1.25.md) records the app's existing automated/browser/build checks; this task adds scenario evidence without changing its code.

[Methods](METHOD.md) · [Findings](PRIORITIES.md) · [Profiles](CUSTOMERS.md).
