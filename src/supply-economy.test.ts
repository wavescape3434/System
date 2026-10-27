import { describe, it, expect, vi, afterEach } from "vitest";
import { demoCharacter, stats, totalXP, period } from "./domain";
import {
  campaign,
  adventureParty,
  useSupply,
  buy,
  startBattle,
  takeAction,
  equip,
  combatAttributes,
} from "./rpg";
import { supplyQuote, supplyRecovery } from "./supplies";
import { deliveryCost } from "./delivery-cost";
import { TOWN_GEAR, TOWNS } from "./world-catalog";
import { completeWorldContract, takeWorldContract } from "./world";
import { validateCharacter } from "./storage";
import { simulateEconomy, ECONOMY_START } from "./economy-simulation";
const fixture = () => {
  const c = demoCharacter();
  c.campaign = campaign(c);
  c.campaign.gold = 500;
  c.campaign.world!.stock.alderhaven = { potion: 8, ether: 6 };
  return c;
};
const damage = () => {
  const c = fixture(),
    units = adventureParty(c);
  c.campaign!.vitals = {
    day: period("daily"),
    members: Object.fromEntries(
      units.map((u) => [u.id, { ...u, hp: u.maxHp - 5, mp: u.maxMp - 2 }]),
    ),
  };
  return c;
};
afterEach(() => vi.useRealTimers());
describe("supply economy", () => {
  it("quotes whole batches against both currency and actual stock", () => {
    expect(supplyQuote(100, 6, "potion", 3)).toMatchObject({
      canBuy: true,
      total: 60,
    });
    expect(supplyQuote(30, 2, "potion", 3)).toMatchObject({
      canBuy: false,
      goldShortfall: 30,
      stockShortfall: 1,
    });
    for (const n of [0, -1, 0.5, 100, NaN, Infinity])
      expect(supplyQuote(100, 10, "potion", n).valid).toBe(false);
  });
  it("buys a batch atomically without changing reserves or progression", () => {
    const c = damage(),
      xp = totalXP(c),
      s = stats(c),
      before = structuredClone(c),
      next = buy(c, "potion", 3);
    expect(next.campaign!.gold).toBe(440);
    expect(next.campaign!.inventory.potion).toBe(
      c.campaign!.inventory.potion + 3,
    );
    expect(next.campaign!.world!.stock.alderhaven.potion).toBe(5);
    expect(next.campaign!.vitals).toEqual(c.campaign!.vitals);
    expect(totalXP(next)).toBe(xp);
    expect(stats(next)).toEqual(s);
    expect(c).toEqual(before);
    expect(validateCharacter(next)).toBe(true);
  });
  it("rejects partial purchases, invalid quantities, repeated equipment and gear batches", () => {
    const c = fixture();
    expect(buy(c, "potion", 9)).toBe(c);
    c.campaign!.gold = 20;
    expect(buy(c, "ether", 1)).toBe(c);
    for (const n of [0, -1, 1.5, NaN, 100]) expect(buy(c, "potion", n)).toBe(c);
    expect(buy(c, "alderhaven-blade", 2)).toBe(c);
    expect(buy(c, "unknown", 1)).toBe(c);
  });
  it("restores only missing HP and MP, consuming exactly one carried item", () => {
    let c = damage();
    const s = stats(c),
      xp = totalXP(c),
      old = c.campaign!.inventory.potion;
    c = useSupply(c, "hero", "potion");
    const u = adventureParty(c)[0];
    expect(u.hp).toBe(u.maxHp);
    expect(c.campaign!.inventory.potion).toBe(old - 1);
    const ether = c.campaign!.inventory.ether;
    c = useSupply(c, "hero", "ether");
    expect(adventureParty(c)[0].mp).toBe(u.maxMp);
    expect(c.campaign!.inventory.ether).toBe(ether - 1);
    expect(stats(c)).toEqual(s);
    expect(totalXP(c)).toBe(xp);
    expect(validateCharacter(JSON.parse(JSON.stringify(c)))).toBe(true);
  });
  it("caps large deficits at the item effect and preserves damage after use", () => {
    const c = damage();
    c.campaign!.vitals!.members.hero.hp = 1;
    const u = adventureParty(c)[0],
      next = useSupply(c, "hero", "potion");
    expect(adventureParty(next)[0].hp).toBe(Math.min(u.maxHp, 51));
    expect(next.campaign!.vitals!.members.mira.hp).toBe(
      c.campaign!.vitals!.members.mira.hp,
    );
  });
  it("does not spend on full, fallen, absent or benched targets", () => {
    let c = fixture();
    expect(useSupply(c, "hero", "potion")).toBe(c);
    expect(useSupply(c, "unknown", "ether")).toBe(c);
    expect(useSupply(c, "orin", "potion")).toBe(c);
    c = damage();
    c.campaign!.vitals!.members.mira.hp = 0;
    expect(useSupply(c, "mira", "potion")).toBe(c);
    expect(useSupply(c, "mira", "ether")).toBe(c);
    c.campaign!.inventory.potion = 0;
    expect(useSupply(c, "hero", "potion")).toBe(c);
  });
  it("keeps item recovery in persistent reserves until the actual local midnight", () => {
    vi.useFakeTimers();
    const now = new Date(2027, 1, 1, 23, 59);
    vi.setSystemTime(now);
    const c = damage(),
      next = useSupply(c, "hero", "potion");
    expect(adventureParty(next)[1].hp).toBeLessThan(
      adventureParty(next)[1].maxHp,
    );
    vi.setSystemTime(new Date(2027, 1, 2, 0, 0));
    expect(
      adventureParty(next).every((u) => u.hp === u.maxHp && u.mp === u.maxMp),
    ).toBe(true);
  });
  it("blocks field use and shopping while any battle snapshot is present", () => {
    const c = startBattle(damage(), "mossfall-1");
    expect(useSupply(c, "hero", "potion")).toBe(c);
    expect(buy(c, "ether", 1)).toBe(c);
    c.campaign!.battle!.phase = "won";
    expect(useSupply(c, "hero", "potion")).toBe(c);
    expect(buy(c, "ether", 1)).toBe(c);
  });
  it("refuses no-effect battle items without consuming stock or advancing a turn", () => {
    const c = startBattle(fixture(), "mossfall-1"),
      b = c.campaign!.battle!;
    expect(takeAction(b, { kind: "potion", target: 0 })).toBe(b);
    expect(takeAction(b, { kind: "ether", target: 0 })).toBe(b);
    b.party[0].hp -= 5;
    const next = takeAction(b, { kind: "potion", target: 0 });
    expect(next.items.potion).toBe(b.items.potion - 1);
    expect(next.party[0].hp).toBe(b.party[0].maxHp);
    expect(supplyRecovery({ ...b.party[0], hp: 0 }, "ether")).toBe(0);
  });
  it("previews consumed smith materials without reserving or spending them", () => {
    let c = fixture();
    c.campaign!.inventory.softwood = 6;
    c = takeWorldContract(c, "alderhaven-ore");
    const before = structuredClone(c),
      r = deliveryCost(c, "alderhaven-ore")!;
    expect(r).toMatchObject({ quantity: 5, carried: 6, after: 1 });
    expect(r.affected.map((g) => g.id)).toEqual(
      TOWN_GEAR.filter((g) => g.town === "alderhaven").map((g) => g.id),
    );
    expect(c).toEqual(before);
    expect(
      completeWorldContract(c, "alderhaven-ore").campaign!.inventory.softwood,
    ).toBe(1);
    expect(deliveryCost(c, "alderhaven-monster")).toBeNull();
  });
  it("offers a distinct CHA accessory in every town with a real support effect and no base-stat gain", () => {
    let c = fixture();
    c.activeClass = "bard";
    c.baseStats.CHA = 10;
    c.campaign!.inventory.softwood = 2;
    const base = stats(c);
    for (const t of TOWNS) {
      const g = TOWN_GEAR.find((g) => g.town === t.id && g.mod.CHA)!;
      expect(g.slot).toBe("accessory");
      expect(g.mod.CHA).toBeGreaterThanOrEqual(3);
    }
    const plain = startBattle(c, "mossfall-1").campaign!.battle!;
    c = equip(buy(c, "alderhaven-seal"), "alderhaven-seal");
    expect(combatAttributes(c).CHA).toBe(15);
    expect(stats(c)).toEqual(base);
    const geared = startBattle(c, "mossfall-1").campaign!.battle!;
    const cast = (b: typeof plain) =>
      takeAction(b, { kind: "ability", abilityId: "signature-bard", target: 0 })
        .party[0].attack - b.party[0].attack;
    expect(cast(geared)).toBeGreaterThan(cast(plain));
  });
  it("reconciles short deterministic simulations and gives combat no real-world XP", () => {
    vi.useFakeTimers();
    vi.setSystemTime(ECONOMY_START);
    const options = {
      classId: "warrior",
      routine: "login" as const,
      days: 3,
      encounters: 3,
      seed: 3434,
    };
    const first = simulateEconomy(options, (now) => vi.setSystemTime(now));
    vi.setSystemTime(ECONOMY_START);
    const second = simulateEconomy(options, (now) => vi.setSystemTime(now));
    expect(first.gold).toBe(second.gold);
    expect(first.wins).toBe(second.wins);
    expect(first.history.at(-1)!.realXp).toBe(0);
    expect(first.gold).toBe(
      Object.values(first.income).reduce((a, b) => a + b, 0) -
        Object.values(first.spent).reduce((a, b) => a + b, 0),
    );
  }, 20000);
});
