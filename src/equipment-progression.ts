import type { Character, Stats } from "./domain";
import { TOWN_GEAR } from "./world-catalog";
export const MAX_TEMPER = 5;
export function temperRank(c: Character, id: string) {
  const n = c.campaign?.gearUpgrades?.[id] || 0;
  return Number.isSafeInteger(n) ? Math.max(0, Math.min(MAX_TEMPER, n)) : 0;
}
export function gearModifiers(
  c: Character,
  item: { id: string; mod: Partial<Stats> },
) {
  const rank = TOWN_GEAR.some((g) => g.id === item.id)
    ? temperRank(c, item.id)
    : 0;
  return Object.fromEntries(
    Object.entries(item.mod).map(([s, n]) => [
      s,
      n! + Math.ceil(n! * 0.15) * rank,
    ]),
  ) as Partial<Stats>;
}
export const modifierText = (mod: Partial<Stats>) =>
  Object.entries(mod)
    .map(([s, n]) => `+${n} combat ${s}`)
    .join(", ");
