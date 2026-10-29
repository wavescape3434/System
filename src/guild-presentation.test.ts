import { describe, it, expect } from "vitest";
import { demoCharacter, objectives, totalXP, stats } from "./domain";
import { campaign, startBattle } from "./rpg";
import {
  PLACES,
  WORLD_ENCOUNTERS,
  WORLD_CONTRACTS,
  TOTAL_STAGES,
} from "./world-catalog";
import {
  placeOpen,
  placeCleared,
  regionOpen,
  upgradeAdventureStages,
  validWorld,
} from "./world-state";
import { explore } from "./world";
import { validateCharacter } from "./storage";
import { requestBrief } from "./request-brief";

describe("ten-stage routes", () => {
  it("contains 240 named stage encounters, with a terminal boss and no missing or duplicate identifiers", () => {
    expect(TOTAL_STAGES).toBe(240);
    for (const p of PLACES) {
      expect(p.stages).toHaveLength(10);
      expect(new Set(p.stages).size).toBe(10);
      for (const id of p.stages) {
        const e = WORLD_ENCOUNTERS.find((e) => e.id === id)!;
        expect(e.kind).toBe("stage");
        expect(e.name).not.toContain("undefined");
        expect(e.enemies.length).toBeGreaterThan(0);
      }
    }
    expect(new Set(WORLD_ENCOUNTERS.map((e) => e.id)).size).toBe(
      WORLD_ENCOUNTERS.length,
    );
    for (const contract of WORLD_CONTRACTS.filter(
      (c) => c.kind === "dungeon",
    )) {
      expect(contract.quantity).toBe(
        PLACES.find((p) => p.id === contract.placeId)!.stages.length,
      );
    }
  });
  it("does not give new characters exploration, a new area or a new region after only four stages", () => {
    let c = demoCharacter();
    c.campaign = { ...campaign(c), cleared: PLACES[0].stages.slice(0, 4) };
    expect(placeCleared(campaign(c), PLACES[0].id)).toBe(false);
    expect(placeOpen(campaign(c), PLACES[1].id)).toBe(false);
    expect(regionOpen(campaign(c), "quarry")).toBe(false);
    expect(explore(c, PLACES[0].id)).toBe(c);
    expect(startBattle(c, PLACES[0].stages[9])).toBe(c);
    c.campaign = { ...campaign(c), cleared: PLACES[0].stages.slice(0, 9) };
    expect(
      campaign(startBattle(c, PLACES[0].stages[9])).battle?.encounterId,
    ).toBe("mossfall-boss");
  });
  it("retains old completed routes and companions without inventing clears or rewards for added stages", () => {
    const c = demoCharacter();
    c.campaign = {
      ...campaign(c),
      cleared: ["mossfall-1", "mossfall-2", "mossfall-boss", "mossfall-path-4"],
      roster: ["mira", "orin"],
      gold: 150,
    };
    delete c.campaign.world!.stageVersion;
    const before = stats(c),
      next = upgradeAdventureStages(c);
    expect(next.campaign!.world!.stageVersion).toBe(2);
    expect(next.campaign!.cleared).toEqual(c.campaign.cleared);
    expect(next.campaign!.cleared).not.toContain("mossfall-path-3");
    expect(next.campaign!.roster).toEqual(["mira", "orin"]);
    expect(next.campaign!.gold).toBe(150);
    expect(totalXP(next)).toBe(totalXP(c));
    expect(stats(next)).toEqual(before);
    expect(placeCleared(campaign(next), PLACES[0].id)).toBe(true);
    expect(placeOpen(campaign(next), PLACES[1].id)).toBe(true);
    expect(regionOpen(campaign(next), "quarry")).toBe(true);
    expect(validateCharacter(next)).toBe(true);
    expect(upgradeAdventureStages(next)).toBe(next);
    expect(
      validWorld({ ...next.campaign!.world!, preservedPlaces: ["invented"] }),
    ).toBe(false);
  });
});
describe("specific request instructions", () => {
  it("keeps rank workload, topic-specific protocols, calendar targets and career work distinct", () => {
    const c = demoCharacter(),
      list = objectives(c);
    const push = list.find((o) => o.id === "u-floor-push-20")!;
    const pushBrief = requestBrief(push, c);
    expect(pushBrief.steps.join(" ")).toContain("3 sets × 6–12");
    expect(pushBrief.record).toContain("repetitions in each set");
    const bible = list.find((o) => o.id === "u-bible-recall")!;
    expect(requestBrief(bible, c).steps.join(" ")).toContain(
      "speaker, audience",
    );
    const subnet = list.find((o) => o.id === "network-subnet-daily")!;
    expect(requestBrief(subnet, c).steps.join(" ")).toContain(
      "broadcast address",
    );
    const monthly = list.find(
      (o) => o.cadence === "monthly" && o.minimumSessions,
    )!;
    expect(requestBrief(monthly, c).finish).toContain(
      `${monthly.minimumSessions} different practice days`,
    );
    for (const o of list) {
      const brief = requestBrief(o, c);
      expect(brief.steps).toHaveLength(
        o.workout ? o.workout.exercises.length + 2 : 3,
      );
      expect(brief.record.length).toBeGreaterThan(20);
      expect(brief.steps.join(" ")).not.toContain("undefined");
    }
  });
});
