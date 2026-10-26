import type { Unit } from "./rpg";

export function openingTactics(
  encounterId: string,
  index: number,
): Partial<Unit> {
  if (encounterId === "mossfall-boss")
    return {
      maxHp: 245,
      hp: 245,
      attack: 31,
      chargeEvery: 3,
      chargeMultiplier: 2.2,
      cleave: true,
    };
  const stage = Number(/^mossfall-path-(\d+)$/.exec(encounterId)?.[1]);
  if (!stage) return {};
  if ([3, 4, 7, 8, 9].includes(stage) && index === 0)
    return { shell: stage >= 7 ? 3 : 2 };
  if (
    ([5, 6].includes(stage) && index === 0) ||
    ([7, 8, 9].includes(stage) && index === 1)
  )
    return { chargeEvery: stage === 9 ? 2 : 3, chargeMultiplier: 1.9 };
  return {};
}
export const chargedAttack = (unit: Unit, round: number) =>
  round % (unit.chargeEvery || (unit.boss ? 3 : Infinity)) === 0;
export function enemyIntent(unit: Unit, round: number): string {
  const shell = unit.shell ? `Shell ${unit.shell}` : "";
  const every = unit.chargeEvery || (unit.boss ? 3 : 0);
  const attack = chargedAttack(unit, round)
    ? unit.cleave
      ? "Cleave · all allies"
      : "Heavy strike"
    : every && (round + 1) % every === 0
      ? unit.cleave
        ? "Preparing cleave"
        : "Winding up"
      : "";
  return [shell, attack].filter(Boolean).join(" · ");
}
