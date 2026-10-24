# Assessment and progression audit — 1.5.0

Reviewed 24 October 2026. This document separates published measurements from game balance. Reference values are available in the app under **Help → Assessment & training sources**, and scored published measurements link to their source. Version 1.5 retains the physical reference models introduced in 1.4, replaces the fixed mental questions, and adds milestone examinations. [Detailed update rules](docs/update-1.5.md).

## Findings from the previous assessment

The previous starting formulas were hand-tuned, capped at 30, and did not use age or sex. Time spent reading, praying, or talking was treated as evidence of INT, WIS, or CHA. Those quantities describe exposure or habits; they do not establish comprehension, judgment, or communication. Squat working load without a clearly specified lift, technique, and repetition protocol could not supply a defensible strength comparison. Walking duration described activity, rather than capacity. Blank fields were effectively scored as no practice.

These formulas are retained only to read older saves. New registration uses the replacement assessment. Existing characters keep their earned stats and can record new checks in Settings. Saving a check does not automatically increase game stats. A separate, confirmed recalibration changes the starting baseline while retaining earned points.

## What 10 means

For a measured result, `stat = max(1, round(10 × result / reference))`. There is no configured upper limit. A result equal to its reference scores 10. An unknown result stays at 10 with an **Unassessed** label; an entered zero is a measured result and scores 1.

When a reference is a published mean, this centers the index on that sample's mean, with small rounding/floor effects. It does **not** establish that every country's population, every test variant, or the entire six-stat distribution has an observed mean of exactly 10. Provisional references are explicitly labeled. No honest calibration can establish population means for three newly authored five-question quizzes before collecting validation data.

Examples for the provisional floor-pushup reference of 20:

| Controlled floor pushups |   Starting STR |
| ------------------------ | -------------: |
| Blank                    | 10, unassessed |
| 0                        |              1 |
| 10                       |              5 |
| 20                       |             10 |
| 30                       |             15 |
| 40                       |             20 |
| 100                      |             50 |

A stat is a game index, not kilograms, an IQ score, a percentile, or a medical assessment. It should not be used to compare the moral worth or overall ability of people.

## Physical measures

| Stat / option              | Protocol and reference                                                                                                                                                   | Decision                                                                                                                                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| STR / pushups, no gym      | Controlled repetitions to a consistent stopping point; retain the same variation and range. Floor 20, knee 15, incline 15, wall 20 are game anchors.                     | **Provisional.** Pushups primarily measure local muscular endurance and are influenced by body size and technique. Variants are not interchangeable.                                                                                                                                                |
| STR / chair stand, no gym  | Stable 45 cm armless chair against a wall, arms crossed; stand fully and sit under control for 30 seconds. Short practice, then mean of two trials with 60 seconds rest. | **Published sample mean: 33.0 repetitions, SD 5.4, ages 18–35**, sexes pooled. Lein et al. recruited 81 campus volunteers; this is not a national average. Assisted variants or other ages use a provisional anchor of 15.                                                                          |
| STR / bench press, weights | Recent controlled 4–10 repetition set; estimated 1RM `load / (1.0278 − 0.0278 × reps)`, divided by body mass.                                                            | **Provisional reference: 0.75 × body mass.** Brzycki estimation does not supply a population average. No maximal attempt is required. Squat and bench norms must not be mixed.                                                                                                                      |
| STR / grip, dynamometer    | Three efforts per hand with rest; retain the maximum, consistent posture/device/handle setting.                                                                          | **Published age/sex means**, Dodds et al., Table 2. Ages 20–90; linearly interpolate between five-year table ages and label that approximation. No extrapolation. A grip test measures grip strength, not the entire body.                                                                          |
| DEX / one-leg stance       | Eyes open, hands on hips, near stable support; best of three, maximum 45 seconds per attempt.                                                                            | **Provisional reference: 30 seconds.** Static balance is only one component of coordination. The test has a ceiling even though game DEX can grow without a cap. Springer age-group norms are relevant literature, but their numerical tables were not verified here and are not silently inserted. |
| CON / six-minute walk      | Flat measured course; walk for six minutes and record distance. Keep the same course and turn pattern for repeat checks.                                                 | **Age/sex/height/mass prediction where supported**, described below. Otherwise provisional 550 m. Distance is capacity evidence; minutes habitually walked are not.                                                                                                                                 |

