import { describe, it, expect } from "vitest";
import { demoCharacter, stats, totalXP, period } from "./domain";
import { campaign, adventureParty, buy } from "./rpg";
import { CAREER_UTILITIES } from "./career-payoffs";
import { PLACES, WORLD_CONTRACTS, TOWN_GEAR } from "./world-catalog";
import { takeWorldContract, completeWorldContract, travelTown } from "./world";
import {
  routeFolio,
  deliveryExchange,
  receiptRegister,
  receiptRegisterText,
  townServices,
  forgeOrder,
  departureCheck,
} from "./career-town-tools";
const fixture = () => {
  const c = demoCharacter();
  c.campaign = campaign(c);
  c.earnedSkills.push(...CAREER_UTILITIES.map((u) => u.skills[0]));
  return c;
};
describe("town and preparation competencies", () => {
  it("requires purchased competencies rather than the matching career title", () => {
    const c = demoCharacter();
    expect(routeFolio(c, "mossfall")).toBeNull();
    expect(deliveryExchange(c, "alderhaven")).toBeNull();
    expect(receiptRegister(c)).toBeNull();
    expect(receiptRegisterText(c)).toBeNull();
    expect(townServices(c)).toBeNull();
    expect(forgeOrder(c, [])).toBeNull();
    expect(departureCheck(c, "mossfall-path")).toBeNull();
  });
  it("draws only actual progress and route access, including preserved legacy exploration", () => {
    const c = fixture();
    expect(routeFolio(c, "unknown")).toBeNull();
    expect(routeFolio(c, "mossfall")!.places.map((p) => p.open)).toEqual([
      true,
      false,
      false,
    ]);
    c.campaign!.cleared = [
      ...PLACES.find((p) => p.id === "mossfall-path")!.stages,
    ];
    expect(routeFolio(c, "mossfall")!.places[0]).toMatchObject({
      cleared: true,
      stages: 10,
    });
    expect(routeFolio(c, "mossfall")!.places[1].open).toBe(true);
    c.campaign!.world!.preservedPlaces = ["mossfall-dungeon"];
    c.campaign!.world!.preservedExploration = ["mossfall-dungeon"];
    expect(routeFolio(c, "mossfall")!.places[2]).toMatchObject({
      open: true,
      cleared: true,
      stages: 0,
    });
    expect(routeFolio(c, "frost")!.open).toBe(false);
  });
  it("labels retained landmarks separately from lifetime visit counts", () => {
    const c = fixture();
    c.campaign!.world!.areas["mossfall-path"] = {
      visits: 99,
      sinceBoss: 3,
      ignored: 0,
      bossVictories: 1,
    };
    c.campaign!.world!.journal = [
      {
        id: "a",
        at: new Date().toISOString(),
        placeId: "mossfall-path",
        kind: "landmark",
        text: "A waymarker",
      },
      {
        id: "b",
        at: new Date().toISOString(),
        placeId: "mossfall-path",
        kind: "gather",
        text: "Herbs",
      },
    ];
    expect(routeFolio(c, "mossfall")!.places[0]).toMatchObject({
      visits: 99,
      landmarks: 1,
    });
  });
  it("compares delivery offers using actual payouts, quantities, carried material and acceptance", () => {
    let c = fixture();
    c.campaign!.inventory.sunleaf = 4;
    c = takeWorldContract(c, "alderhaven-herbs");
    const r = deliveryExchange(c, "alderhaven")!;
    expect(r.offers.find((o) => o.id === "alderhaven-herbs")).toMatchObject({
      gold: 100,
      quantity: 6,
      perUnit: 100 / 6,
      carried: 4,
      shortfall: 2,
      taken: true,
    });
    expect(
      r.offers.every((o, i) => i === 0 || o.perUnit <= r.offers[i - 1].perUnit),
    ).toBe(true);
    expect(
      r.offers.every(
        (o) => WORLD_CONTRACTS.find((q) => q.id === o.id)!.kind === "delivery",
      ),
    ).toBe(true);
    expect(deliveryExchange(c, "brassford")).toBeNull();
    expect(deliveryExchange(c, "missing")).toBeNull();
  });
  it("keeps source-route locks on offers in a shared town", () => {
    const c = fixture();
    for (const id of ["mossfall-path", "quarry-path", "ruins-path"])
      c.campaign!.cleared.push(...PLACES.find((p) => p.id === id)!.stages);
    const r = deliveryExchange(c, "greywatch")!;
    expect(r.offers.find((o) => o.id === "keep-materials")).toMatchObject({
      sourceOpen: false,
    });
  });
  it("reconciles recorded receipt amounts, repeated commissions and local calendar windows without inventing a wallet balance", () => {
    const c = fixture(),
      now = new Date(2026, 9, 26, 15),
      boundary = new Date(2026, 9, 20),
      old = new Date(2026, 8, 24),
      future = new Date(2026, 9, 27);
    c.campaign!.world!.receipts = [
      {
        id: "today",
        contractId: "alderhaven-herbs",
        at: now.toISOString(),
        gold: 25,
      },
      {
        id: "boundary",
        contractId: "alderhaven-herbs",
        at: boundary.toISOString(),
        gold: 100,
      },
      {
        id: "old",
        contractId: "brassford-herbs",
        at: old.toISOString(),
        gold: 10,
      },
      {
        id: "future",
        contractId: "alderhaven-herbs",
        at: future.toISOString(),
        gold: 999,
      },
    ];
    const r = receiptRegister(c, 7, now)!;
    expect(r).toMatchObject({
      total: 125,
      commissions: 1,
      towns: [{ name: "Alderhaven", count: 2, gold: 125 }],
    });
    expect(r.entries.map((e) => e.id)).toEqual(["today", "boundary"]);
    expect(receiptRegister(c, "all", now)!.total).toBe(135);
    expect(receiptRegisterText(c, 7, now)).toContain("25 gold");
    expect(receiptRegisterText(c, 7, now)).toContain("excludes spending");
  });
  it("uses live store stocks and smith recipes, with travel preserving party reserves", () => {
    let c = fixture();
    expect(townServices(c)!.find((t) => t.id === "alderhaven")).toMatchObject({
      current: true,
      open: true,
      stock: { potion: 0 },
    });
    expect(townServices(c)!.find((t) => t.id === "brassford")!.open).toBe(
      false,
    );
    expect(travelTown(c, "brassford")).toBe(c);
    c.campaign!.inventory.sunleaf = 6;
    c = completeWorldContract(
      takeWorldContract(c, "alderhaven-herbs"),
      "alderhaven-herbs",
    );
    expect(
      townServices(c)!.find((t) => t.id === "alderhaven")!.stock.potion,
    ).toBe(8);
    const units = adventureParty(c);
    c.campaign!.vitals = {
      day: period("daily"),
      members: Object.fromEntries(
        units.map((u) => [u.id, { ...u, hp: 1, mp: 0 }]),
      ),
    };
    c.campaign!.cleared.push("mossfall-boss");
    const after = travelTown(c, "brassford");
    expect(after.campaign!.vitals).toEqual(c.campaign!.vitals);
    expect(
      townServices(after)!
        .find((t) => t.id === "brassford")!
        .crafts.map((g) => g.id),
    ).toEqual(TOWN_GEAR.filter((g) => g.town === "brassford").map((g) => g.id));
  });
  it("totals a multi-item bill once and matches the actual sequential crafting purchases", () => {
    const c = fixture();
    c.campaign!.gold = 300;
    c.campaign!.inventory.softwood = 4;
    const ids = ["alderhaven-blade", "alderhaven-armor"],
      r = forgeOrder(c, ids)!;
    expect(r).toMatchObject({
      valid: true,
      ready: true,
      total: 300,
      remaining: 0,
      materials: [{ id: "softwood", needed: 4, carried: 4, shortfall: 0 }],
    });
    const after = ids.reduce((a, id) => buy(a, id), c);
    expect(after.campaign!.gold).toBe(0);
    expect(after.campaign!.inventory.softwood).toBe(0);
    expect(after.campaign!.inventory["alderhaven-armor"]).toBe(1);
    c.campaign!.gold = 200;
    c.campaign!.inventory.softwood = 1;
    expect(forgeOrder(c, ids)).toMatchObject({
      ready: false,
      shortfall: 100,
      materials: [{ shortfall: 3 }],
    });
  });
  it("rejects duplicate, foreign-town, owned and unknown recipe plans", () => {
    const c = fixture();
    for (const ids of [
      ["alderhaven-blade", "alderhaven-blade"],
      ["brassford-blade"],
      ["no-recipe"],
    ])
      expect(forgeOrder(c, ids)!.valid).toBe(false);
    c.campaign!.inventory["alderhaven-blade"] = 1;
    expect(forgeOrder(c, ["alderhaven-blade"])!.valid).toBe(false);
    expect(forgeOrder(c, [])).toMatchObject({
      valid: true,
      ready: false,
      total: 0,
    });
  });
  it("checks actual reserves, owned equipped skills and accepted local hunt baselines", () => {
    let c = fixture();
    const units = adventureParty(c);
    c.campaign!.vitals = {
      day: period("daily"),
      members: Object.fromEntries(
        units.map((u, i) => [u.id, { ...u, hp: i === 0 ? 1 : 0, mp: 0 }]),
      ),
    };
    c.campaign!.equippedSkills = ["profession-creative-0"];
    c.campaign!.world!.kills["mossfall-path:slime"] = 9;
    c = takeWorldContract(c, "alderhaven-monster");
    expect(departureCheck(c, "mossfall-path")).toMatchObject({
      canDepart: true,
      fallen: ["Mira"],
      lowHp: [c.name],
      skillCount: 0,
      taken: [{ progress: 0, quantity: 4 }],
    });
    c.campaign!.vitals!.members.hero.hp = 0;
    expect(departureCheck(c, "mossfall-path")!.canDepart).toBe(false);
    expect(departureCheck(c, "frost-path")).toBeNull();
    expect(departureCheck(c, "missing")).toBeNull();
  });
  it("all six reports preserve campaign, base stats and real-world progression", () => {
    const c = fixture(),
      before = structuredClone(c),
      s = stats(c),
      xp = totalXP(c);
    routeFolio(c, "mossfall");
    deliveryExchange(c, "alderhaven");
    receiptRegister(c);
    receiptRegisterText(c);
    townServices(c);
    forgeOrder(c, ["alderhaven-blade"]);
    departureCheck(c, "mossfall-path");
    expect(c).toEqual(before);
    expect(stats(c)).toEqual(s);
    expect(totalXP(c)).toBe(xp);
  });
});
