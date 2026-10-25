# Version 1.11.0 — daily use and progression

This update applies the [UI/UX and product review](reviews/2026-10-24/README.md) to the daily request loop, exams, skill trees, history, and backups. Existing character identity, Guild Card artwork, appearance choices, earned progress, and rank/reward balance are retained.

## Requests and Guild

- **All taken** combines accepted daily, weekly and monthly work. Guild shortcuts open that view. A cadence-specific empty page links back to other commitments, and accepted class trials remain visible.
- The phone board keeps Search visible and puts optional filters behind **Filters**. Parchment cards remain compact; pin and details buttons have separate 44-pixel hit areas. Taken/completed status is labeled.
- Search, rank/category/focus/sort settings survive navigation. Direct shortcuts deliberately open the relevant unfiltered view. Pagination now accurately labels the number added.
- A compact action strip above the unchanged Guild Card opens taken requests, ready exams/skills and the current expedition. Class Paths shows the next level, banked XP and its required action.
- Class entries distinguish active, unlocked, trial available and requirements unmet. Available entry trials are counted separately from unlocked classes.
- Request details lead with player XP and gold. **Progression credit** holds the separate class/career breakdown.

## Exams and practice

- Dialogs retain keyboard focus while typing or changing an answer. Forward/reverse Tab remain inside, background controls become inert, Escape closes the active dialog, and focus returns to the opener.
- Early milestones retain their improvement rule. After **two passed improvement milestones on the same physical protocol or repeatable work sample**, **Maintain mastery** becomes available. It requires matching or exceeding the best certified result on a later calendar day. A different protocol has its own comparison history.
- Mental mastery requires two earlier passed improvement milestones, a fresh form at least as challenging, and the best certified score (minimum 4/5). It removes the continual speed requirement. XP, class-work and milestone gates remain in effect; selecting mastery does not itself grant anything.
- The eight class archetypes now have concrete daily practice and technique instructions: controlled strength sets, conversational conditioning, safe coordination drills, retrieval practice, contextual Bible study, recorded communication practice, and tested practical builds. Hybrid classes include a shorter secondary-focus activity. Daily work remains solo.
- Boss heavy-strike rounds are labeled in combat. Enemy/ally target selections expose their selected state; ability buttons include effect descriptions.

## Skills and Journey

- Skill trees open at a readable scale centered on approachable skills, with **Available skills**, **Fit**, pinch/pan and the existing searchable list. Selected tree category, branch, mode and viewport are remembered within the session.
- Journey Reports includes raw physical performance and game-check trends from saved assessments and exams. Pushup variations, assisted chair stands, bench repetition counts, walk protocols and mental challenge levels stay separate. Units follow Settings. These charts do not change base stats or claim that game stats directly measure physical ability.
- Report points have appropriate interactive semantics and data tables. Activity-calendar hit areas are larger and the calendar scrolls inside its own panel. Secondary labels and controls have stronger contrast; this is an improvement pass, not a claim that every accessibility issue is resolved.
- Unfinished registration preserves the profile, units, recorded body results, completed mental checks and seen-form IDs on this device. An in-progress unanswered quiz starts a fresh form after reopening. Creating a character clears the draft only after a successful save.

## Performance and data

- A shared index calculates completion totals, class/profession/career credit, certification work and training gold once per immutable history revision. Cosmetic, preference and battle-only changes skip unrelated progression/Journey comparisons.
- Firebase authentication and native Google-login modules load on demand. Startup JavaScript is smaller despite the added features; final measurements are in the verification report.
- A local recovery snapshot is attempted at most once per 24 hours, after the main character save succeeds. Optional snapshot failure cannot undo a successful save. Review it in **Settings → Account & data**, or from the recovery screen if the main save is damaged. Restore requires confirmation. This stays on the same device and does not replace manual exports.
- New cloud backups use immutable bounded chunks plus a SHA-256 manifest. The latest pointer is published only after all chunks commit, so interrupted uploads leave the previous published backup intact. Missing or damaged chunks fail before replacing local data. Earlier whole-document cloud backups remain readable.
- Each cloud upload creates a generation; this update does not delete older generations automatically. A server-side retention policy and an asynchronous local history database remain future work.
- Requests taken after the usual weekly/monthly reminder window receive a fixed late-acceptance deadline reminder. Ordinary app updates cannot repeatedly postpone it. Nightly reminders retain the configured local time.

## Setup and device limits

Google login still needs the owner's Firebase/OAuth configuration. Apply the updated **firestore.rules** before using the new segmented cloud backup format. Codec/integrity behavior is tested locally; live Firebase access and deployed-rule behavior require that project. Unconfigured builds show Google sign-in as unavailable.

The Android APK is compiled and signature-verified. Native sign-in, local reminder delivery, system keyboards, sharing and installed-app upgrades still require physical-device verification. The package, signing identity and existing character storage key are unchanged.

[Verification](verification-1.11.md) · [Screenshots](screenshots/README.md) · [Download instructions](../downloads/README.md)
