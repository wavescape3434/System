import type { Character } from "./domain";
import { findAppearance } from "./appearance-catalog";
export function selectAppearance(c: Character, id: string): Character {
  if (!findAppearance(id) || c.appearance === id) return c;
  const battle = c.campaign?.battle;
  return {
    ...c,
    appearance: id,
    ...(battle
      ? {
          campaign: {
            ...c.campaign!,
            battle: {
              ...battle,
              party: battle.party.map((u) =>
                u.id === "hero" ? { ...u, appearance: id } : u,
              ),
            },
          },
        }
      : {}),
  };
}
