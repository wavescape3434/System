import { describe, expect, it, vi, afterEach } from "vitest";
import { demoCharacter, stats, totalXP, period } from "./domain";
import {
  campaign,
  adventureParty,
  buy,
  equip,
  useSupply,
  startBattle,
  takeAction,
  combatAttributes,
} from "./rpg";
import { brew, brewQuote, temper, temperQuote } from "./workshop";
import { gearModifiers } from "./equipment-progression";
import { SUPPLY_IDS, supplyRecovery } from "./supplies";
import { TOWN_GEAR, PLACES } from "./world-catalog";
import { validateCharacter } from "./storage";
import { deliveryCost } from "./delivery-cost";
const fixture = () => {
  const c = demoCharacter();
  c.campaign = campaign(c);
  c.campaign.gold = 100000;
  c.campaign.inventory.sunleaf = 100;
  c.campaign.inventory.softwood = 100;
  return c;
};
afterEach(() => vi.useRealTimers());
describe("town workshops", () => {
  it("brews a whole batch using exact local materials and gold, preserving stock and progression", () => {
    const c = fixture(),
      before = structuredClone(c),
      q = brewQuote(c, "greater-potion", 3)!,
      n = brew(c, "greater-potion", 3);
    expect(q).toMatchObject({
      valid: true,
      unlocked: true,
      canBrew: true,
      gold: 300,
    });
    expect(n.campaign!.gold).toBe(c.campaign!.gold - 300);
    expect(n.campaign!.inventory.sunleaf).toBe(94);
    expect(n.campaign!.inventory["greater-potion"]).toBe(3);
    expect(n.campaign!.world!.stock).toEqual(c.campaign!.world!.stock);
    expect(n.completions).toEqual(c.completions);
    expect(stats(n)).toEqual(stats(c));
    expect(totalXP(n)).toBe(totalXP(c));
    expect(c).toEqual(before);
    expect(validateCharacter(JSON.parse(JSON.stringify(n)))).toBe(true);
  });
  it("rejects invalid batches and all shortages without partial spending", () => {
    const c = fixture();
    for (const n of [0, -1, 0.5, 100, NaN, Infinity])
      expect(brew(c, "greater-ether", n)).toBe(c);
    c.campaign!.inventory.sunleaf = 1;
    expect(brew(c, "greater-potion")).toBe(c);
    c.campaign!.inventory.sunleaf = 100;
    c.campaign!.gold = 99;
    expect(brew(c, "greater-potion")).toBe(c);
    expect(brew(c, "potion")).toBe(c);
    expect(buy(c, "greater-potion")).toBe(c);
  });
  it("requires an accessible Adept apothecary and both materials for Royal brews", () => {
    let c = fixture();
    expect(brew(c, "royal-potion")).toBe(c);
    c.campaign!.world!.townId = "embermere";
    expect(brew(c, "royal-potion")).toBe(c);
    c.campaign!.cleared = PLACES.filter((p) =>
      ["mossfall", "quarry"].includes(p.region),
    ).flatMap((p) => p.stages);
    c.campaign!.inventory.moonmint = 4;
    c.campaign!.inventory.emberglass = 0;
    expect(brew(c, "royal-potion")).toBe(c);
    c.campaign!.inventory.emberglass = 1;
    c = brew(c, "royal-potion");
    expect(c.campaign!.inventory["royal-potion"]).toBe(1);
    expect(c.campaign!.inventory.moonmint).toBe(0);
    expect(c.campaign!.inventory.emberglass).toBe(0);
    expect(c.campaign!.gold).toBe(99600);
  });
  it("scales stronger supplies to high reserves, caps missing recovery and never revives", () => {
    expect(
      supplyRecovery(
        { hp: 1, maxHp: 2000, mp: 0, maxMp: 1000 },
        "greater-potion",
      ),
    ).toBe(500);
    expect(
      supplyRecovery({ hp: 1, maxHp: 2000, mp: 0, maxMp: 1000 }, "royal-ether"),
    ).toBe(500);
    for (const id of SUPPLY_IDS) {
      expect(
        supplyRecovery({ hp: 0, maxHp: 2000, mp: 0, maxMp: 1000 }, id),
      ).toBe(0);
      expect(
        supplyRecovery({ hp: 1999, maxHp: 2000, mp: 999, maxMp: 1000 }, id),
      ).toBe(1);
    }
  });
  it("uses brewed supplies in the field and battle with exactly one item and a real turn", () => {
    let c = brew(fixture(), "greater-potion", 2);
    const units = adventureParty(c);
    c.campaign!.vitals = {
      day: period("daily"),
      members: Object.fromEntries(units.map((u) => [u.id, { ...u, hp: 1 }])),
    };
    c = useSupply(c, "hero", "greater-potion");
    expect(c.campaign!.inventory["greater-potion"]).toBe(1);
    expect(adventureParty(c)[0].hp).toBe(Math.min(units[0].maxHp, 151));
    const b = startBattle(c, "mossfall-1").campaign!.battle!;
    b.party[0].hp = 1;
    const next = takeAction(b, { kind: "greater-potion", target: 0 });
    expect(next.items["greater-potion"]).toBe(0);
    expect(next.actor).not.toBe(b.actor);
    expect(next.party[0].hp).toBe(Math.min(b.party[0].maxHp, 151));
    expect(next.log.some((l) => l.includes("Greater potion"))).toBe(true);
    expect(takeAction(b, { kind: "royal-potion", target: 0 })).toBe(b);
  });
  it("tempers owned gear once per transaction with increasing prices and combat-only effects", () => {
    let c = equip(buy(fixture(), "alderhaven-blade"), "alderhaven-blade");
    const before = structuredClone(c),
      s = stats(c),
      attack = combatAttributes(c).STR,
      xp = totalXP(c);
    expect(temperQuote(c, "alderhaven-blade")).toMatchObject({
      gold: 300,
      quantity: 3,
      current: { STR: 3 },
      upgraded: { STR: 4 },
    });
    c = temper(c, "alderhaven-blade");
    expect(c.campaign!.gold).toBe(before.campaign!.gold - 300);
    expect(c.campaign!.inventory.softwood).toBe(
      before.campaign!.inventory.softwood - 3,
    );
    expect(combatAttributes(c).STR).toBe(attack + 1);
    expect(stats(c)).toEqual(s);
    expect(totalXP(c)).toBe(xp);
    expect(temperQuote(c, "alderhaven-blade")).toMatchObject({
      gold: 600,
      quantity: 4,
      rank: 1,
    });
    expect(before.campaign!.gearUpgrades).toBeUndefined();
    expect(validateCharacter(c)).toBe(true);
  });
  it("retains ranks across equipment changes and backup round trips, stops at +5", () => {
    let c = buy(fixture(), "alderhaven-blade");
    for (let i = 0; i < 5; i++) c = temper(c, "alderhaven-blade");
    expect(c.campaign!.gearUpgrades!["alderhaven-blade"]).toBe(5);
    expect(temper(c, "alderhaven-blade")).toBe(c);
    c = JSON.parse(JSON.stringify(c));
    expect(validateCharacter(c)).toBe(true);
    c = equip(c, "alderhaven-blade");
    expect(gearModifiers(c, TOWN_GEAR[0])).toEqual({ STR: 8 });
    c = equip(c, "training-sword");
    expect(c.campaign!.gearUpgrades!["alderhaven-blade"]).toBe(5);
  });
  it("does not heal or revive when a tempered CON item raises maximum HP", () => {
    let c = equip(buy(fixture(), "alderhaven-armor"), "alderhaven-armor");
    const before = adventureParty(c);
    c = temper(c, "alderhaven-armor");
    const after = adventureParty(c);
    expect(after[0].maxHp).toBe(before[0].maxHp + 5);
    expect(after[0].hp).toBe(before[0].hp);
    c.campaign!.vitals!.members.hero.hp = 0;
    c = temper(c, "alderhaven-armor");
    expect(adventureParty(c)[0].hp).toBe(0);
  });
  it("blocks workshops during any battle snapshot and rejects unowned, foreign, legacy or short orders", () => {
    let c = fixture();
    expect(temper(c, "alderhaven-blade")).toBe(c);
    expect(temper(c, "training-sword")).toBe(c);
    c = buy(c, "alderhaven-blade");
    c.campaign!.inventory.softwood = 2;
    expect(temper(c, "alderhaven-blade")).toBe(c);
    c.campaign!.inventory.softwood = 100;
    c.campaign!.gold = 299;
    expect(temper(c, "alderhaven-blade")).toBe(c);
    c.campaign!.gold = 10000;
    c.campaign!.world!.townId = "brassford";
    expect(temper(c, "alderhaven-blade")).toBe(c);
    c.campaign!.world!.townId = "alderhaven";
    c = startBattle(c, "mossfall-1");
    for (const phase of ["player", "won", "lost", "fled"] as const) {
      c.campaign!.battle!.phase = phase;
      expect(temper(c, "alderhaven-blade")).toBe(c);
      expect(brew(c, "greater-potion")).toBe(c);
    }
  });
  it("rejects corrupt upgrade records while accepting older saves without upgrades", () => {
    const c = fixture();
    expect(validateCharacter(c)).toBe(true);
    for (const value of [
      null,
      [],
      { nope: 1 },
      { "alderhaven-blade": 1 },
      { "training-sword": 1 },
    ]) {
      c.campaign!.gearUpgrades = value as never;
      expect(validateCharacter(c)).toBe(false);
    }
    c.campaign!.inventory["alderhaven-blade"] = 1;
    for (const n of [0, -1, 0.5, 6, Infinity]) {
      c.campaign!.gearUpgrades = { "alderhaven-blade": n };
      expect(validateCharacter(c)).toBe(false);
    }
  });
  it("shows delivery tradeoffs for brewing and the next owned-item upgrade", () => {
    const c = buy(fixture(), "alderhaven-blade");
    c.campaign!.inventory.softwood = 6;
    c.campaign!.inventory.sunleaf = 6;
    expect(
      deliveryCost(c, "alderhaven-ore")!.workshopAffected.some(
        (r) => r.id === "temper-alderhaven-blade",
      ),
    ).toBe(true);
    expect(
      deliveryCost(c, "alderhaven-herbs")!.workshopAffected.map((r) => r.id),
    ).toContain("greater-potion");
  });
});
