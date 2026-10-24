export default function PixelScene({
  biome = "forest",
  town = false,
}: {
  biome?: string;
  town?: boolean;
}) {
  const palettes: Record<string, string[]> = {
    forest: ["#233b67", "#7da180", "#32574d", "#1b393c", "#416f45"],
    quarry: ["#49526f", "#c2bba2", "#706967", "#49485b", "#938a70"],
    ruins: ["#352f59", "#ba8e70", "#75575a", "#453650", "#a76c55"],
    mountain: ["#405980", "#b9cfcb", "#839ca2", "#465d76", "#b5b9a4"],
    keep: ["#282c51", "#8d8192", "#4e4f69", "#292e49", "#776a67"],
    coast: ["#568ca1", "#c4decb", "#518d96", "#315c86", "#d2ba78"],
    swamp: ["#273a57", "#91a697", "#496c69", "#273e4e", "#739278"],
    snow: ["#526685", "#e0eded", "#a8c5cc", "#667e9d", "#c3d8dc"],
  };
  const interior = ["barrow", "sea-cave", "ice-cave", "dungeon"].includes(
    biome,
  );
  const p =
    biome === "ice-cave"
      ? palettes.snow
      : biome === "sea-cave"
        ? palettes.coast
        : interior
          ? palettes.keep
          : palettes[biome] || palettes.forest;
  const blocks: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
  }[] = [];
  const rect = (
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
  ) => blocks.push({ x, y, width, height, fill });
  rect(0, 0, 192, 96, p[0]);
  rect(0, 56, 192, 40, p[3]);
  rect(0, 76, 192, 20, p[4]);
  rect(151, 12, 12, 12, "#f6dfac");
  rect(148, 15, 18, 6, "#f6dfac");
  for (let i = 0; i < 9; i++) {
    const x = (i * 31 + 11) % 192,
      y = 33 + (i % 3) * 7;
    for (let row = 0; row < 8; row++)
      rect(x - row * 3, y + row * 3, 3 + row * 6, 3, p[2]);
  }
  for (let i = 0; i < 35; i++) {
    const x = (i * 37 + 7) % 192,
      y = 78 + ((i * 7) % 18);
    rect(x, y, 2 + (i % 3), 1, p[1]);
  }
  if (biome === "forest" || biome === "swamp" || biome === "grove") {
    for (let i = 0; i < 8; i++) {
      const x = (i * 29 + 8) % 190,
        y = 37 + (i % 3) * 7;
      rect(x + 4, y + 11, 3, 20, "#554c47");
      for (let j = 0; j < 5; j++)
        rect(x + 7 - j * 2, y + j * 3, 2 + j * 4, 3, i % 2 ? p[2] : "#54825b");
    }
  }
  if (biome === "coast" || biome === "swamp") {
    rect(0, 65, 192, 17, "#426f91");
    for (let i = 0; i < 24; i++)
      rect((i * 23) % 190, 68 + (i % 4) * 3, 7, 1, "#a7d0cb");
  }
  if (biome === "ruins" || biome === "keep") {
    for (let i = 0; i < 7; i++) {
      const x = 8 + i * 27;
      rect(x, 35 + (i % 2) * 8, 13, 40, p[3]);
      rect(x - 2, 33 + (i % 2) * 8, 17, 4, p[1]);
      for (let j = 0; j < 4; j++) rect(x + 2, 40 + j * 8, 9, 1, p[2]);
    }
  }
  if (interior) {
    rect(0, 0, 192, 18, p[3]);
    for (let i = 0; i < 16; i++) {
      const x = i * 13;
      rect(x, 18, 8, 8 + (i % 4) * 5, p[2]);
    }
    for (let i = 0; i < 8; i++) {
      rect(i * 26, 45, 12, 36, p[2]);
      rect(i * 26 - 2, 43, 16, 4, p[1]);
    }
    rect(80, 36, 30, 42, "#0b1739");
    rect(76, 32, 38, 5, p[1]);
    rect(0, 82, 192, 14, p[3]);
    for (let i = 0; i < 30; i++)
      rect((i * 23) % 190, 84 + (i % 3) * 4, 10, 1, p[2]);
  }
  if (town) {
    rect(73, 70, 50, 26, "#ae9875");
    for (let i = 0; i < 5; i++) {
      const x = 14 + i * 34,
        y = 49 + (i % 2) * 10;
      rect(x, y + 8, 25, 25, "#d7c39b");
      for (let j = 0; j < 5; j++)
        rect(x + 11 - j * 3, y + j * 2, 3 + j * 6, 2, "#805864");
      rect(x + 10, y + 21, 6, 12, "#494659");
      rect(x + 3, y + 15, 4, 5, "#8cabbd");
      rect(x + 18, y + 15, 4, 5, "#8cabbd");
    }
  }
  return (
    <svg
      viewBox="0 0 192 96"
      preserveAspectRatio="xMidYMid slice"
      className="pixel-scene"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {blocks.map((r, i) => (
        <rect key={i} {...r} />
      ))}
    </svg>
  );
}
