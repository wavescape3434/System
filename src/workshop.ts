import type { Character } from "./domain";
import { campaign, adventureParty } from "./rpg";
import { regionOpen } from "./world-state";
import { TOWNS, TOWN_GEAR } from "./world-catalog";
import { gearModifiers, MAX_TEMPER, temperRank } from "./equipment-progression";
import type { SupplyId } from "./supplies";
export const BREWS = [
  { id: "greater-potion", gold: 100, herbs: 2, ore: 0, smith: 1 },
  { id: "greater-ether", gold: 125, herbs: 2, ore: 0, smith: 1 },
  { id: "royal-potion", gold: 400, herbs: 4, ore: 1, smith: 3 },
  { id: "royal-ether", gold: 500, herbs: 4, ore: 1, smith: 3 },
] as const;
export function brewQuote(c: Character, id: string, quantity: number) {
  const data = campaign(c),
    town = TOWNS.find((t) => t.id === data.world!.townId)!,
    recipe = BREWS.find((b) => b.id === id);
  if (!recipe) return null;
  const valid =
      Number.isSafeInteger(quantity) && quantity >= 1 && quantity <= 99,
    unlocked = town.smith >= recipe.smith && regionOpen(data, town.region),
    gold = valid ? recipe.gold * quantity : 0,
    materials = [
      { id: town.herb, quantity: valid ? recipe.herbs * quantity : 0 },
      ...(recipe.ore
        ? [{ id: town.ore, quantity: valid ? recipe.ore * quantity : 0 }]
        : []),
    ].map((m) => ({
      ...m,
      carried: data.inventory[m.id] || 0,
      shortfall: Math.max(0, m.quantity - (data.inventory[m.id] || 0)),
    }));
  return {
    recipe,
    town,
    valid,
    unlocked,
    gold,
    goldShortfall: Math.max(0, gold - data.gold),
    materials,
    canBrew:
      valid &&
      unlocked &&
      !data.battle &&
      data.gold >= gold &&
      materials.every((m) => !m.shortfall),
  };
}
export function brew(c: Character, id: SupplyId, quantity = 1): Character {
  const q = brewQuote(c, id, quantity);
  if (!q?.canBrew) return c;
  const data = campaign(c),
    inventory = { ...data.inventory };
  for (const m of q.materials) inventory[m.id] -= m.quantity;
  inventory[id] = (inventory[id] || 0) + quantity;
  return { ...c, campaign: { ...data, gold: data.gold - q.gold, inventory } };
}
export function temperQuote(c: Character, id: string) {
  const data = campaign(c),
    gear = TOWN_GEAR.find((g) => g.id === id);
  if (!gear) return null;
  const rank = temperRank(c, id),
    next = rank + 1,
    town = TOWNS.find((t) => t.id === gear.town)!,
    gold = gear.price * 2 ** next,
    quantity = gear.quantity + next,
    carried = data.inventory[gear.material] || 0,
    here = data.world!.townId === gear.town && regionOpen(data, town.region),
    owned = (data.inventory[id] || 0) > 0;
  const preview = {
    ...c,
    campaign: {
      ...data,
      gearUpgrades: { ...data.gearUpgrades, [id]: Math.min(MAX_TEMPER, next) },
    },
  };
  return {
    gear,
    town,
    rank,
    next,
    gold,
    quantity,
    carried,
    here,
    owned,
    current: gearModifiers(c, gear),
    upgraded: gearModifiers(preview, gear),
    goldShortfall: Math.max(0, gold - data.gold),
    materialShortfall: Math.max(0, quantity - carried),
    canTemper:
      owned &&
      here &&
      !data.battle &&
      rank < MAX_TEMPER &&
      data.gold >= gold &&
      carried >= quantity,
  };
}
export function temper(c: Character, id: string): Character {
  const q = temperQuote(c, id);
  if (!q?.canTemper) return c;
  const data = campaign(c);
  // Preserve absolute reserves even when a CON upgrade raises maximum HP.
  const members = {
    ...data.vitals!.members,
    ...Object.fromEntries(
      adventureParty(c).map((u) => [
        u.id,
        { hp: u.hp, mp: u.mp, maxHp: u.maxHp, maxMp: u.maxMp },
      ]),
    ),
  };
  return {
    ...c,
    campaign: {
      ...data,
      gold: data.gold - q.gold,
      inventory: {
        ...data.inventory,
        [q.gear.material]: q.carried - q.quantity,
      },
      gearUpgrades: { ...data.gearUpgrades, [id]: q.next },
      vitals: { day: data.vitals!.day, members },
    },
  };
}
