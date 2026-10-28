import type { Skill } from "./domain";

const STYLE_NAMES: Record<string, string[]> = {
  fighter: ["Vanguard", "Counterguard", "Battlecraft"],
  guardian: ["Retaliation", "Bulwark", "Field Warden"],
  ranger: ["Archery", "Ambush", "Trailcraft"],
  rogue: ["Assassin", "Duelist", "Trickster"],
  mage: ["Evocation", "Warding", "Aethercraft"],
  cleric: ["Radiance", "Sanctuary", "Restoration"],
  bard: ["War Singer", "Watchful Verse", "Minstrel"],
  artificer: ["Ordnance", "Shieldcraft", "Field Engineer"],
};
export const STYLE_COLORS = [
  "#edbf76",
  "#9bcdd5",
  "#c5a9e8",
  "#a9d6a0",
  "#edaaa2",
  "#a9bbf0",
  "#e4c6aa",
];
export function skillStyle(s: Skill, list: Skill[]): string {
  if (s.category === "universal")
    return s.id === "universal-root" ? "Foundation" : s.stat;
  const element = /^element-(fire|ice|storm)-/.exec(s.id)?.[1];
  if (element)
    return { fire: "Pyromancy", ice: "Frostcraft", storm: "Stormcalling" }[
      element
    ]!;
  const weapon = /^martial-(sword|spear|axe|unarmed)-/.exec(s.id)?.[1];
  if (weapon)
    return {
      sword: "Swordsmanship",
      spear: "Spearcraft",
      axe: "Axe Fighting",
      unarmed: "Unarmed Combat",
    }[weapon]!;
  if (s.archetype) {
    const type = s.combat || "";
    const lane = [
      "power",
      "pierce",
      "quick",
      "flurry",
      "fire",
      "area",
      "burn",
      "hybrid",
    ].includes(type)
      ? 0
      : ["ward", "guard", "counter", "taunt", "bulwark", "bash"].includes(type)
        ? 1
        : 2;
    return STYLE_NAMES[s.archetype]?.[lane] || s.branch;
  }
  if (s.id.startsWith("profession-")) {
    const index = Number(s.id.split("-").at(-1));
    if (index === 0) return "Foundation";
    const lane = ((index - 1) % 3) + 1;
    return (
      list.find((n) => n.id === `profession-${s.owner}-${lane}`)?.name ||
      s.branch
    );
  }
  if (s.id.startsWith("career-opening-")) {
    const index = Number(s.id.split("-").at(-1)) + 1;
    return (
      list.find((n) => n.id === `profession-${s.owner}-${index}`)?.name ||
      s.branch
    );
  }
  return s.branch;
}

// Include every prerequisite so a focused style never hides its entry route.
export function skillAncestors(id: string, skills: Skill[]): string[] {
  const found = new Set<string>(),
    visiting = new Set<string>();
  const visit = (key: string) => {
    if (visiting.has(key)) return;
    visiting.add(key);
    const s = skills.find((n) => n.id === key);
    for (const parent of [...(s?.parents || []), ...(s?.anyParents || [])]) {
      if (parent !== id && skills.some((n) => n.id === parent)) {
        found.add(parent);
        visit(parent);
      }
    }
  };
  visit(id);
  return [...found];
}
export function styleSkills(list: Skill[], style: string): Skill[] {
  if (!style || style === "all") return list;
  const own = list.filter((s) => skillStyle(s, list) === style);
  const ids = new Set(
    own.flatMap((s) => [s.id, ...skillAncestors(s.id, list)]),
  );
  return list.filter((s) => ids.has(s.id));
}

export interface AtlasNode {
  skill: Skill;
  x: number;
  y: number;
  style: string;
  color: string;
}
export function constellation(list: Skill[]): {
  nodes: AtlasNode[];
  width: number;
  height: number;
} {
  if (!list.length) return { nodes: [], width: 800, height: 680 };
  const depthCache = new Map<string, number>();
  const depth = (s: Skill, visiting = new Set<string>()): number => {
    if (depthCache.has(s.id)) return depthCache.get(s.id)!;
    if (visiting.has(s.id)) return 1;
    const seen = new Set([...visiting, s.id]);
    const required = s.parents
      .map((id) => list.find((n) => n.id === id))
      .filter((n): n is Skill => !!n);
    const alternatives = (s.anyParents || [])
      .map((id) => list.find((n) => n.id === id))
      .filter((n): n is Skill => !!n);
    const rank =
      s.id === "universal-root"
        ? 0
        : Math.max(
            1,
            required.length
              ? Math.max(...required.map((n) => depth(n, seen))) + 1
              : 1,
            alternatives.length
              ? Math.min(...alternatives.map((n) => depth(n, seen))) + 1
              : 1,
          );
    depthCache.set(s.id, rank);
    return rank;
  };
  const styles = [...new Set(list.map((s) => skillStyle(s, list)))].sort();
  const rings = new Map<number, Skill[]>();
  for (const s of list) {
    const rank = depth(s);
    rings.set(rank, [...(rings.get(rank) || []), s]);
  }
  const positioned: AtlasNode[] = [];
  let outer = 0;
  for (const [rank, skills] of [...rings].sort((a, b) => a[0] - b[0])) {
    const radius =
      rank === 0
        ? 0
        : Math.max(
            180 + rank * 170,
            (skills.length * 175) / (2 * Math.PI),
            outer + 175,
          );
    outer = radius;
    skills.sort(
      (a, b) =>
        styles.indexOf(skillStyle(a, list)) -
          styles.indexOf(skillStyle(b, list)) || a.id.localeCompare(b.id),
    );
    skills.forEach((s, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / skills.length;
      const style = skillStyle(s, list);
      positioned.push({
        skill: s,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        style,
        color: STYLE_COLORS[styles.indexOf(style) % STYLE_COLORS.length],
      });
    });
  }
  const minX = Math.min(...positioned.map((n) => n.x)) - 110,
    minY = Math.min(...positioned.map((n) => n.y)) - 90;
  return {
    nodes: positioned.map((n) => ({ ...n, x: n.x - minX, y: n.y - minY })),
    width: Math.max(700, Math.max(...positioned.map((n) => n.x)) - minX + 110),
    height: Math.max(680, Math.max(...positioned.map((n) => n.y)) - minY + 130),
  };
}
