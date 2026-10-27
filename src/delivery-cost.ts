import { SUPPLIES } from "./supplies";
import type { Character } from "./domain";
import { BREWS, temperQuote } from "./workshop";
import { campaign } from "./rpg";
import { WORLD_CONTRACTS, TOWN_GEAR, TOWNS } from "./world-catalog";
export function deliveryCost(c: Character, id: string) {
  const q = WORLD_CONTRACTS.find((q) => q.id === id);
  if (!q || q.kind !== "delivery" || !q.resource) return null;
  const data = campaign(c),
    carried = data.inventory[q.resource] || 0,
    after = Math.max(0, carried - q.quantity),
    recipes = TOWN_GEAR.filter(
      (g) =>
        g.town === q.town && g.material === q.resource && !data.inventory[g.id],
    ).map((g) => ({
      id: g.id,
      name: g.name,
      quantity: g.quantity,
      enoughNow: carried >= g.quantity,
      enoughAfter: after >= g.quantity,
    }));
  const upgrades = TOWN_GEAR.filter(
    (g) =>
      g.town === q.town && g.material === q.resource && data.inventory[g.id],
  ).flatMap((g) => {
    const t = temperQuote(c, g.id)!;
    return t.rank < 5
      ? [
          {
            id: `temper-${g.id}`,
            name: `${g.name} · Temper +${t.next}`,
            quantity: t.quantity,
            enoughNow: carried >= t.quantity,
            enoughAfter: after >= t.quantity,
          },
        ]
      : [];
  });
  const town = TOWNS.find((t) => t.id === q.town)!;
  const brews = BREWS.filter((b) => town.smith >= b.smith).flatMap((b) => {
    const quantity =
      q.resource === town.herb ? b.herbs : q.resource === town.ore ? b.ore : 0;
    return quantity
      ? [
          {
            id: b.id,
            name: SUPPLIES[b.id].name,
            quantity,
            enoughNow: carried >= quantity,
            enoughAfter: after >= quantity,
          },
        ]
      : [];
  });
  const workshop = [...upgrades, ...brews];
  return {
    resource: q.resource,
    quantity: q.quantity,
    carried,
    after,
    shortfall: Math.max(0, q.quantity - carried),
    recipes,
    workshopAffected: workshop.filter((g) => g.enoughNow && !g.enoughAfter),
    affected: recipes.filter((g) => g.enoughNow && !g.enoughAfter),
  };
}
