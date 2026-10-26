# Version 1.17.0 — primary saves and career work

## P05 — primary-save migration

The app now saves its primary character in IndexedDB. Completions, Journey events, archived journal entries, assessment history, exams, login rewards, credentials and skill purchases are separated into chunks of 100 entries. Other character fields live in a smaller core record. A normal name/preference change writes the core; adding a result rewrites the affected history chunk rather than the entire history.

- The primary metadata and changed history chunks commit in one transaction, requesting strict durability. Success receipts and reward/profile/restore confirmations wait for that commit. The interface can show pending changes with **Saving…** while the transaction runs.
- Writes are serialized. If one fails, dependent pending changes are discarded and the view returns to its last committed character. A persistent error identifies the failure. Earlier acknowledged progress stays saved; repeat the failed action after resolving the problem.
- Mental exam start/finish waits for save receipts. A failed submission keeps the answers available for retry. Checklist selection also recovers its committed state on failure.
- Incomplete histories and impossible metadata lengths are rejected before allocating chunk reads; restoring a valid backup replaces them safely.
- Revision checks reject stale-window writes instead of overwriting progress saved by another Guild window. Reload the stale window before continuing.
- On upgrade, a valid legacy `the-guild.character.v1` save is migrated. Its source is removed only after the new primary transaction commits. A failed migration keeps the original and offers recovery/export. An explicit empty primary record prevents an earlier localStorage copy from resurrecting after a reset.
- File import now allows **25 MB** instead of 5 MB. A six-megabyte browser fixture imports, records a subsequent profile change, reloads and exports with its history intact.
- The existing three daily/two pre-replacement recovery copies remain independent of the primary database. Restoring or starting over waits for pending saves, then preserves the current record before replacement. Export and cloud upload wait for outstanding saves and use the committed character.
- The damaged-save export retains the raw primary metadata/history for recovery analysis. That raw diagnostic export is separate from a normal importable character backup.

The primary database is `the-guild.primary.v1`; the character schema and package identity are unchanged. Loading still reconstructs a character in memory, and validation and progression/report calculations still scan histories. Chunked writes remove whole-character synchronous localStorage commits, not every long-history bottleneck. Exports, cloud packaging and the emergency local recovery fallback still serialize character data when used. Clearing app data or uninstalling can remove device copies; keep separate file backups.

## P07 — first career pass

**Skills & Stats → Profession & credentials → Career work record** collects the optional **Completed work / outcome** already entered on completed profession and vocation requests. It retains their recorded profession, discipline, vocation, date, duration and item count. Switch between the current discipline and all disciplines. The screen shows the latest 20 matching entries; **Export work record** includes every recorded career outcome in a text file. Entries without an outcome and universal work are excluded. These are self-reported work samples, separate from certifications. No additional writing is required.

The current profession/vocation also supplies a **Next work sample** brief from its existing project guidance. All twenty maintained career disciplines can contribute work records.

Two learned career competencies now have information uses in Adventures:

| Competency | Learned skill that unlocks it | Use |
| --- | --- | --- |
| Quartermaster’s Ledger | Question Framing or Spreadsheet Craft: Primer | Current-town potion/ether stock, restocking commissions, required materials and currently reachable gathering routes |
| Warden’s Diagnostics | System Foundations or Command Line: Primer | Next accessible stage’s enemy HP, attack, defense and known shell/heavy-attack/cleave patterns |

The selected-skill panel identifies these uses. Ownership is required; merely choosing a profession or planning a skill does not unlock them. Learned utilities stay available after changing professions. Diagnostics uses the same enemy builder as actual battle. Reading reports does not change XP, stats, gold, supplies, HP/MP, boss odds or stage progress.

This is a first pass for Business & Analysis and Computing & Networks. Broader profession-specific adventure uses, evidence links, editable work records and deeper career guidance remain P07 work.

## Retained behavior

The Guild Card, manual request acceptance, reward/rank curves, class trials/exams, durable skill plans and party reserves remain. HP/MP still persist between encounters and reset at local midnight. Combat grants no real-world XP or base stats.

Google/Firebase setup stays deferred at the owner's request. Physical Android runtime, upgrades, reminders, keyboards, sharing and live cloud checks remain open under P05.

[Roadmap](../ROADMAP.md) · [Verification](verification-1.17.md) · [Screenshots](screenshots/README.md) · [Android download](../downloads/README.md)