A dynamometer is optional. Users can register at home using pushups or a chair, balance, and a measured walk; no gym or paid equipment is required. A user may skip any test. Use the same protocol when comparing their own later results. Scores from different strength methods are approximate game alternatives, not demonstrated equivalent measurements.

### Verified grip means

Dodds et al. combined **60,803 observations from 49,964 participants in 12 British studies**. These are the Table 2 **means**, not the rounded 50th-percentile values. Source: [PLOS One, 2014](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0113637), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Numerical table entries are attributed to the authors; the app interpolates between these ages.

| Age | Male mean kg | Female mean kg |
| --- | -----------: | -------------: |
| 20  |         41.5 |           28.4 |
| 25  |         48.8 |           30.6 |
| 30  |         51.6 |           31.4 |
| 35  |         51.6 |           31.3 |
| 40  |         50.3 |           30.7 |
| 45  |         48.8 |           29.9 |
| 50  |         47.6 |           28.7 |
| 55  |         46.2 |           27.5 |
| 60  |         44.6 |           26.5 |
| 65  |         42.3 |           25.3 |
| 70  |         39.1 |           23.5 |
| 75  |         35.6 |           21.4 |
| 80  |         32.2 |           19.1 |
| 85  |         28.5 |           16.6 |
| 90  |         24.7 |           14.2 |

These cohorts support a British reference, not a claim of worldwide representativeness. Sex is the reference category used in the source data; unspecified groups receive an explicitly provisional fallback.

### Walking equations and limitations

