import CharacterSprite from "./CharacterSprite";
import { unitAppearance } from "./appearance-catalog";
import type { Unit } from "./rpg";
const sprites: Record<string, string[]> = {
  slime: [
    ".........111........",
    ".......1111111......",
    "......114411111.....",
    ".....11444111111....",
    "....1111111111111...",
    "...111W11W11111111..",
    "..11111111111111111.",
    "..11111111111111111.",
    "...222222222222222..",
  ],
  wolf: [
    ".....11........1....",
    "....1111......111...",
    "...11411111111111...",
    "...111W111111W111...",
    "..1111111111111111..",
    ".111111111111111111.",
    "11111111111111111111",
    "11111111111111222111",
    ".22211111111222.111.",
    "....11..11....11.11.",
    "....22..22....22.22.",
  ],
  wing: [
    "1..................1",
    "11......1111......11",
    "1111...11WW11...1111",
    "11111111111111111111",
    ".111111111111111111.",
    "..2222111111112222..",
    "......11111111......",
    ".......22..22.......",
  ],
  metal: [
    "......22222222......",
    ".....2111111112.....",
    ".....211W11W112.....",
    ".....2111111112.....",
    "......22222222......",
    "...22211111111222...",
    "..2111222222221112..",
    "..2111222222221112..",
    "..2111111111111112..",
    "...22211111111222...",
    "......11111111......",
    "......222..222......",
    ".....2112..2112.....",
    ".....2222..2222.....",
  ],
  serpent: [
    ".........11111......",
    "........11W1111.....",
    "........11111111....",
    "..........111111....",
    "..........11111.....",
    ".......111111.......",
    ".....111111.........",
    "...111111...........",
    "..111111111111111...",
    "...22222222222222...",
  ],
  crab: [
    ".11..............11.",
    "1111............1111",
    ".1111..111111..1111.",
    "..111111W11W111111..",
    "....111111111111....",
    "..1111111111111111..",
    ".11.11.222222.11.11.",
    "11..11........11..11",
  ],
  mushroom: [
    ".......111111.......",
    ".....1144114411.....",
    "....111441144111....",
    "...11111111111111...",
    "..1111441111441111..",
    "..2222222222222222..",
    ".......SSSSSS.......",
    ".......SWSSWS.......",
    ".......SSSSSS.......",
    "......SSSSSSSS......",
  ],
  spider: [
    "11................11",
    ".11..............11.",
    "..111...1111...111..",
    "....11111WW11111....",
    "..1111111111111111..",
    ".11..1111111111..11.",
    "11..11..2222..11..11",
    "...11..........11...",
  ],
  wisp: [
    ".........11.........",
    "........1441........",
    ".......144441.......",
    "......11444411......",
    "......11W11W11......",
    ".......111111.......",
    "........2222........",
    ".........22.........",
  ],
};
export default function BattleSprite({ unit }: { unit: Unit }) {
  const appearance = unitAppearance(unit);
  if (appearance)
    return (
      <CharacterSprite
        appearance={appearance}
        label={unit.name}
        className={`battle-sprite pixel-sprite humanoid-sprite ${unit.hp === 0 ? "defeated" : ""}`}
      />
    );

  const kind = unit.sprite;
  let shape =
    kind === "slime"
      ? "slime"
      : ["wolf", "alpha", "icewolf"].includes(kind)
        ? "wolf"
        : ["bat", "harpy", "wyvern", "frostwyrm", "gargoyle"].includes(kind)
          ? "wing"
          : ["serpent", "hydra", "leviathan"].includes(kind)
            ? "serpent"
            : kind === "crab"
              ? "crab"
              : kind === "mushroom"
                ? "mushroom"
                : kind === "spider"
                  ? "spider"
                  : kind === "wisp"
                    ? "wisp"
                    : "metal";
  const primary = ["icewolf", "frostwyrm", "gargoyle", "revenant"].includes(
    kind,
  )
    ? "#a3d3e4"
    : ["wisp", "construct"].includes(kind)
      ? "#cc8a68"
      : kind === "crab"
        ? "#dba56a"
        : ["mushroom", "spider", "hydra"].includes(kind)
          ? "#a894bb"
          : ["slime", "serpent", "leviathan"].includes(kind)
            ? "#74b8a5"
            : "#b0b9ad";
  const palette: Record<string, string> = {
    "1": primary,
    "2": "#474c68",
    "3": "#34374d",
    "4": "#e6e0bc",
    "6": "#d9cda6",
    "7": "#c8d4cd",
    T: "#b28a70",
    S: "#edcba6",
    W: "#f8f5df",
  };
  const rows = sprites[shape];
  return (
    <svg
      viewBox="0 0 24 22"
      className={`battle-sprite pixel-sprite ${unit.boss ? "boss-sprite" : ""} ${unit.hp === 0 ? "defeated" : ""}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={unit.name}
    >
      <rect x="3" y={20} width="18" height="2" fill="#080f33" opacity=".5" />
      <g transform={`translate(2 ${20 - rows.length})`}>
        {rows.flatMap((row, y) =>
          [...row].flatMap((value, x) =>
            palette[value]
              ? [
                  <rect
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    width="1"
                    height="1"
                    fill={palette[value]}
                  />,
                ]
              : [],
          ),
        )}
      </g>
    </svg>
  );
}
