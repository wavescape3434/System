export const SUPPLY_RESTORE = { potion: 50, ether: 20 } as const;
export const SUPPLY_PRICES = { potion: 20, ether: 25 } as const;
export type SupplyId = keyof typeof SUPPLY_RESTORE;
export function supplyRecovery(
  unit: { hp: number; mp: number; maxHp: number; maxMp: number },
  id: SupplyId,
) {
  if (unit.hp <= 0) return 0;
  return Math.max(
    0,
    Math.min(
      SUPPLY_RESTORE[id],
      id === "potion" ? unit.maxHp - unit.hp : unit.maxMp - unit.mp,
    ),
  );
}
export function supplyQuote(
  gold: number,
  stock: number | undefined,
  id: SupplyId,
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
