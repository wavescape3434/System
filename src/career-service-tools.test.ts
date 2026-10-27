import { describe, it, expect } from "vitest";
import { demoCharacter, stats, totalXP, objectives } from "./domain";
import {
  campaign,
  adventureParty,
  takeAction,
  startBattle,
  encounterEnemies,
  SUPPLY_RESTORE,
  breaksShellImmediately,
} from "./rpg";
import { CAREER_UTILITIES } from "./career-payoffs";
import {
  routePlan,
  fieldRecord,
  fieldRecordText,
  recoveryTriage,
  battlePrimer,
  contractWrit,
  companionServices,
} from "./career-service-tools";
import { PLACES } from "./world-catalog";
import { takeWorldContract, completeWorldContract } from "./world";
import { period } from "./domain";
const fixture = () => {
  const c = demoCharacter();
  c.campaign = campaign(c);
  c.earnedSkills = [
    ...c.earnedSkills,
    ...CAREER_UTILITIES.map((u) => u.skills[0]),
  ];
  return c;
};
describe("service profession fieldwork", () => {
  it("requires ownership and rejects unknown routes/contracts", () => {
    const c = demoCharacter();
    expect(routePlan(c, "mossfall-path")).toBeNull();
    expect(fieldRecord(c)).toBeNull();
    expect(fieldRecordText(c)).toBeNull();
    expect(recoveryTriage(c)).toBeNull();
    expect(battlePrimer(c, "mossfall-path")).toBeNull();
    expect(contractWrit(c, "alderhaven-herbs")).toBeNull();
    expect(companionServices(c)).toBeNull();
    expect(routePlan(fixture(), "unknown")).toBeNull();
    expect(contractWrit(fixture(), "unknown")).toBeNull();
  });
  it("plans the actual region and same-region prerequisites without duplicate stages", () => {
    const c = fixture(),
      r = routePlan(c, "quarry-dungeon")!;
    expect(r).toMatchObject({
      open: false,
      remaining: 30,
      next: "mossfall-path",
      targetRemaining: 10,
    });
    expect(r.steps.map((s) => s.id)).toEqual([
      "mossfall-path",
      "quarry-path",
      "quarry-wilds",
    ]);
    c.campaign!.cleared = [
      ...PLACES.find((p) => p.id === "mossfall-path")!.stages,
    ];
    expect(routePlan(c, "quarry-dungeon")).toMatchObject({
      remaining: 20,
      next: "quarry-path",
    });
  });
  it("honors preserved access rather than inventing more route locks", () => {
    const c = fixture();
    c.campaign!.world!.preservedPlaces = ["mossfall-dungeon"];
    expect(routePlan(c, "mossfall-dungeon")).toMatchObject({
      open: true,
      remaining: 0,
      next: "mossfall-dungeon",
    });
    expect(routePlan(c, "frost-dungeon")!.remaining).toBe(90);
  });
  it("reports observed journal counts separately from lifetime confirmed defeats and exports them", () => {
    const c = fixture();
    c.campaign!.world!.journal = [
      {
        id: "a",
        placeId: "mossfall-path",
        kind: "gather",
        at: new Date().toISOString(),
        text: "Found herbs",
        resource: "sunleaf",
        quantity: 3,
      },
      {
        id: "b",
        placeId: "quarry-path",
        kind: "encounter",
        at: new Date().toISOString(),
        text: "A crawler",
      },
    ];
    c.campaign!.world!.kills = {
      "mossfall-path:slime": 12,
      "mossfall-path": 12,
    };
    expect(fieldRecord(c, "mossfall-path")).toMatchObject({
      total: 1,
      recordLimit: 120,
      outcomes: { gather: 1, encounter: 0 },
      creatures: [{ name: "Forest Slime", count: 12 }],
      gathered: [{ id: "sunleaf", count: 3 }],
    });
    expect(fieldRecord(c)!.total).toBe(2);
    expect(fieldRecordText(c, "mossfall-path")).toContain("lifetime counters");
    expect(fieldRecordText(c, "mossfall-path")).toContain("Sunleaf: 3");
  });
  it("caps projected recovery, blocks fallen members and leaves reserves unchanged until midnight", () => {
    const c = fixture(),
      now = new Date(),
      units = adventureParty(c, now),
      hero = units[0],
      mira = units[1];
    c.campaign!.vitals = {
      day: period("daily", now),
      members: {
        [hero.id]: { ...hero, hp: hero.maxHp - 5, mp: hero.maxMp - 2 },
        [mira.id]: { ...mira, hp: 0, mp: 0 },
      },
    };
    const report = recoveryTriage(c, now)!;
    expect(report.members.find((m) => m.id === hero.id)).toMatchObject({
      potion: 5,
      potionWaste: 45,
      ether: 2,
      etherWaste: 18,
    });
    expect(report.members.find((m) => m.id === "mira")).toMatchObject({
      alive: false,
      potion: 0,
      ether: 0,
    });
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );
    expect(report.nextRest).toBe(tomorrow.toISOString());
    expect(
      recoveryTriage(c, tomorrow)!.members.every(
        (m) => m.hp === m.maxHp && m.mp === m.maxMp,
      ),
    ).toBe(true);
  });
  it("uses the same potion recovery as a real battle action", () => {
    let c = fixture();
    c = startBattle(c, "mossfall-1");
    const b = c.campaign!.battle!;
    b.party[0].hp = 1;
    const next = takeAction(b, { kind: "potion", target: 0 });
    expect(next.party[0].hp).toBe(
      Math.min(b.party[0].maxHp, 1 + SUPPLY_RESTORE.potion),
    );
  });
  it("reads only equipped abilities, actual shells and MP readiness for the next stage", () => {
    const c = fixture();
    const r = battlePrimer(c, "mossfall-path")!;
    expect(r.id).toBe("mossfall-1");
    expect(r.enemies.map((e) => e.shell)).toEqual(
      encounterEnemies(r.id).map((e) => e.shell || 0),
    );
    const party = adventureParty(c),
      known = party.flatMap((u) => u.abilities.map((a) => a.id));
    expect(
      [...r.breakers, ...r.guards].every((a) => known.includes(a.id)),
    ).toBe(true);
    c.campaign!.vitals = {
      day: period("daily"),
      members: Object.fromEntries(party.map((u) => [u.id, { ...u, mp: 0 }])),
    };
    expect(
      battlePrimer(c, "mossfall-path")!
        .breakers.filter((a) => a.mp > 0)
        .every((a) => !a.available && a.shortfall === a.mp),
    ).toBe(true);
    c.campaign!.vitals.members.mira.hp = 0;
    expect(
      battlePrimer(c, "mossfall-path")!.breakers.find(
        (a) => a.actor === "Mira",
      ),
    ).toMatchObject({ alive: false, available: false });
    c.campaign!.cleared = [
      ...PLACES.find((p) => p.id === "mossfall-path")!.stages,
    ];
    expect(battlePrimer(c, "mossfall-path")).toBeNull();
    expect(battlePrimer(c, "frost-path")).toBeNull();
    expect(breaksShellImmediately("scan")).toBe(true);
    expect(breaksShellImmediately("heal")).toBe(false);
  });
  it("explains delivery consumption without performing a turn-in", () => {
    let c = fixture();
    c = takeWorldContract(c, "alderhaven-herbs");
    c.campaign!.inventory.sunleaf = 8;
    expect(contractWrit(c, "alderhaven-herbs")).toMatchObject({
      taken: true,
      canReport: true,
      progress: 6,
      consumes: { quantity: 6, carried: 8, after: 2 },
    });
    const next = completeWorldContract(c, "alderhaven-herbs");
    expect(next.campaign!.inventory.sunleaf).toBe(2);
    expect(c.campaign!.inventory.sunleaf).toBe(8);
  });
  it("matches hunt baselines, one-time dungeon payout and calendar-linked real-world requirements", () => {
    let c = fixture();
    c.campaign!.world!.kills["mossfall-path:slime"] = 20;
    c = takeWorldContract(c, "alderhaven-monster");
    expect(contractWrit(c, "alderhaven-monster")).toMatchObject({
      progress: 0,
      baseline: 20,
    });
    c.campaign!.world!.kills["mossfall-path:slime"] = 22;
    expect(contractWrit(c, "alderhaven-monster")!.progress).toBe(2);
    const dungeon = objectives(c).find((o) => o.adventureRequirement);
    if (!dungeon) throw Error("Expected hybrid objective");
    const id = dungeon.adventureRequirement!;
    const links = contractWrit(c, id)!.links;
    expect(
      links.some((o) => o.id === dungeon.id && o.kind === "Required" && !o.met),
    ).toBe(true);
    c.campaign!.world!.receipts.push({
      id: "paid",
      contractId: "alderhaven-dungeon",
      at: new Date().toISOString(),
      gold: 1,
    });
    expect(contractWrit(c, "alderhaven-dungeon")).toMatchObject({
      once: true,
      canAccept: false,
      alreadyPaid: true,
    });
  });
  it("distinguishes unlock eligibility from recruitment and active party membership", () => {
    const c = fixture();
    expect(companionServices(c)!.find((n) => n.id === "mira")).toMatchObject({
      recruited: true,
      active: true,
      eligible: true,
    });
    expect(companionServices(c)!.find((n) => n.id === "orin")).toMatchObject({
      eligible: false,
      recruited: false,
      reachable: true,
      encounterReady: false,
    });
    c.campaign!.cleared = [
      ...PLACES.find((p) => p.id === "mossfall-path")!.stages,
    ];
    expect(companionServices(c)!.find((n) => n.id === "orin")).toMatchObject({
      eligible: true,
      recruited: false,
      active: false,
    });
    expect(companionServices(c)!.find((n) => n.id === "elara")!.reachable).toBe(
      false,
    );
  });
  it("all six tools are read-only across campaign and real-world progression", () => {
    const c = fixture(),
      before = structuredClone(c),
      xp = totalXP(c),
      s = stats(c);
    routePlan(c, "frost-dungeon");
    fieldRecord(c);
    fieldRecordText(c);
    recoveryTriage(c);
    battlePrimer(c, "mossfall-path");
    contractWrit(c, "alderhaven-herbs");
    companionServices(c);
    expect(c).toEqual(before);
    expect(totalXP(c)).toBe(xp);
    expect(stats(c)).toEqual(s);
  });
});
