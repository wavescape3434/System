import type { Character } from "./domain";
import {
  ATTRIBUTES,
  CLASSES,
  SKILLS,
  stats,
  classLevel,
  professionLevel,
  characterRank,
  level,
  adventurerXP,
  objectivePeriod,
} from "./domain";
import { VOCATIONS } from "./careers";
import { campaign, ENCOUNTERS, COMPANIONS, EQUIPMENT } from "./rpg";
import { RESOURCE_NAMES } from "./world-catalog";
export type JourneyKind =
  | "class"
  | "profession"
  | "vocation"
  | "skill"
  | "unlock"
  | "level"
  | "rank"
  | "stat"
  | "adventure"
  | "companion"
  | "equipment"
  | "request";
export interface JourneyEvent {
  id: string;
  at: string;
  kind: JourneyKind;
  title: string;
  detail?: string;
  amount?: number;
  subject?: string;
}
export function recordJourney(
  previous: Character | null,
  next: Character,
  now = new Date(),
): Character {
  if (!previous || previous.id !== next.id) return next;
  // Restoring history is handled separately from recording a new action.
  if (next.completions.length < previous.completions.length) return next;
  const events: JourneyEvent[] = [];
  const add = (
    kind: JourneyKind,
    title: string,
    detail?: string,
    amount?: number,
    subject?: string,
  ) =>
    events.push({
      id: crypto.randomUUID(),
      at: now.toISOString(),
      kind,
      title,
      detail,
      amount,
      subject,
    });
  if (previous.activeClass !== next.activeClass)
    add(
      "class",
      `${CLASSES.find((p) => p.id === next.activeClass)!.name} selected`,
      `Level ${classLevel(next, next.activeClass)}`,
      undefined,
      next.activeClass,
    );
  if (previous.profession !== next.profession)
    add("profession", `Profession: ${next.profession}`);
  if (previous.vocation !== next.vocation)
    add(
      "vocation",
      next.vocation
        ? `Vocation: ${VOCATIONS.find((v) => v.id === next.vocation)?.name}`
        : "Vocation cleared",
    );
  for (const id of next.earnedSkills.filter(
    (id) => !previous.earnedSkills.includes(id) && id !== "universal-root",
  ))
    add(
      "skill",
      `${SKILLS.find((s) => s.id === id)?.name || id} learned`,
      undefined,
      1,
      id,
    );
  for (const id of (next.unlockedClasses || []).filter(
    (id) => !(previous.unlockedClasses || []).includes(id),
  )) {
    const p = CLASSES.find((p) => p.id === id);
    if (p && p.tier !== "Basic")
      add("unlock", `${p.name} unlocked`, p.tier, 1, id);
  }
  for (const p of CLASSES) {
    const a = classLevel(previous, p.id),
      b = classLevel(next, p.id);
    if (b > a)
      add(
        "level",
        `${p.name} reached level ${b}`,
        `${a} → ${b}`,
        b - a,
        `class:${p.id}`,
      );
  }
  for (const name of new Set(
    next.completions.filter((o) => o.profession).map((o) => o.profession!),
  )) {
    const a = professionLevel(previous, name),
      b = professionLevel(next, name);
    if (b > a)
      add(
        "level",
        `${name} reached level ${b}`,
        `${a} → ${b}`,
        b - a,
        `profession:${name}`,
      );
  }
  const oldLevel = level(adventurerXP(previous)),
    newLevel = level(adventurerXP(next));
  if (newLevel > oldLevel)
    add(
      "level",
      `Adventurer level ${newLevel}`,
      `${oldLevel} → ${newLevel}`,
      newLevel - oldLevel,
      "adventurer",
    );
  if (characterRank(previous).name !== characterRank(next).name)
    add(
      "rank",
      `Promoted to ${characterRank(next).name} rank`,
      `${characterRank(previous).name} → ${characterRank(next).name}`,
    );
  const before = stats(previous),
    after = stats(next);
  for (const a of ATTRIBUTES)
    if (after[a] > before[a])
      add(
        "stat",
        `${a} +${after[a] - before[a]}`,
        `${before[a]} → ${after[a]}`,
        after[a] - before[a],
        a,
      );
  const a = campaign(previous),
    b = campaign(next);
  // Continuing can settle a victory and replace its battle in a single update.
  const settled =
    a.battle?.phase === "won" &&
    !a.battle.claimed &&
    (!b.battle || b.battle.claimed || b.battle.phase !== "won")
      ? a.battle
      : b.battle?.claimed && !a.battle?.claimed
        ? b.battle
        : undefined;
  if (settled) {
    const e = ENCOUNTERS.find((e) => e.id === settled.encounterId);
    if (e)
      add(
        "adventure",
        `${e.name} cleared`,
        `${e.gold} gold · ${
          b.world
            ? Object.entries(e.loot)
                .map(
                  ([id, quantity]) => `${quantity} ${RESOURCE_NAMES[id] || id}`,
                )
                .join(" · ")
            : "1 potion"
        }`,
        e.gold,
        e.id,
      );
  }
  if (
    b.battle &&
    a.battle?.phase === "player" &&
    ["lost", "fled"].includes(b.battle.phase)
  )
    add(
      "adventure",
      b.battle.phase === "lost" ? "Party defeated" : "Party retreated",
      ENCOUNTERS.find((e) => e.id === b.battle!.encounterId)?.name,
    );
  for (const id of b.roster.filter((id) => !a.roster.includes(id)))
    add(
      "companion",
      `${COMPANIONS.find((n) => n.id === id)?.name || id} recruited`,
      undefined,
      1,
      id,
    );
  for (const id of b.equipment.filter((id) => !a.equipment.includes(id)))
    add(
      "equipment",
      `${EQUIPMENT.find((e) => e.id === id)?.name || id} equipped`,
      undefined,
      undefined,
      id,
    );
  for (const request of (next.takenRequests || []).filter(
    (r) =>
      !(previous.takenRequests || []).some(
        (p) => p.id === r.id && p.takenPeriod === r.takenPeriod,
      ),
  ))
    add(
      "request",
      `${request.title} taken`,
      request.category,
      undefined,
      request.id,
    );
  for (const r of (previous.takenRequests || []).filter(
    (r) =>
      r.takenPeriod === objectivePeriod(r, now) &&
      !(next.takenRequests || []).some((n) => n.id === r.id),
  ))
    add("request", `${r.title} released`, r.category, undefined, r.id);
  return events.length
    ? { ...next, journeyEvents: [...(next.journeyEvents || []), ...events] }
    : next;
}
