import type { Skill } from "./skill-catalog";
import { COMBAT_EFFECTS } from "./class-roles";
import { combatIdentity, identityDescription } from "./combat-identity";

export const combatFamily = (s: Skill) => s.combatFamily || s.id;
export function combatProfile(s: Skill) {
  const rank = s.combatRank || 1,
    base = COMBAT_EFFECTS[s.combat || ""];
  const potency = rank === 1 ? 1 : rank === 2 ? 1.15 : 1.4 + (rank - 3) * 0.25;
  const mp = base
    ? Math.max(
        1,
        base.mp -
          Math.min(2, Math.floor(rank / 2)) -
          (combatIdentity(s.id, s.combat || "").discipline === "unarmed"
            ? 1
            : 0),
      )
    : 0;
  const statBonus =
    s.nonCombat || s.automatic || s.id === "universal-root"
      ? 0
      : Math.max(s.cost >= 2 ? 2 : 1, s.combatRank || 1);
  const effect = s.combat || "";
  const detail = !base
    ? "Equipped combat modifier."
    : effect === "scan"
      ? `Lower one enemy's defense by ${Math.round(3 * potency)} for the battle.`
      : effect === "rally"
        ? `Raise party attack and magic for the battle: base +${Math.round(2 * potency)}, strengthened by combat CHA above 10.`
        : effect === "formation"
          ? `Raise party attack (base +${Math.round(3 * potency)}), magic and defense (base +${Math.round(2 * potency)}); bonuses scale with combat CHA above 10. Guard this round.`
          : ["taunt", "bulwark"].includes(effect)
            ? `${effect === "bulwark" ? "Guard all allies" : "Guard yourself"} this enemy round; draw attacks for ${Math.ceil(2 * potency)} rounds.`
            : `${base.description}${potency > 1 ? ` ${Math.round(potency * 100)}% effect strength.` : ""}`;
  return {
    rank,
    potency,
    mp,
    statBonus,
    description: [detail, identityDescription(s.id, effect)]
      .filter(Boolean)
      .join(" "),
  };
}
export function bestCombatSkills(earned: string[], skills: Skill[]): Skill[] {
  const ids = new Set(earned),
    families = new Map<string, Skill>();
  for (const s of skills) {
    if (
      !ids.has(s.id) ||
      s.nonCombat ||
      s.automatic ||
      s.id === "universal-root"
    )
      continue;
    const family = combatFamily(s),
      previous = families.get(family);
    if (!previous || combatProfile(s).rank > combatProfile(previous).rank)
      families.set(family, s);
  }
  return [...families.values()];
}
export function resolvedLoadout(
  earned: string[],
  equipped: string[],
  skills: Skill[],
): string[] {
  if (!equipped.length) return [];
  const ids = new Set(earned),
    best = new Map(
      bestCombatSkills(earned, skills).map((s) => [combatFamily(s), s]),
    );
  const used = new Set<string>(),
    result: string[] = [];
  for (const id of equipped) {
    const original = skills.find((s) => s.id === id);
    if (!original || !ids.has(id) || !best.has(combatFamily(original)))
      continue;
    const family = combatFamily(original);
    if (used.has(family)) continue;
    used.add(family);
    result.push(best.get(family)!.id);
    if (result.length === 4) break;
  }
  return result;
}
