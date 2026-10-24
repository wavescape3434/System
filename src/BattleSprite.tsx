import { CLASSES } from "./class-catalog";
import type { Unit } from "./rpg";
export default function BattleSprite({ unit }: { unit: Unit }) {
  const path = CLASSES.find((p) => p.id === unit.sprite),
    family = path
      ? Object.entries(path.mix).sort((a, b) => b[1]! - a[1]!)[0][0]
      : null;
  const kind = unit.sprite,
    slime = kind === "slime",
    wolf = ["wolf", "alpha", "wyvern", "harpy", "bat"].includes(kind),
    construct =
      unit.id !== "hero" &&
      ["golem", "construct", "sentinel", "warden", "crawler"].includes(kind),
    skull = kind === "skeleton",
    hero =
      unit.id === "hero" || ["mira", "orin", "lyra", "gideon"].includes(kind);
  const color = hero
    ? kind === "mira"
      ? "#acc399"
      : kind === "lyra"
        ? "#84a77d"
        : kind === "gideon"
          ? "#899ab6"
          : family === "mage"
            ? "#899ab6"
            : family === "cleric"
              ? "#d2c387"
              : family === "rogue"
                ? "#8c87a4"
                : family === "ranger"
                  ? "#84a77d"
                  : family === "bard"
                    ? "#ac8eab"
                    : "#b9a56c"
    : construct
      ? "#98978a"
      : wolf
        ? "#a6ac9e"
        : "#81b49a";
  return (
    <svg
      viewBox="0 0 120 140"
      className={`battle-sprite ${unit.hp === 0 ? "defeated" : ""}`}
      role="img"
      aria-label={unit.name}
    >
      <ellipse cx="60" cy="128" rx="39" ry="7" fill="#112f25" opacity=".25" />
      {slime ? (
        <>
          <path
            d="M18 117C12 95 28 91 30 74C33 50 43 39 60 39S88 58 90 78C92 95 109 99 102 117C89 131 30 131 18 117"
            fill="#73ae8d"
            stroke="#426b55"
            strokeWidth="3"
          />
          <ellipse
            cx="44"
            cy="72"
            rx="14"
            ry="7"
            fill="#b1d5b2"
            opacity=".55"
          />
          <path d="M44 94v8m29-8v8" stroke="#203e34" strokeWidth="5" />
          <path d="M54 111h12" stroke="#4b755d" strokeWidth="3" />
        </>
      ) : wolf ? (
        <>
          <path
            d="m20 100 10-34 18-13 12-21 12 20 19 8 13 26-13 18-3 20H73l-3-26-19 1-7 25H30l1-26Z"
            fill={color}
            stroke="#485952"
            strokeWidth="3"
          />
          <path
            d="m40 57 2-30 14 23m18 5 10-25 6 32"
            fill={color}
            stroke="#485952"
            strokeWidth="3"
          />
          <path d="m40 83 12 4m22 0 12-4" stroke="#e5cb7b" strokeWidth="3" />
          <path
            d="m55 96 9 3 9-4"
            fill="none"
            stroke="#34473e"
            strokeWidth="3"
          />
          {["wyvern", "harpy", "bat"].includes(kind) && (
            <path
              d="M34 73 7 46l4 43 22 8m53-22 27-29-4 43-22 8"
              fill="#758886"
              stroke="#455d54"
              strokeWidth="3"
            />
          )}
        </>
      ) : construct ? (
        <>
          <path
            d="m34 64 10-26h33l11 26 8 33-14 7-5 22H62l-3-25-5 25H37l-4-26-15-7 7-29Z"
            fill={color}
            stroke="#555f53"
            strokeWidth="3"
          />
          <path
            d="M45 22h30l9 29-13 13H47L36 49Z"
            fill="#a3a594"
            stroke="#555f53"
            strokeWidth="3"
          />
          <path d="M45 44h12m8 0h12" stroke="#dcbb69" strokeWidth="4" />
          <path d="m49 71 10 13 10-13-10-9Z" fill="#c8a168" />
          <path
            d="m36 93 13-5m25 0 14 5M59 88v13"
            stroke="#626e5a"
            strokeWidth="3"
          />
        </>
      ) : (
        <>
          <path
            d="M39 78 26 121h66L80 77l-20-12Z"
            fill={hero ? color : "#8a8d8e"}
            stroke="#465d50"
            strokeWidth="3"
          />
          <path
            d="M47 113v14H35m38-14v14h12"
            stroke="#4e584a"
            strokeWidth="9"
          />
          <path
            d="m39 78-17 24m60-24 17 24"
            stroke={hero ? "#c1b08d" : "#a2a98f"}
            strokeWidth="11"
          />
          <path
            d="M43 30q17-16 34 0v28L65 72H54L43 57Z"
            fill={skull ? "#d4d0ad" : "#d0bc98"}
            stroke="#66745d"
            strokeWidth="2"
          />
          <path
            d="M39 34v-8q22-27 42 0v14l-15-11-10 9Z"
            fill={
              kind === "mira"
                ? "#846443"
                : kind === "lyra"
                  ? "#c5ac6a"
                  : "#536558"
            }
          />
          <path d="M49 48h5m13 0h5" stroke="#445344" strokeWidth="3" />
          {skull && (
            <path
              d="M53 57h14m-7-2v8M44 87h33m-34 9h34"
              stroke="#cec9a7"
              strokeWidth="4"
            />
          )}
          {kind === "mira" ||
          kind === "gideon" ||
          family === "mage" ||
          family === "cleric" ||
          family === "artificer" ? (
            <>
              <path d="M98 123V52" stroke="#8a704b" strokeWidth="5" />
              <circle
                cx="98"
                cy="47"
                r="9"
                fill={kind === "mira" ? "#b3d2a2" : "#96b8c5"}
                stroke="#c3b77e"
                strokeWidth="3"
              />
            </>
          ) : (
            <>
              <path
                d="m13 103 14-29 4-27 6 24-14 35Z"
                fill="#d8d9c0"
                stroke="#8a987d"
                strokeWidth="2"
              />
              <path d="m14 100 18 8" stroke="#c9b36a" strokeWidth="5" />
              <path
                d="M83 82h20v26l-10 9-10-9Z"
                fill="#657f64"
                stroke="#c7b47a"
                strokeWidth="2"
              />
            </>
          )}
        </>
      )}
      {unit.boss && <path d="m43 19 4-12 12 7 12-7 6 12Z" fill="#d9b565" />}
    </svg>
  );
}
