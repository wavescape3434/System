import type { Character } from "./domain";
import { describe, it, expect } from "vitest";
import { demoCharacter, SKILLS, stats, totalXP } from "./domain";
import { careerCategory } from "./careers";
import { CAREER_UTILITIES, hasCareerUtility } from "./career-payoffs";
import {
  guildDocket,
  deliveryManifest,
  resourceAtlas,
  equipmentAppraisal,
  dangerWatch,
  supplyPlan,
} from "./career-field-tools";
import { campaign, buy, SUPPLY_PRICES } from "./rpg";
import { takeWorldContract, completeWorldContract, explore } from "./world";
import { PLACES } from "./world-catalog";
import { bossChance, ambushChance } from "./world-state";
import { validateCharacter } from "./storage";
const fixture = (): Character => {
  const c = demoCharacter();
  return {
    ...c,
    campaign: campaign(c),
    earnedSkills: [
      ...c.earnedSkills,
      ...CAREER_UTILITIES.map((u) => u.skills[0]),
    ],
  };
};
describe("profession fieldwork", () => {
  it("maps eight disciplines to actual learnable non-combat skills", () => {
    expect(CAREER_UTILITIES).toHaveLength(8);
    expect(new Set(CAREER_UTILITIES.map((u) => u.category)).size).toBe(8);
    for (const u of CAREER_UTILITIES)
      for (const id of u.skills) {
        const s = SKILLS.find((s) => s.id === id)!;
        expect(s).toBeDefined();
        expect(s.nonCombat).toBe(true);
        expect(s.owner).toBe(u.category);
        expect(s.automatic).not.toBe(true);
        expect(s.cost).toBeGreaterThan(0);
        expect(u.learn).toContain(s.name);
      }
  });
  it("requires purchased ownership, independent of titles and planned skills", () => {
    const c = demoCharacter();
    for (const read of [
      guildDocket,
      deliveryManifest,
      resourceAtlas,
      equipmentAppraisal,
      dangerWatch,
    ])
      expect(read(c)).toBeNull();
    expect(supplyPlan(c, { potion: 1, ether: 0 })).toBeNull();
    const learned = fixture();
    expect(validateCharacter(learned)).toBe(true);
    const roundtrip = JSON.parse(
      JSON.stringify({ ...learned, profession: "Analyst", vocation: null }),
    );
    for (const u of CAREER_UTILITIES)
      expect(hasCareerUtility(roundtrip, u.id)).toBe(true);
    expect(careerCategory(roundtrip.profession).id).toBe("business");
  });
  it("uses acceptance baselines for a hunt and actual turn-in readiness", () => {
    let c = fixture();
    c.campaign!.world!.kills["mossfall-path:slime"] = 10;
    c = takeWorldContract(c, "alderhaven-monster");
    c.campaign = {
      ...c.campaign!,
      world: { ...c.campaign!.world!, kills: { "mossfall-path:slime": 12 } },
    };
    expect(guildDocket(c)![0]).toMatchObject({
      progress: 2,
      remaining: 2,
      canReport: false,
    });
    c.campaign!.world!.kills["mossfall-path:slime"] = 14;
    expect(guildDocket(c)![0]).toMatchObject({
      progress: 4,
      remaining: 0,
      canReport: true,
    });
    const next = completeWorldContract(c, "alderhaven-monster");
    expect(guildDocket(next)).toHaveLength(0);
    expect(next.campaign!.gold).toBe(c.campaign!.gold + 110);
  });
  it("combines delivery needs and distinguishes exploration readiness from a merely open area", () => {
    let c = fixture();
    c = takeWorldContract(
      takeWorldContract(c, "alderhaven-herbs"),
      "alderhaven-ore",
    );
    c.campaign!.inventory.sunleaf = 4;
    c.campaign!.inventory.softwood = 7;
    const rows = deliveryManifest(c)!;
    expect(rows.find((r) => r.resource === "sunleaf")).toMatchObject({
      needed: 6,
      carried: 4,
      shortfall: 2,
    });
    expect(rows.find((r) => r.resource === "softwood")).toMatchObject({
      needed: 5,
      carried: 7,
      shortfall: 0,
    });
    expect(rows[0].routes[0]).toMatchObject({
      id: "mossfall-path",
      ready: false,
    });
    const p = PLACES.find((p) => p.id === "mossfall-path")!;
    c.campaign!.cleared = [...p.stages];
    expect(
      deliveryManifest(c)!.find((r) => r.resource === "sunleaf")!.routes[0]
        .ready,
    ).toBe(true);
  });
  it("excludes locked regions and shows the new open route after a route clear", () => {
    const c = fixture();
    expect(
      resourceAtlas(c)!
        .flatMap((r) => r.routes)
        .every((p) => p.id === "mossfall-path"),
    ).toBe(true);
    c.campaign!.cleared = [
      ...PLACES.find((p) => p.id === "mossfall-path")!.stages,
    ];
    const routes = resourceAtlas(c)!.flatMap((r) => r.routes);
    expect(routes.some((p) => p.id === "mossfall-wilds" && !p.ready)).toBe(
      true,
    );
    expect(routes.some((p) => p.region === "quarry")).toBe(true);
    expect(routes.some((p) => p.region === "frost")).toBe(false);
  });
  it("compares both gains and losses when changing equipment slots", () => {
    const c = fixture();
    c.campaign!.gold = 100;
    c.campaign!.inventory.softwood = 1;
    c.campaign!.inventory["alderhaven-blade"] = 1;
    c.campaign!.equipment = ["alderhaven-blade"];
    const staff = equipmentAppraisal(c)!.items.find(
      (i) => i.id === "alderhaven-staff",
    )!;
    expect(staff.changes).toMatchObject({ STR: -3, INT: 3 });
    expect(staff).toMatchObject({
      goldShortfall: 50,
      materialShortfall: 1,
      replaces: "Woodland Blade",
      owned: false,
    });
    c.campaign!.inventory["alderhaven-staff"] = 1;
    expect(
      equipmentAppraisal(c)!.items.find((i) => i.id === "alderhaven-staff"),
    ).toMatchObject({ owned: true, goldShortfall: 0, materialShortfall: 0 });
  });
  it("matches discovery and ambush rolls, including guaranteed encounters", () => {
    const c = fixture(),
      p = PLACES.find((p) => p.id === "mossfall-path")!;
    c.campaign!.cleared = [...p.stages];
    c.campaign!.world!.areas[p.id] = {
      visits: 6,
      sinceBoss: 6,
      ignored: 0,
      bossVictories: 0,
    };
    expect(dangerWatch(c)![0].chance).toBe(bossChance(p.id, 6));
    c.campaign!.world!.areas[p.id] = {
      visits: 20,
      sinceBoss: 0,
      ignored: p.ambushPity,
      bossVictories: 0,
      pendingBoss: true,
    };
    expect(dangerWatch(c)![0]).toMatchObject({
      chance: ambushChance(p.id, p.ambushPity),
      untilGuaranteed: 1,
      pending: true,
    });
    expect(
      campaign(explore(c, p.id, () => 0.99)).world!.areas[p.id].last!.kind,
    ).toBe("ambush");
  });
  it("uses the shop prices and separates gold shortage from stock shortage", () => {
    const c = fixture();
    c.campaign!.gold = 50;
    c.campaign!.world!.stock.alderhaven = { potion: 1, ether: 2 };
    expect(supplyPlan(c, { potion: 2, ether: 1 })).toMatchObject({
      total: 65,
      shortfall: 15,
      stockShortage: ["potion"],
      available: false,
    });
    expect(supplyPlan(c, { potion: 1, ether: 1 })).toMatchObject({
      total: 45,
      remaining: 5,
      available: true,
    });
    expect(campaign(buy(c, "potion")).gold).toBe(
      c.campaign!.gold - SUPPLY_PRICES.potion,
    );
  });
  it("rejects invalid purchase quantities and accepts zero without changing inventory", () => {
    const c = fixture(),
      before = structuredClone(c);
    for (const n of [-1, 0.2, NaN, Infinity, 10000])
      expect(supplyPlan(c, { potion: n, ether: 0 })!.valid).toBe(false);
    expect(supplyPlan(c, { potion: 0, ether: 0 })).toMatchObject({
      valid: true,
      total: 0,
      available: true,
    });
    expect(c).toEqual(before);
  });
  it("all six reports leave real-world progression and campaign state untouched", () => {
    const c = fixture(),
      before = structuredClone(c),
      s = stats(c),
      xp = totalXP(c);
    guildDocket(c);
    deliveryManifest(c);
    resourceAtlas(c);
    equipmentAppraisal(c);
    dangerWatch(c);
    supplyPlan(c, { potion: 1, ether: 1 });
    expect(c).toEqual(before);
    expect(stats(c)).toEqual(s);
    expect(totalXP(c)).toBe(xp);
  });
});
