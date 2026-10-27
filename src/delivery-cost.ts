import type { Character } from "./domain";
import { campaign } from "./rpg";
import { WORLD_CONTRACTS, TOWN_GEAR } from "./world-catalog";
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
  return {
    resource: q.resource,
    quantity: q.quantity,
    carried,
    after,
    shortfall: Math.max(0, q.quantity - carried),
    recipes,
    affected: recipes.filter((g) => g.enoughNow && !g.enoughAfter),
  };
}
