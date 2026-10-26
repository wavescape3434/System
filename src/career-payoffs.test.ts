import { describe, it, expect } from "vitest";
import { demoCharacter, totalXP, stats } from "./domain";
import { campaign, startBattle, encounterEnemies } from "./rpg";
import {
  careerWork,
  workRecordText,
  stageDiagnostics,
  supplyLedger,
  hasCareerUtility,
} from "./career-payoffs";
describe("career work and information utilities", () => {
  it("records only actual career outcomes and retains their original discipline", () => {
    const c = demoCharacter(),
      common = {
        period: "2026-10-26",
        at: "2026-10-26T12:00:00Z",
        xp: 20,
        stat: "INT" as const,
        classId: c.activeClass,
      };
    c.completions = [
      {
        ...common,
        id: "one",
        title: "Routing lab",
        scope: "profession",
        profession: "Analyst",
        careerCategory: "technology",
        vocationId: "networking",
        result: {
          output: "Configured VLANs; checked reachability.",
          minutes: 25,
          count: 3,
        },
      },
      {
        ...common,
        id: "two",
        title: "Walk",
        scope: "universal",
        result: { output: "Walked in the park" },
      },
      {
        ...common,
        id: "three",
        title: "No outcome",
        scope: "profession",
        result: { minutes: 20 },
      },
    ];
    expect(careerWork(c)).toHaveLength(1);
    expect(careerWork(c)[0]).toMatchObject({
      category: "technology",
      vocation: "Networking",
      profession: "Analyst",
    });
    const text = workRecordText({ ...c, profession: "Software Developer" });
    expect(text).toContain("Analyst → Networking");
    expect(text).toContain("Configured VLANs");
    expect(text).not.toContain("Walked in the park");
    expect(text).toContain("Self-reported");
  });
  it("does not grant fieldwork from a profession title, a plan or an unpurchased skill", () => {
    const c = demoCharacter();
    expect(hasCareerUtility(c, "ledger")).toBe(false);
    expect(supplyLedger(c)).toBeNull();
    expect(stageDiagnostics(c, "mossfall-path")).toBeNull();
    c.skillPlans = {
      version: 1,
      goals: { "profession:technology": "profession-technology-0" },
      views: {},
      locations: {},
    };
    expect(stageDiagnostics(c, "mossfall-path")).toBeNull();
  });
  it("uses the same enemy definitions as battle, with no progression or resource mutation", () => {
    const c = demoCharacter();
    c.earnedSkills.push("profession-technology-0");
    const before = structuredClone(c),
      xp = totalXP(c),
      s = stats(c);
    const info = stageDiagnostics(c, "mossfall-path")!;
    expect(info.enemies).toEqual(encounterEnemies(info.stage));
    expect(campaign(startBattle(c, info.stage)).battle!.enemies).toEqual(
      info.enemies,
    );
    expect(c).toEqual(before);
    expect(totalXP(c)).toBe(xp);
    expect(stats(c)).toEqual(s);
    expect(stageDiagnostics(c, "ice-path")).toBeNull();
  });
  it("uses live supply stock and reachable routes and keeps learned utility after career changes", () => {
    let c = demoCharacter();
    c.earnedSkills.push("career-opening-business-0");
    c = { ...c, campaign: campaign(c) };
    const report = supplyLedger(c)!;
    expect(report.town).toBe("Alderhaven");
    expect(report.deliveries.length).toBeGreaterThan(0);
    expect(report.deliveries.find((r) => r.kind === "hunt")?.routes).toContain(
      "Briar Road",
    );
    expect(report.deliveries.some((r) => r.routes.includes("Briar Road"))).toBe(
      true,
    );
    c = {
      ...c,
      profession: "Software Developer",
      campaign: {
        ...campaign(c),
        world: {
          ...campaign(c).world!,
          stock: {
            ...campaign(c).world!.stock,
            alderhaven: { potion: 0, ether: 2 },
          },
        },
      },
    };
    expect(supplyLedger(c)!.stock).toEqual({ potion: 0, ether: 2 });
  });
});
