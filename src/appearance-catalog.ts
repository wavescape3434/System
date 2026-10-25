import { CLASSES } from "./class-catalog";
export type AppearanceGroup = "Arms" | "Arcana" | "Wilds" | "Court & Craft";
export interface CharacterAppearance {
  id: string;
  name: string;
  group: AppearanceGroup;
  silhouette: "Masculine" | "Feminine";
  detail: string;
  cell: number;
  portraitAnchor: readonly [number, number];
}
const rows: [
  string,
  string,
  AppearanceGroup,
  CharacterAppearance["silhouette"],
  string,
][] = [
  [
    "dawnblade",
    "Dawnblade",
    "Arms",
    "Masculine",
    "Ivory cape · steel armor · sword",
  ],
  [
    "iron-valkyrie",
    "Iron Valkyrie",
    "Arms",
    "Feminine",
    "Braided hair · silver plate · spear",
  ],
  [
    "dusk-ronin",
    "Dusk Ronin",
    "Arms",
    "Masculine",
    "Layered dark coat · tied hair · katana",
  ],
  [
    "rose-duelist",
    "Rose Duelist",
    "Arms",
    "Feminine",
    "Crimson tailoring · short hair · rapier",
  ],
  [
    "amber-sentinel",
    "Amber Sentinel",
    "Arms",
    "Masculine",
    "Grey beard · bronze plate · shield",
  ],
  [
    "desert-lancer",
    "Desert Lancer",
    "Arms",
    "Masculine",
    "Cream robes · copper trim · spear",
  ],
  [
    "moonsilk-dancer",
    "Moonsilk Dancer",
    "Arcana",
    "Feminine",
    "Plum silk · gold jewelry · flowing dark hair",
  ],
  [
    "crimson-corsair",
    "Crimson Corsair",
    "Arms",
    "Feminine",
    "Captain’s coat · corset · tall boots · saber",
  ],
  [
    "velvet-enchantress",
    "Velvet Enchantress",
    "Arcana",
    "Feminine",
    "Violet gown · silver hair · staff",
  ],
  [
    "starlit-savant",
    "Starlit Savant",
    "Arcana",
    "Masculine",
    "Navy and silver · white hair · spellbook",
  ],
  [
    "ivory-cleric",
    "Ivory Cleric",
    "Arcana",
    "Feminine",
    "Cream robes · gold trim · carved staff",
  ],
  [
    "ember-arcanist",
    "Ember Arcanist",
    "Arcana",
    "Feminine",
    "Copper curls · orange robes · flame staff",
  ],
  [
    "wildwood-archer",
    "Wildwood Archer",
    "Wilds",
    "Masculine",
    "Moss cloak · leather armor · longbow",
  ],
  [
    "falcon-huntress",
    "Falcon Huntress",
    "Wilds",
    "Feminine",
    "Braids · ochre leather · teal cloak · bow",
  ],
  [
    "nightblade",
    "Nightblade",
    "Wilds",
    "Feminine",
    "Short dark hair · purple leather · twin daggers",
  ],
  [
    "ash-assassin",
    "Ash Assassin",
    "Wilds",
    "Masculine",
    "Platinum hair · blue-black hood · daggers",
  ],
  [
    "gilded-minstrel",
    "Gilded Minstrel",
    "Court & Craft",
    "Masculine",
    "Green brocade · auburn hair · lute",
  ],
  [
    "sapphire-songstress",
    "Sapphire Songstress",
    "Court & Craft",
    "Feminine",
    "Sapphire silk · flowing hair · harp",
  ],
  [
    "brass-artificer",
    "Brass Artificer",
    "Court & Craft",
    "Feminine",
    "Goggles · work vest · tool hammer",
  ],
  [
    "wandering-apothecary",
    "Wandering Apothecary",
    "Court & Craft",
    "Masculine",
    "Sage coat · medicine satchel · bottles",
  ],
  [
    "frost-warden",
    "Frost Warden",
    "Wilds",
    "Masculine",
    "Silver beard · fur-edged cloak · greatsword",
  ],
  [
    "sunborne-monk",
    "Sunborne Monk",
    "Arms",
    "Masculine",
    "Gold wraps · athletic build · staff",
  ],
  [
    "silver-courtier",
    "Silver Courtier",
    "Court & Craft",
    "Masculine",
    "Lavender tailoring · long hair · cane",
  ],
  [
    "pearl-merchant",
    "Pearl Merchant",
    "Court & Craft",
    "Feminine",
    "Teal travel coat · pearls · satchel",
  ],
];
// Normalized face centers within each trimmed sprite frame.
const portraitAnchors: readonly (readonly [number, number])[] = [
  [0.49, 0.18],
  [0.4, 0.22],
  [0.57, 0.2],
  [0.58, 0.15],
  [0.41, 0.17],
  [0.52, 0.2],
  [0.41, 0.15],
  [0.48, 0.19],
  [0.41, 0.18],
  [0.46, 0.18],
  [0.49, 0.21],
  [0.46, 0.18],
  [0.38, 0.16],
  [0.39, 0.16],
  [0.5, 0.17],
  [0.43, 0.18],
  [0.44, 0.18],
  [0.5, 0.17],
  [0.52, 0.19],
  [0.47, 0.19],
  [0.53, 0.19],
  [0.36, 0.19],
  [0.42, 0.18],
  [0.5, 0.19],
];
export const CHARACTER_APPEARANCES: CharacterAppearance[] = rows.map(
  ([id, name, group, silhouette, detail], cell) => ({
    id,
    name,
    group,
    silhouette,
    detail,
    cell,
    portraitAnchor: portraitAnchors[cell],
  }),
);
export const APPEARANCE_GROUPS: AppearanceGroup[] = [
  "Arms",
  "Arcana",
  "Wilds",
  "Court & Craft",
];
export const SPRITE_ATLAS = {
  src: "/art/adventurer-roster-pixel.png",
  columns: 6,
  rows: 4,
};
export function findAppearance(id: unknown) {
  return CHARACTER_APPEARANCES.find((a) => a.id === id);
}
export function classAppearance(classId: string): CharacterAppearance {
  const path = CLASSES.find((p) => p.id === classId),
    family = Object.entries(path?.mix || {}).sort(
      (a, b) => b[1]! - a[1]!,
    )[0]?.[0];
  const defaults: Record<string, string> = {
    fighter: "dawnblade",
    guardian: "amber-sentinel",
    ranger: "wildwood-archer",
    rogue: "nightblade",
    mage: "ember-arcanist",
    cleric: "ivory-cleric",
    bard: "gilded-minstrel",
    artificer: "brass-artificer",
  };
  return findAppearance(defaults[family]) || CHARACTER_APPEARANCES[0];
}
export const characterAppearance = (c: {
  appearance?: string;
  activeClass: string;
}) => findAppearance(c.appearance) || classAppearance(c.activeClass);
export const COMPANION_APPEARANCES: Record<string, string> = {
  mira: "ivory-cleric",
  orin: "amber-sentinel",
  lyra: "falcon-huntress",
  gideon: "starlit-savant",
  nessa: "sapphire-songstress",
  toma: "ash-assassin",
  elara: "iron-valkyrie",
};
export function unitAppearance(unit: {
  id: string;
  sprite: string;
  appearance?: string;
}): CharacterAppearance | undefined {
  if (unit.id === "hero")
    return findAppearance(unit.appearance) || classAppearance(unit.sprite);
  return (
    findAppearance(unit.appearance) ||
    findAppearance(COMPANION_APPEARANCES[unit.id])
  );
}

export function spriteViewport(
  appearance: CharacterAppearance,
  frame: { width: number; height: number },
  portrait = false,
) {
  if (!portrait)
    return { x: 0, y: 0, width: frame.width, height: frame.height };
  const size = Math.round(Math.min(frame.width, frame.height * 0.36));
  const x = Math.round(
    Math.max(
      0,
      Math.min(
        frame.width - size,
        frame.width * appearance.portraitAnchor[0] - size / 2,
      ),
    ),
  );
  const y = Math.round(
    Math.max(
      0,
      Math.min(
        frame.height - size,
        frame.height * appearance.portraitAnchor[1] - size * 0.48,
      ),
    ),
  );
  return { x, y, width: size, height: size };
}
