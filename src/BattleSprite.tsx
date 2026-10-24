import { CLASSES } from "./class-catalog";
import type { Unit } from "./rpg";
const sprites: Record<string, string[]> = {
  hero: [
    "........4444........",
    ".......444444.......",
    ".......4SSSS4.......",
    ".......SWSWS........",
    "........SSSS........",
    ".......111111.......",
    "......11111111......",
    ".....S1122211S......",
    ".....S1122211S......",
    "......1122211.......",
    "......1111111.......",
    ".......22222........",
    ".......22.22........",
    "......333.333.......",
  ],
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
  const path = CLASSES.find((p) => p.id === unit.sprite),
    family = path
      ? Object.entries(path.mix).sort((a, b) => b[1]! - a[1]!)[0][0]
      : (
          {
            mira: "cleric",
            orin: "guardian",
            lyra: "ranger",
            gideon: "mage",
            nessa: "bard",
            toma: "rogue",
            elara: "guardian",
          } as Record<string, string>
        )[unit.sprite] || null,
    hero =
      unit.id === "hero" ||
      ["mira", "orin", "lyra", "gideon", "nessa", "toma", "elara"].includes(
        unit.sprite,
      ),
    kind = unit.sprite;
  let shape = hero
    ? "hero"
    : kind === "slime"
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
  const primary = hero
    ? {
        mage: "#788bd0",
        cleric: "#e1d095",
        ranger: "#7ab084",
        rogue: "#8e78b0",
        bard: "#c18bad",
        fighter: "#aa9c7b",
        guardian: "#9daec7",
        artificer: "#c3a56c",
      }[family || "fighter"] || "#9bada3"
    : ["icewolf", "frostwyrm", "gargoyle", "revenant"].includes(kind)
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
    "4": hero ? "#6c4c45" : "#e6e0bc",
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
      <rect x="3" y="20" width="18" height="2" fill="#080f33" opacity=".5" />
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
      {hero && (
        <>
          {family === "mage" || unit.sprite === "gideon" ? (
            <>
              <rect x="3" y="5" width="1" height="15" fill="#ad8b63" />
              <rect x="2" y="3" width="3" height="3" fill="#86cadc" />
            </>
          ) : (
            <>
              <rect x="21" y="8" width="1" height="9" fill="#d4e3e5" />
              <rect x="20" y="16" width="3" height="1" fill="#e9cb73" />
            </>
          )}
          {family === "cleric" && (
            <>
              <rect x="11" y="10" width="1" height="4" fill="#f9f1cf" />
              <rect x="10" y="11" width="3" height="1" fill="#f9f1cf" />
            </>
          )}
        </>
      )}
    </svg>
  );
}
