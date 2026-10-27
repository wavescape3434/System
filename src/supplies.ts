export const SUPPLY_RESTORE = { potion: 50, ether: 20 } as const;
export const SUPPLY_PRICES = { potion: 20, ether: 25 } as const;
export type BasicSupplyId = keyof typeof SUPPLY_RESTORE;
export const SUPPLIES = {
  potion: { name: "Healing potion", resource: "hp", restore: 50, fraction: 0 },
  ether: { name: "Ether", resource: "mp", restore: 20, fraction: 0 },
  "greater-potion": {
    name: "Greater potion",
    resource: "hp",
    restore: 150,
    fraction: 0.25,
  },
  "greater-ether": {
    name: "Greater ether",
    resource: "mp",
    restore: 60,
    fraction: 0.25,
  },
  "royal-potion": {
    name: "Royal potion",
    resource: "hp",
    restore: 450,
    fraction: 0.5,
  },
  "royal-ether": {
    name: "Royal ether",
    resource: "mp",
    restore: 180,
    fraction: 0.5,
  },
} as const;
export type SupplyId = keyof typeof SUPPLIES;
export const SUPPLY_IDS = Object.keys(SUPPLIES) as SupplyId[];
export const isSupply = (id: string): id is SupplyId =>
  Object.hasOwn(SUPPLIES, id);
export function supplyPower(
  unit: { maxHp: number; maxMp: number },
  id: SupplyId,
) {
  const item = SUPPLIES[id];
  return Math.max(
    item.restore,
    Math.floor(
      (item.resource === "hp" ? unit.maxHp : unit.maxMp) * item.fraction,
    ),
  );
}
export function supplyEffect(id: SupplyId) {
  const item = SUPPLIES[id];
  return `Restore up to ${item.restore} ${item.resource.toUpperCase()}${item.fraction ? ` or ${item.fraction * 100}% of maximum, whichever is higher` : ""}.`;
}
export function supplyRecovery(
  unit: { hp: number; mp: number; maxHp: number; maxMp: number },
  id: SupplyId,
) {
  if (unit.hp <= 0) return 0;
  return Math.max(
    0,
    Math.min(
      supplyPower(unit, id),
      SUPPLIES[id].resource === "hp"
        ? unit.maxHp - unit.hp
        : unit.maxMp - unit.mp,
    ),
  );
}
export function supplyQuote(
  gold: number,
  stock: number | undefined,
  id: BasicSupplyId,
  quantity: number,
) {
  const valid =
      (id === "potion" || id === "ether") &&
      Number.isSafeInteger(quantity) &&
      quantity >= 1 &&
      quantity <= 99,
    total = valid ? SUPPLY_PRICES[id] * quantity : 0,
    stockShortfall =
      valid && stock !== undefined ? Math.max(0, quantity - stock) : 0,
    goldShortfall = valid ? Math.max(0, total - gold) : 0;
  return {
    valid,
    total,
    stockShortfall,
    goldShortfall,
    canBuy: valid && !stockShortfall && !goldShortfall,
  };
}
