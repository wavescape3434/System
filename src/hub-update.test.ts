import { describe, it, expect, vi, afterEach } from "vitest";
import {
  demoCharacter,
  objectives,
  takeRequest,
  stats,
  SKILLS,
  learnSkill,
  skillPointsAvailable,
  vocationLevel,
  vocationXP,
} from "./domain";
import { campaign, startBattle, act, claimVictory } from "./rpg";
import { PLACES } from "./world-catalog";
import { continueAdventure, returnToMap, explore } from "./world";
import { loginReward, claimLoginReward, LOGIN_REWARDS } from "./login-rewards";
import { notificationFeed } from "./Notifications";
import { reminderPlan, deadlineReminder } from "./reminders";
import { validateCharacter } from "./storage";
import { recordJourney } from "./journey-events";
const now = new Date(2027, 1, 6, 12);
const won = (c = demoCharacter(), id = PLACES[0].stages[0]) => {
  const next = startBattle(c, id);
  next.campaign!.battle!.phase = "won";
  next.campaign!.battle!.enemies.forEach((e) => (e.hp = 0));
  return next;
};
afterEach(() => vi.useRealTimers());
describe("expedition continuity", () => {
  it("claims exactly once, continues all ten stages, then explores without opening the map", () => {
    let c = demoCharacter();
    const initial = campaign(c).gold;
    for (let i = 0; i < PLACES[0].stages.length; i++) {
      c = won(c, PLACES[0].stages[i]);
      const paid = campaign(claimVictory(c)).gold;
      c = recordJourney(
        c,
        continueAdventure(c, () => 0.9, now),
        now,
      );
      expect(c.campaign!.gold).toBe(
        paid + (i === PLACES[0].stages.length - 1 ? 15 : 0),
      );
      expect(
        c.journeyEvents?.filter((e) => e.kind === "adventure"),
      ).toHaveLength(i + 1);
      expect(c.campaign!.world!.expedition).toBe(PLACES[0].id);
      expect(c.campaign!.cleared).toContain(PLACES[0].stages[i]);
      if (i < PLACES[0].stages.length - 1)
        expect(c.campaign!.battle!.encounterId).toBe(PLACES[0].stages[i + 1]);
      else {
        expect(c.campaign!.battle).toBeUndefined();
        expect(c.campaign!.world!.areas[PLACES[0].id].visits).toBe(1);
      }
      expect(validateCharacter(c)).toBe(true);
    }
    expect(c.campaign!.gold).toBeGreaterThan(initial);
    const before = c.campaign!.gold;
    expect(continueAdventure(c)).toBe(c);
    const map = returnToMap(c);
    expect(map.campaign!.world!.expedition).toBeUndefined();
    expect(map.campaign!.gold).toBe(before);
  });
  it("blocks continuation during combat and after defeat, retains boss danger when returning", () => {
    let c = startBattle(demoCharacter(), PLACES[0].stages[0]);
    expect(continueAdventure(c)).toBe(c);
    expect(returnToMap(c)).toBe(c);
    c.campaign!.battle!.phase = "lost";
    expect(continueAdventure(c)).toBe(c);
    const map = returnToMap(c);
    expect(map.campaign!.battle).toBeUndefined();
    expect(map.campaign!.cleared).toHaveLength(0);
  });
  it("retains an expedition through save and load, including discoveries and boss choices", () => {
    let c = demoCharacter();
    c.campaign = { ...campaign(c), cleared: [...PLACES[0].stages] };
    const rolls = [0, 0.6, 0, 0];
    c = explore(c, PLACES[0].id, () => rolls.shift() ?? 0, now);
    expect(c.campaign!.world!.areas[PLACES[0].id].last!.kind).toBe("boss");
    expect(validateCharacter(JSON.parse(JSON.stringify(c)))).toBe(true);
    expect(c.campaign!.world!.expedition).toBe(PLACES[0].id);
  });
});
describe("daily allowance and attention notifications", () => {
  it("pays gold and supplies once per local day, retains the seven-day cycle across missed days, never grants XP/stats", () => {
    let c = demoCharacter();
    const base = stats(c),
      original = campaign(c),
      initialXP = c.completions.length;
    let gold = 0,
      potions = 0,
      ethers = 0;
    for (let i = 0; i < 8; i++) {
      const day = new Date(2027, 1, 6 + i * 2, 21);
      const r = LOGIN_REWARDS[i % 7];
      const before = c;
      c = claimLoginReward(c, day);
      expect(c).not.toBe(before);
      expect(claimLoginReward(c, day)).toBe(c);
      gold += r.gold;
      potions += r.potion;
      ethers += r.ether;
      expect(c.loginRewards!.at(-1)!.cycleDay).toBe((i % 7) + 1);
      expect(validateCharacter(c)).toBe(true);
    }
    expect(c.campaign!.gold - original.gold).toBe(gold);
    expect(c.campaign!.inventory.potion - original.inventory.potion).toBe(
      potions,
    );
    expect(c.campaign!.inventory.ether - original.inventory.ether).toBe(ethers);
    expect(c.completions).toHaveLength(initialXP);
    expect(stats(c)).toEqual(base);
    expect(loginReward(c, new Date(2027, 1, 5)).claimed).toBe(true);
  });
  it("keeps claimed supplies when a battle consumes an item or resolves an action", () => {
    let c = startBattle(demoCharacter(), PLACES[0].stages[0]);
    const before = campaign(c).inventory.potion;
    c = claimLoginReward(c, now);
    c = act(c, { kind: "guard", target: 0 });
    expect(c.campaign!.inventory.potion).toBe(before + 1);
  });
  it("shows claimable rewards and pending deadlines, without replaying completed requests or Journey events", () => {
    let c = demoCharacter();
    c.completions.push({
      id: "fake-record",
      title: "Completed request",
      at: now.toISOString(),
      period: "2027-02-06",
      xp: 10,
      gold: 2,
      stat: "STR",
      classId: "warrior",
    });
    expect(
      notificationFeed(c, now).some((n) => n.title === "Completed request"),
    ).toBe(false);
    expect(notificationFeed(c, now).filter((n) => n.reward)).toHaveLength(1);
    c = claimLoginReward(c, now);
    expect(notificationFeed(c, now).filter((n) => n.reward)).toHaveLength(0);
  });
  it("rejects malformed allowances, duplicate claim days, and invalid reminder time settings in backups", () => {
    const c = claimLoginReward(demoCharacter(), now);
    expect(validateCharacter(c)).toBe(true);
    expect(
      validateCharacter({
        ...c,
        loginRewards: [...c.loginRewards!, ...c.loginRewards!],
      }),
    ).toBe(false);
    expect(
      validateCharacter({
        ...c,
        loginRewards: [
          { day: "2027-02-06", at: now.toISOString(), cycleDay: 7 },
        ],
      }),
    ).toBe(false);
    expect(
      validateCharacter({
        ...c,
        preferences: {
          units: "metric",
          textSize: "standard",
          equipment: ["bodyweight"],
          reduceMotion: false,
          showLockedRequests: true,
          defaultPage: "guild",
          reminders: {
            daily: true,
            weekly: true,
            monthly: true,
            time: "25:00",
          },
        },
      }),
    ).toBe(false);
  });
});
describe("reminders and early choices", () => {
  it("defaults to next local 9pm and derives weekly/monthly dates from real calendar boundaries", () => {
    const c = demoCharacter();
    expect(reminderPlan(c, now)[0].at.getHours()).toBe(21);
    expect(reminderPlan(c, new Date(2027, 1, 6, 22))[0].at.getDate()).toBe(7);
    const week = deadlineReminder("weekly", "21:00", now);
    expect(week.getDay()).toBe(6);
    const month = deadlineReminder("monthly", "21:00", now);
    expect(month.getDate()).toBe(27);
    expect(month.getMonth()).toBe(1);
    expect(
      deadlineReminder("monthly", "08:30", new Date(2028, 1, 10)).getDate(),
    ).toBe(28);
  });
  it("schedules only pending accepted commitments, consolidates same-cadence deadlines, and honors toggles", () => {
    const date = new Date(2027, 1, 2, 10);
    let c = demoCharacter();
    for (const cadence of ["weekly", "monthly"] as const) {
      const o = objectives(c).find(
        (o) => o.cadence === cadence && o.scope === "universal",
      )!;
      c = takeRequest(c, o.id, date);
    }
    expect(reminderPlan(c, date)).toHaveLength(3);
    expect(reminderPlan(demoCharacter(), date)).toHaveLength(1);
    c.preferences = {
      units: "metric",
      textSize: "standard",
      reduceMotion: false,
      equipment: ["bodyweight"],
      showLockedRequests: true,
      defaultPage: "guild",
      reminders: { daily: false, weekly: false, monthly: false, time: "20:30" },
    };
    expect(reminderPlan(c, date)).toHaveLength(0);
  });
  it("offers multiple usable first-point styles in every class family and preserves historical spending", () => {
    for (const family of [
      "fighter",
      "guardian",
      "ranger",
      "rogue",
      "mage",
      "cleric",
      "bard",
      "artificer",
    ])
      expect(
        SKILLS.filter(
          (s) =>
            s.archetype === family &&
            s.requiredLevel === 1 &&
            s.cost === 1 &&
            s.combat,
        ),
      ).toHaveLength(family === "fighter" ? 8 : 4);
    let c = demoCharacter();
    c.completions = [
      {
        id: "training",
        title: "training",
        xp: 100,
        at: now.toISOString(),
        period: "day",
        classId: "warrior",
        stat: "STR",
        scope: "class",
      },
    ];
    const before = stats(c);
    c = learnSkill(c, "opening-fighter-0-0");
    expect(c.earnedSkills).toContain("opening-fighter-0-0");
    expect(skillPointsAvailable(c, "combat")).toBe(0);
    expect(stats(c)).toEqual(before);
    c.skillPurchases = [{ id: "arc-fighter-1", wallet: "combat", cost: 4 }];
    expect(skillPointsAvailable(c, "combat")).toBe(0);
    expect(vocationLevel(demoCharacter())).toBe(1);
  });
  it("keeps vocation levels independent and credits only related career work and explicit universal transfer", () => {
    const c = demoCharacter();
    c.completions = [
      {
        id: "analyst",
        title: "Analyst practice",
        xp: 200,
        at: now.toISOString(),
        period: "test",
        classId: "warrior",
        scope: "profession",
        stat: "INT",
        careerCategory: "business",
        vocationId: "networking",
      },
      {
        id: "network",
        title: "Networking",
        xp: 100,
        at: now.toISOString(),
        period: "test2",
        classId: "warrior",
        scope: "profession",
        stat: "INT",
        careerCategory: "technology",
        vocationId: "networking",
      },
      {
        id: "reading",
        title: "Reading",
        xp: 100,
        at: now.toISOString(),
        period: "test3",
        classId: "warrior",
        scope: "universal",
        stat: "INT",
        vocationCredit: { id: "networking", category: "technology", xp: 25 },
      },
    ];
    expect(vocationXP(c)).toBe(125);
    expect(vocationLevel(c)).toBe(2);
  });
});
