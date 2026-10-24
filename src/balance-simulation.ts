import {
  createCharacter,
  EMPTY_BASELINE,
  objectives,
  takenObjectives,
  takeRequest,
  completeTaken,
  isTaken,
  isComplete,
  objectivePeriod,
  totalXP,
  characterRank,
  classLevel,
  professionLevel,
  awardSkills,
  level,
  stats,
  RANKS,
} from "./domain";
import type { Character } from "./domain";
import { EMPTY_ASSESSMENT } from "./metrics";
import { taskRequirements, requestProgress } from "./training-tasks";
import { validateCharacter } from "./storage";
import { campaign } from "./rpg";
import { recordJourney } from "./journey-events";
export const SIMULATION_START = new Date("2027-01-25T18:00:00Z");
export const SIMULATION_PROFILES = [
  "light",
  "moderate",
  "intensive",
  "intermittent",
] as const;
export type SimulationProfile = (typeof SIMULATION_PROFILES)[number];
export interface SimulationDay {
  day: number;
  xp: number;
  gold: number;
  rank: string;
  playerLevel: number;
  classLevel: number;
  professionLevel: number;
  completed: number;
}
export function simulationCharacter(
  name: string,
  start = SIMULATION_START,
): Character {
  const c = createCharacter(
    name,
    { ...EMPTY_BASELINE, assessment: { ...EMPTY_ASSESSMENT, pushups: 20 } },
    "warrior",
    "Analyst",
  );
  return {
    ...c,
    createdAt: start.toISOString(),
    vocation: "networking",
    demo: false,
    assessmentHistory: c.assessmentHistory?.map((h) => ({
      ...h,
      at: start.toISOString(),
    })),
    preferences: {
      ...c.preferences!,
      equipment: ["bodyweight", "pullup-bar", "gym"],
    },
  };
}
function plan(profile: SimulationProfile, day: number) {
  const weekday = day % 7,
    strength = [0, 2, 4].includes(weekday);
  if (profile === "light")
    return {
      active: true,
      daily: [
        "u-walk-5",
        "u-mobility-5",
        "u-read-5",
        "u-bible-short",
        "u-contact",
      ],
      weekly: ["walk", "mobility", "reading", "scripture", "communication"].map(
        (k) => `habit-${k}-weekly-f`,
      ),
      monthly: [
        "walk",
        "mobility",
        "reading",
        "scripture",
        "communication",
      ].map((k) => `habit-${k}-monthly-f`),
    };
  if (profile === "intermittent")
    return {
      active: [0, 2, 5].includes(weekday),
      daily: ["u-walk-brisk", "u-spaced-recall", "u-bible-recall"],
      weekly: ["habit-walk-weekly-f"],
      monthly: ["habit-walk-monthly-f"],
    };
  if (profile === "moderate")
    return {
      active: true,
      daily: [
        "u-walk-brisk",
        "u-bible-recall",
        ...(weekday === 6
          ? []
          : ["u-spaced-recall", "vocation-networking-daily"]),
        ...(strength ? ["warrior-daily"] : []),
      ],
      weekly: ["warrior-weekly", "vocation-networking-weekly"],
      monthly: ["warrior-monthly"],
    };
  return {
    active: true,
    daily: [
      ...(weekday === 5 ? [] : ["u-walk-brisk"]),
      ...(weekday === 6
        ? []
        : [
            "u-apply-concept",
            "u-chapter-study",
            "u-presentation",
            "profession-daily",
            "vocation-networking-daily",
          ]),
      ...(strength ? ["warrior-daily"] : []),
      ...([1, 5].includes(weekday) ? ["u-floor-push-20", "u-run-5k"] : []),
    ],
    weekly: [
      "warrior-weekly",
      "vocation-networking-weekly",
      "u-teach-topic",
      "q-group-hike",
    ],
    monthly: ["warrior-monthly", "profession-monthly"],
  };
}
export function simulateAccount(profile: SimulationProfile, days = 30) {
  let c = simulationCharacter(`Simulation ${profile}`);
  const history: SimulationDay[] = [],
    log: {
      day: number;
      action: string;
      id: string;
      xp?: number;
      gold?: number;
    }[] = [];
  let clock = SIMULATION_START;
  const commit = (next: Character) => {
    if (next === c) return;
    c = recordJourney(c, awardSkills(next), clock);
  };
  const accept = (id: string, at: Date, day: number) => {
    const o = objectives(c).find((o) => o.id === id);
    if (!o) throw Error(`Missing request ${id}`);
    if (isTaken(c, o, at) && !isComplete(c, o, at)) return;
    if (isComplete(c, o, at) && !o.persistent) return;
    const next = takeRequest(c, id, at);
    if (next !== c) {
      commit(next);
      log.push({ day, action: "take", id });
    }
  };
  const claim = (id: string, at: Date, day: number) => {
    const o = takenObjectives(c, at).find((o) => o.id === id);
    if (!o || isComplete(c, o, at) || taskRequirements(c, o, at).length) return;
    if (o.checklist)
      c = {
        ...c,
        milestones: {
          ...c.milestones,
          [`${o.id}:${objectivePeriod(o, at)}`]: o.checklist.map((_, i) => i),
        },
      };
    const next = completeTaken(c, o, at);
    if (next !== c) {
      commit(next);
      const last = c.completions.at(-1)!;
      log.push({ day, action: "complete", id, xp: last.xp, gold: last.gold });
    }
  };
  for (let i = 0; i < days; i++) {
    const at = new Date(SIMULATION_START);
    at.setUTCDate(at.getUTCDate() + i);
    clock = at;
    const p = plan(profile, i);
    if (p.active) {
      for (const id of [...p.monthly, ...p.weekly]) accept(id, at, i + 1);
      for (const id of p.daily) {
        accept(id, at, i + 1);
        claim(id, at, i + 1);
      }
      for (const id of [...p.weekly, ...p.monthly]) claim(id, at, i + 1);
    }
    // Exercise backup parsing every simulated day, rather than editing balances directly.
    const saved = JSON.parse(JSON.stringify(c));
    if (!validateCharacter(saved))
      throw Error(`${profile} invalid save on day ${i + 1}`);
    c = saved;
    const guild = characterRank(c);
    history.push({
      day: i + 1,
      xp: totalXP(c),
      gold: campaign(c).gold,
      rank: guild.name,
      playerLevel: level(totalXP(c)),
      classLevel: classLevel(c, c.activeClass),
      professionLevel: professionLevel(c),
      completed: c.completions.length,
    });
  }
  const end = new Date(SIMULATION_START);
  end.setUTCDate(end.getUTCDate() + days - 1);
  const pending = takenObjectives(c, end)
    .filter((o) => o.cadence === "monthly" && !isComplete(c, o, end))
    .map((o) => ({ id: o.id, title: o.title, ...requestProgress(c, o, end) }));
  const byCadence = Object.fromEntries(
    ["daily", "weekly", "monthly"].map((cadence) => {
      const rows = c.completions.filter((o) => o.cadence === cadence);
      return [
        cadence,
        {
          completed: rows.length,
          xp: rows.reduce((n, o) => n + o.xp, 0),
          gold: rows.reduce((n, o) => n + (o.gold || 0), 0),
        },
      ];
    }),
  );
  const gold = RANKS.find((r) => r.name === "A")!.xp;
  return {
    profile,
    days,
    day7: history[6],
    day30: history[29],
    last: history.at(-1)!,
    byCadence,
    pending,
    history,
    log,
    stats: stats(c),
    projectedDaysToGold: Math.ceil(gold / (totalXP(c) / days)),
    character: c,
  };
}
export function simulateEarlyClaims() {
  const at = SIMULATION_START;
  let c = simulationCharacter("Early claim attempts");
  const rows = objectives(c).filter((o) => o.cadence === "monthly");
  let accepted = 0,
    blocked = 0;
  for (const row of rows) {
    const before = c;
    c = takeRequest(c, row.id, at);
    if (c !== before) accepted++;
    const o = takenObjectives(c, at).find((o) => o.id === row.id);
    if (!o) continue;
    c = {
      ...c,
      milestones: {
        ...c.milestones,
        [`${o.id}:${objectivePeriod(o, at)}`]: (o.checklist || []).map(
          (_, i) => i,
        ),
      },
    };
    const result = completeTaken(c, { ...o, xp: 9999999, gold: 9999999 }, at);
    if (result === c) blocked++;
    c = result;
  }
  if (!validateCharacter(c)) throw Error("Invalid early-claim fixture");
  return {
    monthlyAvailable: rows.length,
    accepted,
    blocked,
    xp: totalXP(c),
    gold: campaign(c).gold,
    rank: characterRank(c).name,
  };
}
