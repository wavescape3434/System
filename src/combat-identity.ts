// Authored combat rules are copied into new battle snapshots. Older fights keep their rules.
export const ELEMENTS = ["fire", "ice", "storm"] as const;
export type Element = (typeof ELEMENTS)[number];
export const elementMultiplier = (
  element: Element | undefined,
  target: { weak?: Element; resist?: Element },
) =>
  element && element === target.weak
    ? 1.3
    : element && element === target.resist
      ? 0.8
      : 1;
export const DISCIPLINES = ["sword", "spear", "axe", "unarmed"] as const;
export type Discipline = (typeof DISCIPLINES)[number];
export const DISCIPLINE_DETAILS: Record<Discipline, string> = {
  sword:
    "Sword: +25% technique damage after guarding an enemy round; empowered counters also gain this bonus.",
  spear:
    "Spear: ignore half of remaining defense; +25% damage against an enemy using a charged attack this round. Counters ignore half of defense.",
  axe: "Axe: each damaging hit removes 20% of the enemy’s remaining defense (at least 1) for this battle.",
  unarmed:
    "Unarmed: use the higher of physical attack or DEX technique power; technique costs are reduced by 1 MP (minimum 1).",
};
export const SIGNATURE_DETAILS: Record<string, string> = {
  paladin: "After striking, guard every living ally for this enemy round.",
  "dawn-sovereign":
    "After striking, guard every living ally for this enemy round.",
  "eldritch-knight":
    "The strike leaves a three-round aether burn, dealing 30% magic power per round before signature potency.",
  "aether-blademaster":
    "The strike leaves a three-round aether burn, dealing 30% magic power per round before signature potency.",
  "high-cleric":
    "Restoration also guards every living ally for this enemy round.",
  lightbearer:
    "Restoration also guards every living ally for this enemy round.",
  shadowblade:
    "Deal +40% signature damage when the target starts at half HP or less.",
  phantom:
    "Deal +40% signature damage when the target starts at half HP or less.",
  archmage: "Recover 2 MP per living enemy struck, up to half the MP spent.",
  "astral-savant":
    "Recover 2 MP per living enemy struck, up to half the MP spent.",
  "grand-artificer":
    "The burn spreads to every other living enemy at half strength for three rounds.",
  "world-forger":
    "The burn spreads to every other living enemy at half strength for three rounds.",
};
export function combatIdentity(id: string, type: string) {
  const discipline = /^martial-(sword|spear|axe|unarmed)-/.exec(id)?.[1] as
    Discipline | undefined;
  const elemental = /^element-(fire|ice|storm)-/.exec(id)?.[1] as
    Element | undefined;
  const owner = /^(?:signature-|focus-)(.+?)(?:-\d+)?$/.exec(id)?.[1];
  const signature = owner && SIGNATURE_DETAILS[owner] ? owner : undefined;
  const element =
    elemental ||
    (type === "ice" || type === "storm"
      ? type
      : type === "burn" && !signature
        ? "fire"
        : undefined);
  return { discipline, element, signature };
}
export const identityDescription = (id: string, type: string) => {
  const { discipline, element, signature } = combatIdentity(id, type);
  return [
    discipline && DISCIPLINE_DETAILS[discipline],
    element && `${element[0].toUpperCase() + element.slice(1)} element.`,
    signature && SIGNATURE_DETAILS[signature],
  ]
    .filter(Boolean)
    .join(" ");
};
export const ENEMY_AFFINITIES: Record<
  string,
  { weak: Element; resist: Element }
> = {
  slime: { weak: "ice", resist: "fire" },
  wolf: { weak: "fire", resist: "ice" },
  alpha: { weak: "fire", resist: "ice" },
  bat: { weak: "storm", resist: "ice" },
  crawler: { weak: "ice", resist: "storm" },
  golem: { weak: "storm", resist: "fire" },
  wisp: { weak: "ice", resist: "fire" },
  skeleton: { weak: "fire", resist: "storm" },
  sentinel: { weak: "storm", resist: "ice" },
  construct: { weak: "storm", resist: "fire" },
  harpy: { weak: "ice", resist: "storm" },
  wyvern: { weak: "ice", resist: "fire" },
  warden: { weak: "fire", resist: "ice" },
  crab: { weak: "storm", resist: "ice" },
  serpent: { weak: "storm", resist: "fire" },
  leviathan: { weak: "storm", resist: "ice" },
  mushroom: { weak: "fire", resist: "storm" },
  spider: { weak: "fire", resist: "ice" },
  hydra: { weak: "fire", resist: "ice" },
  icewolf: { weak: "fire", resist: "ice" },
  gargoyle: { weak: "fire", resist: "ice" },
  revenant: { weak: "fire", resist: "ice" },
  frostwyrm: { weak: "fire", resist: "ice" },
};
