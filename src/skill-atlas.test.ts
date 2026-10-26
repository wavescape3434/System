import { describe, it, expect } from "vitest";
import { SKILLS, demoCharacter, stats } from "./domain";
import {
  constellation,
  styleSkills,
  skillAncestors,
  skillStyle,
} from "./skill-atlas";
import { campaign, toggleEquippedSkill, startBattle } from "./rpg";
import { PLACES } from "./world-catalog";

describe("skill constellations", () => {
  it("lays out each current tree without changing skill data or losing nodes", () => {
    const groups = new Map<string, typeof SKILLS>();
    for (const s of SKILLS.filter((s) => !s.legacy)) {
      const key = `${s.category}:${s.archetype || s.owner || "universal"}`;
      groups.set(key, [...(groups.get(key) || []), s]);
    }
    for (const list of groups.values()) {
      const before = list.map((s) => [s.id, s.x, s.y, s.cost, s.parents]),
        graph = constellation(list);
      expect(graph.nodes).toHaveLength(list.length);
      expect(new Set(graph.nodes.map((n) => `${n.x}:${n.y}`)).size).toBe(
        list.length,
      );
      for (const n of graph.nodes) {
        expect(Number.isFinite(n.x + n.y)).toBe(true);
        expect(n.x).toBeGreaterThanOrEqual(65);
        expect(n.y).toBeGreaterThanOrEqual(35);
        expect(n.x + 65).toBeLessThanOrEqual(graph.width);
        expect(n.y + 100).toBeLessThanOrEqual(graph.height);
      }
      expect(list.map((s) => [s.id, s.x, s.y, s.cost, s.parents])).toEqual(
        before,
      );
    }
  });
  it("retains mandatory and alternative prerequisites when focusing a weapon style", () => {
    const list = SKILLS.filter((s) => s.archetype === "fighter" && !s.legacy),
      focused = styleSkills(list, "Spearcraft"),
      ids = new Set(focused.map((s) => s.id));
    expect(ids.has("martial-spear-4")).toBe(true);
    expect(ids.has("martial-axe-2")).toBe(true);
    for (const s of focused)
      for (const id of [...s.parents, ...(s.anyParents || [])])
        expect(ids.has(id)).toBe(true);
    expect(
      skillStyle(
        list.find((s) => s.id === "martial-sword-1")!,
        list,
      ),
    ).toBe("Swordsmanship");
    expect(skillAncestors("martial-spear-4", list)).not.toContain(
      "martial-spear-4",
    );
  });
  it("handles empty and malformed cyclic graph input without recursion failure", () => {
    expect(constellation([]).nodes).toEqual([]);
    const a = { ...SKILLS[0], id: "a", parents: ["b"] },
      b = { ...SKILLS[0], id: "b", parents: ["a"] };
    expect(constellation([a, b]).nodes).toHaveLength(2);
    expect(skillAncestors("a", [a, b])).toEqual(["b"]);
  });
  it("equips only learned combat skills, enforces four slots and keeps real stats unchanged", () => {
    const c = demoCharacter(),
      before = stats(c),
      ids = SKILLS.filter((s) => s.archetype === "fighter")
        .slice(0, 5)
        .map((s) => s.id);
    expect(toggleEquippedSkill(c, ids[0])).toBe(c);
    c.earnedSkills.push(...ids, "profession-business-0");
    let next = c;
    for (const id of ids.slice(0, 4)) next = toggleEquippedSkill(next, id);
    expect(campaign(next).equippedSkills).toHaveLength(4);
    expect(toggleEquippedSkill(next, ids[4])).toBe(next);
    expect(toggleEquippedSkill(next, "profession-business-0")).toBe(next);
    expect(stats(next)).toEqual(before);
    const removed = toggleEquippedSkill(next, ids[0]);
    expect(campaign(removed).equippedSkills).toHaveLength(3);
    const battle = startBattle(removed, PLACES[0].stages[0]);
    expect(toggleEquippedSkill(battle, ids[4])).toBe(battle);
  });
});
