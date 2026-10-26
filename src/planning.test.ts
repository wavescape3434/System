import { describe, expect, it, vi, afterEach } from "vitest";
import { demoCharacter, SKILLS, totalXP, stats } from "./domain";
import {
  activeTreeKey,
  migrateSkillPlans,
  planLocation,
  setPlanGoal,
  setPlanLocation,
  setPlanView,
  skillTreeKey,
  validSkillPlans,
} from "./skill-plans";
import {
  validateCharacter,
  saveCharacter,
  localRecovery,
  RECOVERY_KEY,
} from "./storage";
import { packCloudSnapshot, unpackCloudSnapshot } from "./cloud-backup";
import { accountGuard } from "./account-session";
import { progressionChanged } from "./progression-ledger";
afterEach(() => vi.unstubAllGlobals());
describe("durable character plans", () => {
  it("keeps independent goals for shared combat, focus, career and universal trees without granting progress", async () => {
    let c = migrateSkillPlans(demoCharacter());
    const before = {
      xp: totalXP(c),
      stats: stats(c),
      skills: [...c.earnedSkills],
      purchases: c.skillPurchases,
    };
    const chosen = [
      "class:fighter",
      "class:mage",
      "focus:warrior",
      "profession:business",
      "universal",
    ].map((key) =>
      SKILLS.find(
        (s) =>
          !s.legacy &&
          !s.automatic &&
          s.id !== "universal-root" &&
          skillTreeKey(s) === key,
      )!,
    );
    expect(chosen.every(Boolean)).toBe(true);
    const original = c;
    for (const skill of chosen)
      c = setPlanGoal(c, skillTreeKey(skill), skill.id);
    expect(Object.keys(c.skillPlans!.goals)).toHaveLength(5);
    expect(totalXP(c)).toBe(before.xp);
    expect(stats(c)).toEqual(before.stats);
    expect(c.earnedSkills).toEqual(before.skills);
    expect(c.skillPurchases).toEqual(before.purchases);
    expect(progressionChanged(original, c)).toBe(false);
    const packed = await packCloudSnapshot(c),
      restored = await unpackCloudSnapshot(packed.manifest, packed.chunks);
    expect(validateCharacter(restored)).toBe(true);
    expect(JSON.parse(JSON.stringify(c)).skillPlans).toEqual(c.skillPlans);
    expect((restored as typeof c).skillPlans).toEqual(c.skillPlans);
    const cleared = setPlanGoal(c, "class:mage", "");
    expect(cleared.skillPlans!.goals["class:fighter"]).toBe(
      c.skillPlans!.goals["class:fighter"],
    );
    expect(cleared.skillPlans!.goals["class:mage"]).toBeUndefined();
  });
  it("keeps branch, style and list preferences with their tree across class changes", () => {
    let c = migrateSkillPlans(demoCharacter());
    c = setPlanLocation(c, { category: "class", branch: "fighter" });
    c = setPlanView(c, "class:fighter", {
      style: "Spearcraft",
      listMode: true,
    });
    const scholar = { ...c, activeClass: "scholar" };
    expect(planLocation(scholar)).toEqual({
      category: "class",
      branch: "current",
    });
    const updated = setPlanLocation(scholar, {
      category: "class",
      branch: "fighter",
    });
    expect(activeTreeKey(updated)).toBe("class:fighter");
    expect(updated.skillPlans!.views["class:fighter"]).toEqual({
      style: "Spearcraft",
      listMode: true,
    });
    expect(updated.activeClass).toBe("scholar");
    expect(validSkillPlans(updated.skillPlans)).toBe(true);
    expect(setPlanLocation(c, { category: "class", branch: "__proto__" })).toBe(
      c,
    );
    expect(setPlanView(c, "class:fighter", { style: "Unknown style" })).toBe(c);
  });
  it("migrates only this character's legacy session goals, retaining valid entries beside malformed ones", () => {
    const c = demoCharacter(),
      prefix = `guild.view.${c.id}.`;
    const values = new Map([
      [`${prefix}warrior.tree.goal`, JSON.stringify("martial-spear-3")],
      [`${prefix}warrior.tree.category`, JSON.stringify("class")],
      [`${prefix}warrior.tree.branch`, JSON.stringify("current")],
      [`${prefix}warrior.tree.list`, "true"],
      [`${prefix}scholar.tree.goal`, "broken JSON"],
      ["guild.view.other.warrior.tree.goal", JSON.stringify("martial-sword-1")],
    ]);
    const migrated = migrateSkillPlans(c, {
      getItem: (key) => values.get(key) || null,
    });
    expect(migrated.skillPlans!.goals).toEqual({
      "class:fighter": "martial-spear-3",
    });
    expect(migrated.skillPlans!.views["class:fighter"].listMode).toBe(true);
    expect(migrateSkillPlans(migrated)).toBe(migrated);
    const cleared = setPlanGoal(migrated, "class:fighter", "");
    expect(
      migrateSkillPlans(cleared, { getItem: (key) => values.get(key) || null })
        .skillPlans!.goals,
    ).toEqual({});
    expect(validateCharacter(migrated)).toBe(true);
  });
  it("rejects unknown/mismatched plans in a backup and retains a learned goal", () => {
    let c = migrateSkillPlans(demoCharacter());
    c = setPlanGoal(c, "class:fighter", "martial-spear-3");
    c.earnedSkills = [...c.earnedSkills, "martial-spear-3"];
    expect(validateCharacter(c)).toBe(true);
    const bad = structuredClone(c);
    bad.skillPlans!.goals["class:mage"] = "martial-spear-3";
    expect(validateCharacter(bad)).toBe(false);
    expect(setPlanGoal(c, "class:mage", "martial-spear-3")).toBe(c);
    expect(setPlanGoal(c, "universal", "universal-root")).toBe(c);
  });
});
describe("recovery and account boundaries", () => {
  it("repairs a damaged optional snapshot after a successful primary save", () => {
    const values = new Map([[RECOVERY_KEY, "broken JSON"]]);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    const c = migrateSkillPlans(demoCharacter());
    saveCharacter(c);
    expect(localRecovery()?.character.skillPlans).toEqual(c.skillPlans);
    expect(localRecovery()).toBe(localRecovery());
  });
  it("refuses a changed account or a session restarted under the same UID", () => {
    const auth = { currentUser: { uid: "owner-a" } as { uid: string } | null };
    let generation = 1;
    const operation = accountGuard(auth, () => generation);
    expect(operation.uid).toBe("owner-a");
    expect(() => operation.check()).not.toThrow();
    auth.currentUser = { uid: "owner-b" };
    expect(() => operation.check()).toThrow("account changed");
    auth.currentUser = { uid: "owner-a" };
    generation++;
    expect(() => operation.check()).toThrow("account changed");
    auth.currentUser = null;
    expect(() => accountGuard(auth)).toThrow("Link your Google");
  });
});
