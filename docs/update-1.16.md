# Version 1.16.0 — saved plans and recovery protection

## Skill plans — P06

Goals now belong to the character. Each shared class tree, unique class focus, career tree and universal tree keeps its own goal. **Planned skills** lists them together and opens the relevant tree without changing the active combat class. Class browsing includes all eight shared archetypes and retained class focus plans.

Goals, selected trees, named styles and tree/list preferences survive a fresh browser/app session and are included in file and cloud character backups. Available legacy session goals migrate once; a cleared goal stays cleared. A learned goal shows **Goal reached** until removed. Search, map position and zoom remain temporary view controls.

Planning does not grant XP, stats or skills, spend points, change recorded purchase costs or equip another combat class. Skill and class requirements still apply.

## Device recovery — P05 first pass

- A successful save queues an asynchronous daily copy in IndexedDB. The first copy for a character/local date is retained; it is a dated checkpoint rather than a continuously updated copy.
- Restoring a character or starting a new one first preserves the exact current record. The database retains **three daily copies and two copies from before replacement**, with small summary records separate from full character payloads.
- If IndexedDB cannot preserve a replacement copy, a separate localStorage copy is attempted. If both fail, replacement stops and the current character remains intact. Ordinary progress saves are still allowed when an optional daily recovery copy fails.
- Account & backups → **Device recovery copies** lists available records. Review a copy, compare its XP, requests and goals with the current character, then confirm Restore. Registration now has **Restore a character**, including file import, even when Google setup is unavailable. The damaged-save page offers device recovery and account/cloud access.
- Payload/summary writes and pruning share an atomic transaction. Invalid recovery payloads are rejected. Available copies include measured results, skill plans and expedition reserves. A deferred daily copy keeps its captured local date if the write crosses midnight.
- The earlier local snapshot remains readable; a malformed optional snapshot is repaired after a successful primary save. Repeated reads of an unchanged earlier snapshot reuse its validation result.

These recovery copies share the app's device storage. Clearing app data or uninstalling can remove them. Exported files and cloud copies provide separate backups.

## Account/session protection

Cloud upload/download retains the starting Google UID and session generation. An account change cancels a pending operation; a stale cloud restore preview is removed. Chunk commits finish before a new backup pointer is published. A failed chunk commit leaves the published copy intact. Native logout now attempts Firebase sign-out even if the Google bridge fails.

The owner chose to **leave Google setup for later**. This build remains unconfigured for live Google/Firebase use. Automated protocol checks use SDK doubles and do not establish live sign-in, deployed rule behavior or native plugin readiness.

## Remaining work

The primary save still serializes the whole character to localStorage, and file import remains capped at 5 MB. IndexedDB recovery can store a larger copy but does not make that primary record asynchronous or guarantee that a larger copy can be restored into localStorage. P05 primary-save migration and physical Android checks remain on the roadmap. [Readiness record](readiness-1.16.md).

The Guild Card, request rewards, rank curve, assessments, class exams and midnight HP/MP recovery rules are retained.

[Roadmap](../ROADMAP.md) · [Verification](verification-1.16.md) · [Screenshots](screenshots/README.md) · [Android download](../downloads/README.md)