For ages **40–80**, [Enright & Sherrill (1998)](https://pubmed.ncbi.nlm.nih.gov/9817683/) studied **117 men and 173 women**, not 117 adults total. The original abstract was retrieved through NCBI BioC and checked for the equations, age range, sample, and medians:

- Male prediction: `7.57 × height_cm − 5.02 × age − 1.76 × mass_kg − 309` metres.
- Female prediction: `2.11 × height_cm − 2.29 × mass_kg − 5.78 × age + 667` metres.
- Sample median: male **576 m**, female **494 m**. Medians are not substituted for person-specific predicted means.
- The models explain about 40% of variance. They cannot establish a clinical diagnosis or globally precise conditioning score. The app additionally rejects extreme inputs and nonpositive predictions rather than using them as tiny denominators.

For ages **22–39**, [Cazzoletti et al. (2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8985335/) provides a younger-adult reference from a general-population sample of 530 healthy Italian adults. Table 5's equivalent uncentered equations use age, age squared, height, mass, activity, and an age–height interaction for males. The app uses the cohort's sex-specific average activity fraction (0.461 male, 0.415 female), an explicit game approximation to a cohort-average activity reference. It accepts only height/mass inside that sample's reported sex-specific ranges. The sample was European and the authors caution against extrapolating to other populations. No ethnicity is inferred from an account.

Example: male age 30, 175 cm, 75 kg gives about **623 m**, which maps to CON 10. Male age 60, 170 cm, 75 kg gives **544.7 m** under Enright–Sherrill; that distance also maps to 10. Reference-model changes at age 40 can cause a discontinuity. This is another reason to retain raw repeated results and baseline corrections separately from earned game stats.

At ages 18–21, over 80, with unsupported dimensions, or with missing reference inputs, the app uses a visibly provisional 550 m anchor. Weight-adjusted equations may also make poor absolute performance look normal for a heavier person; raw distance stays visible. None of these equations is an exercise prescription.

### Values deliberately not mislabeled as averages

The [Mayo Clinic fitness assessment](https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/fitness/art-20046433) calls these **good-fitness targets**:

| Age | Female pushups | Male pushups | Female 1.5-mile run, min | Male 1.5-mile run, min |
| --- | -------------: | -----------: | -----------------------: | ---------------------: |
| 25  |             20 |           28 |                       13 |                     11 |
| 35  |             19 |           21 |                     13.5 |                   11.5 |
| 45  |             14 |           16 |                       14 |                     12 |
| 55  |             10 |           12 |                       16 |                     13 |
| 65  |             10 |           10 |                     17.5 |                     14 |

They are useful training context, but do not establish population means or equivalent pushup variations. They are not used to claim average-10 calibration.

Similarly, [CDC STEADI chair-stand cutoffs](https://www.cdc.gov/steadi/media/pdfs/STEADI-Assessment-30Sec-508.pdf) identify **below-average scores / falls risk**, rather than reporting means: male/female lower cutoffs are 14/12 at 60–64, 12/11 at 65–69, 12/10 at 70–74, 11/10 at 75–79, 10/9 at 80–84, 8/8 at 85–89, and 7/4 at 90–94. Those values must not be scored as the average. Its approximately 43 cm chair protocol also differs from the 45 cm young-adult study.

## INT, WIS, CHA checks

Each check has five questions, takes approximately 2–4 minutes, and shows a review explaining answers afterward. No questions are displayed until Start. Each attribute has 24 scenario sets before case patterns recur, with recorded form IDs preventing immediate reuse across registration, reevaluation, and class exams. Started but abandoned forms also count as seen. None includes Bible verses.

| Attribute | Check                                                                                                                                            | Useful information / limitation                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| INT       | Numerical reasoning, learning a rule, identifying patterns, checking a calculation, and drawing supported conclusions in varied guild scenarios. | Samples immediate learning and reasoning. Reading comprehension, language, prior familiarity, and repetition affect results. It is not an IQ test. |
| WIS       | Evaluate evidence, distinguish observation from assumption, revise a plan, choose a useful check, and recognize uncertainty.                     | Samples practical judgment choices. It does not measure faithfulness, holiness, or wisdom in every situation.                                      |
| CHA       | Summarize another person's concern, ask open questions, seek agreement, and make clear requests in varied social situations.                     | Samples knowledge of communication choices. It cannot establish real conversational behavior, charisma, or personality.                            |

The provisional anchor is **3/5 → 10**; 4/5 → 13; 5/5 → 17. Original questions have no published normative dataset or demonstrated equivalence between forms. A high quiz score does not substitute for measured physical results when assigning exceptional rank. Varying cases reduces immediate question repetition but does not eliminate familiarity effects. Broader progress should come from applied objectives with retrieval, feedback, and review; the saved check is supporting evidence, not a validated global trait estimate. Christian study remains an objective category outside the assessment.

## Request difficulty and rewards

Request rank describes the work, independently of the adventurer's guild rank. These prices are a game rubric, not values derived from physiology or a claim that one person improves 12 times as much as another.

| Rank | Player XP | Intended scope                                                                  |
| ---- | --------: | ------------------------------------------------------------------------------- |
| F    |        10 | Menial or introductory action                                                   |
| E    |        25 | Short practice with a clear outcome                                             |
| D    |        60 | Complete focused practice session                                               |
| C    |       150 | Substantial practice, application, or larger workload                           |
| B    |       350 | Demanding project or higher physical workload                                   |
| A    |       800 | Major assessed milestone / advanced workload                                    |
| S    |     1,800 | Exceptional workload or independently assessed substantial achievement          |
| SS   |     4,200 | Advanced assessed standard plus at least 12 weeks and 36 dated practice days    |
| SSS  |    10,000 | Rare external expert standard plus at least 24 weeks and 72 dated practice days |

**Floor pushups 3 × 20: C, 150 XP. Strict pullups 5 × 20: S, 1,800 XP.** The latter requires a pull-up bar, a recorded strict-pullup capacity of at least 25, and a 96-hour recovery interval. The rank reflects its much greater relative difficulty; it is not presented as a generally optimal workout. Lower-volume alternatives exist. The app cannot verify form or completion from self-report.

Equivalent movement alternatives share a group; completing one prevents another variant paying again that day. Group cooldowns also carry across variants. Old accepted requests retain their original template and price; new requests use the new rubric. High-rank strength/endurance tasks include recovery. Marathon and multiweek learning/service projects are milestones, not routine daily prescriptions. One-time SS/SSS commitments remain in Taken across calendar changes and check elapsed time plus distinct recorded practice days. Completing a checkbox alone cannot bypass these checks; the external assessment itself remains self-reported.

The expanded universal catalog covers progressive resistance, walking/running, mobility/balance and movement feedback, spaced retrieval/application, contextual Bible study and service, and listening/presentation/teamwork with feedback. Existing generic universal duplicates were removed so an old five-minute action cannot pay a higher new tier under another name. Class and career commissions remain contextual templates, not professionally individualized training plans. Relative effort varies; the current release uses fixed task tiers rather than pretending a universal clinical workload scale exists.

Evidence informing task design: [CDC adult activity guidance](https://www.cdc.gov/physical-activity-basics/guidelines/adults.html) and [WHO 2020](https://www.who.int/publications/i/item/9789240015128) support regular aerobic work, muscle strengthening, and gradual progression; [Dunlosky et al. 2013](https://doi.org/10.1177/1529100612453266) supports practice testing and distributed practice. These sources support training methods, **not the XP prices**. Christian content is based on Scripture and contextual comprehension; no clinical efficacy claim is made for game WIS.

## Player level, class levels, and stat growth

Every completed request adds its listed player XP **once**. For a universal request, relevant active classes receive 50% credit weighted by their archetype focus, and other unlocked relevant classes receive 25%. Relevant professions and the independently selected vocation receive 25% career credit. If profession and vocation use the same shared career tree, its credit is counted once. Universal points remain available for universal skills.

A new class receives 25% of relevant earlier class/universal source XP when its entry trial is completed. Its own entry-trial XP and transferred XP are retained, but it starts at class level 1. Subsequent class-specific work certifies additional levels. Ordinary class commissions certify one level's allowance; higher-tier commissions certify more. Both XP and the work allowance are required. Stored XP is shown as retained when awaiting class work. Returning to an unlocked class keeps its history and does not repeat the entry trial. Career levels likewise require career work, so universal credit does not replace professional practice.

Player levels and class levels are displayed separately. A player can be level 30 and begin a new Paladin path at class level 1, then certify its level progression using retained XP and Paladin work. Fractional credit does not manufacture additional player XP or multiple copies of combat point income.

Cumulative XP for level L remains `round(B × ((L−1) + 0.15 × (L−1)²))`, with B=250 for player levels and B=100 for class/profession levels. There is no configured ceiling. Harder work gives more XP; ordinary work remains useful but advances more slowly.

Base stats increase only at class/profession milestones or explicit special weekly/monthly rewards. Every fifth level grants increasing points: **2 at 5, 3 at 10, 4 at 15, …**. That totals 65 points by level 50 and 230 by level 100. Class focus distributes its points automatically; profession focus determines its attribute. Equipment, purchases, signatures, class stances, and battles do not grant base stats. Combat effects remain combat modifiers.

For new progress in 1.5, each five-level class/profession milestone is held until a passed improvement exam, after XP and relevant work qualify. Physical checks require at least 5% improvement and one whole additional recorded unit for increasing metrics; lower-is-better times require a 5% reduction. Mental checks require at least 4/5 and improved accuracy, or maintained accuracy with 5% less recorded time. An alternate repeatable work sample is available. A new protocol first records a baseline, and its comparison must occur on a later local calendar day. These thresholds are game rules, not validated minimum detectable changes or proof of real-world trait growth. Previous earned levels are preserved. Full protocols and limitations are in the [update notes](docs/update-1.5.md).

This produces faster game growth from repeated evidence-informed practice, without asserting that +10 STR predicts a particular extra load. Actual performance checks retain raw repetitions, force, time, distance, and quiz answers beside the game stats. A nominal game increase can be rewarding without fabricating a measured real-world improvement. Old levels, earned attributes, purchases, and accepted commitments are preserved by a one-time migration snapshot.

Ordinary assessment results begin at F. Starting placement is capped at D. In addition to retained legacy benchmark routes, the new E route requires mean 14+, STR22+, CON12+, DEX12+, and two mental checks at12+. D requires mean18+, STR32+, CON14+, DEX13+, and all mental checks14+. These are demanding **game placement rules**, not validated population percentiles. They allow exceptional placement without requiring impossible scores from a five-question test or a timed test's ceiling.

## Settings and verification

Settings now persists name, metric/imperial display, text size, reduced motion, opening screen, available equipment, and visibility of requests with unmet requirements. It also holds performance checks, history, explicit baseline recalibration, and account/backups. Unit conversion affects display; stored physical values stay in canonical metric units.

The automated suite covers scoring, age/reference boundaries, malformed saves, task prices, equipment/capacity/cooldown gates, class trials and transfer, profession/vocation credit, mastery gates, migration, one-time commitments, and browser workflows. Screenshots use a sample character. A compiled, signature-verified Android build does not establish physical-device or Google sign-in testing.

Remaining measurement limitations are explicit: no verified population means for pushup variants, bench estimates, the current balance anchor, or the original mental checks; sample-specific rather than worldwide norms; self-reported performance and credentials; no demonstrated conversion from an RPG stat gain to real-world physiological change. Resolving those limits requires validated reference data or real validation studies, not additional decimal places in a formula.
