import type { WorldEncounter } from "./world-catalog";
import { WORLD_REGIONS } from "./world-catalog";
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
  const specialty =
    unit.tactic === "bulwark" && round % 4 === 0
      ? "Shell reforms after this round"
      : unit.tactic === "stalker"
        ? "Targets lowest HP%"
        : unit.tactic === "siphon"
          ? chargedAttack(unit, round)
            ? "MP siphon · highest MP"
            : "Targets highest MP"
          : huntEnraged(unit)
            ? "Enraged · +30% damage"
            : "";
  return [
    shell,
    attack,
    specialty,
    unit.chill ? `Chilled ${unit.chill} · attack damage −25%` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export const TACTIC_NAMES = {
  bulwark: "Ironhide",
  stalker: "Bloodtrail",
  siphon: "Mana Reaver",
  ravager: "Frenzy",
} as const;
export const TACTIC_DETAILS = {
  bulwark:
    "Armored shell reforms every fourth round. Techniques, magic and analysis break it.",
  stalker:
    "Targets the living ally with the lowest HP percentage. Guard that ally or draw attacks with taunt.",
  siphon:
    "Targets the ally with the most MP. Every second round siphons MP; guarding reduces the drain by 75%.",
  ravager:
    "Cleaves all living allies every third round. At 40% HP or less, damage rises by 30%.",
} as const;
export function huntTactics(e: WorldEncounter, index: number): Partial<Unit> {
  if (e.kind !== "elite-hunt") return {};
  const ri = WORLD_REGIONS.findIndex((r) => r.id === e.region),
    power = e.tier,
    tactic = (["ravager", "bulwark", "siphon", "stalker"] as const)[
      (ri + (index ? 1 : 0)) % 4
    ],
    boss = index === 0,
    hp = (boss ? 160 : 55) + power * (boss ? 20 : 9);
  return {
    hp,
    maxHp: hp,
    attack: Math.round((boss ? 14 : 10) + power * (boss ? 3 : 2.2)),
    defense: 2 + Math.floor(power * (boss ? 0.5 : 0.35)),
    speed: 10 + Math.floor(power / 3),
    tactic,
    shell: tactic === "bulwark" ? 2 : 0,
    chargeEvery: tactic === "siphon" ? 2 : 3,
    chargeMultiplier: tactic === "ravager" ? 1.8 : 1.5,
    cleave: tactic === "ravager",
  };
}
export const huntEnraged = (u: Unit) =>
  u.tactic === "ravager" && u.hp > 0 && u.hp / u.maxHp <= 0.4;
export function huntTarget(enemy: Unit, living: Unit[]) {
  if (enemy.tactic === "stalker")
    return [...living].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (enemy.tactic === "siphon")
    return [...living].sort((a, b) => b.mp - a.mp)[0];
  return undefined;
}
