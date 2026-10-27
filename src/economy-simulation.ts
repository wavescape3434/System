import {
  createCharacter,
  EMPTY_BASELINE,
  CLASSES,
  objectives,
  takeRequest,
  completeTaken,
  totalXP,
  stats,
  learnSkill,
  skillRequirements,
  skillWallet,
} from "./domain";
import { EMPTY_ASSESSMENT } from "./metrics";
import type { Character, Stats } from "./domain";
import { SKILLS } from "./skill-catalog";
import {
  campaign,
  adventureParty,
  startBattle,
  act,
  claimVictory,
  buy,
  equip,
  EQUIPMENT,
  toggleEquippedSkill,
} from "./rpg";
import type { Action } from "./rpg";
import {
  PLACES,
  TOWN_GEAR,
  WORLD_CONTRACTS,
  WORLD_ENCOUNTERS,
} from "./world-catalog";
import { placeOpen, placeCleared } from "./world-state";
import {
  explore,
  challengeBoss,
  takeWorldContract,
  completeWorldContract,
  contractProgress,
  returnToMap,
  leaveBattle,
} from "./world";
import { claimLoginReward } from "./login-rewards";
import { chargedAttack } from "./enemy-tactics";
import { validateCharacter } from "./storage";
export const ECONOMY_START = new Date(2027, 1, 1, 12);
export type EconomyRoutine = "login" | "moderate" | "active";
export interface EconomyOptions {
  classId: string;
  routine: EconomyRoutine;
  days: number;
  encounters: number;
  seed: number;
  statFixture?: number;
  priority?: "commissions" | "equipment";
  mode?: "campaign" | "exploration";
}
export function economyCharacter(classId: string, statFixture = 10) {
  let c = createCharacter(
    "Economy fixture",
    { ...EMPTY_BASELINE, assessment: { ...EMPTY_ASSESSMENT } },
    classId,
    "Explorer",
  );
  c = {
    ...c,
    baseStats: Object.fromEntries(
      Object.keys(c.baseStats).map((k) => [k, statFixture]),
    ) as Stats,
    startingRank: "F",
  };
  c.campaign = campaign(c);
  return c;
}
export function economyAction(c: Character): Action {
  const b = campaign(c).battle!,
    actor = b.party[b.actor],
    target = b.enemies.findIndex((e) => e.hp > 0),
    living = b.party.filter((u) => u.hp > 0),
    low = [...living].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0],
    charged = b.enemies.some((e) => e.hp > 0 && chargedAttack(e, b.round)),
    abilities = actor.abilities.filter((a) => a.cost <= actor.mp);
  const heal = abilities.find(
      (a) =>
        a.type === "heal" ||
        a.type === "heal-all" ||
        (a.type === "heal-self" && low.id === actor.id),
    ),
    ward = abilities.find((a) => ["ward", "guard", "bulwark"].includes(a.type)),
    offense = abilities.find((a) =>
      [
        "power",
        "quick",
        "fire",
        "area",
        "pierce",
        "flurry",
        "bash",
        "hybrid",
        "coordinated",
        "burn",
      ].includes(a.type),
    ),
    buff = abilities.find((a) => ["rally", "formation"].includes(a.type));
  if (low.hp / low.maxHp < 0.35 && b.items.potion > 0)
    return { kind: "potion", target: b.party.indexOf(low) };
  if (charged)
    return ward
      ? { kind: "ability", abilityId: ward.id, target }
      : { kind: "guard", target };
  if (low.hp / low.maxHp < 0.55 && heal)
    return {
      kind: "ability",
      abilityId: heal.id,
      target: b.party.indexOf(low),
    };
  if (buff && b.round === 1)
    return { kind: "ability", abilityId: buff.id, target };
  if (offense) return { kind: "ability", abilityId: offense.id, target };
  if (actor.mp < 5 && actor.mp < actor.maxMp && b.items.ether > 0)
    return { kind: "ether", target: b.actor };
  return { kind: "attack", target };
}
export function simulateEconomy(
  options: EconomyOptions,
  setClock: (now: Date) => void,
  manualUse?: (
    c: Character,
    target: string,
    id: "potion" | "ether",
  ) => Character,
) {
  let c = economyCharacter(options.classId, options.statFixture),
    seed = options.seed,
    failedPurchases = 0;
  const random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    },
    income = {
      requests: 0,
      login: 0,
      battles: 0,
      exploration: 0,
      commissions: 0,
    },
    spent = { supplies: 0, equipment: 0 },
    itemsUsed = { potion: 0, ether: 0 },
    purchased = { potion: 0, ether: 0 },
    history = [];
  let wins = 0,
    losses = 0,
    roundLimit = 0,
    attempts = 0,
    actions = 0,
    explorations = 0,
    stockBlocks = 0;
  const shop = () => {
    let data = campaign(c);
    const town = data.world!.townId;
    const path = CLASSES.find((p) => p.id === options.classId)!,
      desired = TOWN_GEAR.filter(
        (g) => g.town === town && (g.slot === "armor" || g.mod[path.stat]),
      );
    for (const gear of desired) {
      const old = data.equipment
          .map((id) => EQUIPMENT.find((e) => e.id === id))
          .find((e) => e?.slot === gear.slot),
        gain = Object.entries(gear.mod).some(
          ([s, n]) => (n || 0) > (old?.mod[s as keyof Stats] || 0),
        );
      if (
        !data.inventory[gear.id] &&
        gain &&
        data.gold >= gear.price + 65 &&
        (data.inventory[gear.material] || 0) >= gear.quantity
      ) {
        const next = buy(c, gear.id);
        spent.equipment += data.gold - campaign(next).gold;
        c = equip(next, gear.id);
        data = campaign(c);
      }
    }
    for (const id of ["potion", "ether"] as const)
      while ((campaign(c).inventory[id] || 0) < (id === "potion" ? 2 : 1)) {
        data = campaign(c);
        const next = buy(c, id);
        if (next === c) {
          if ((data.world!.stock[town][id] || 0) === 0) stockBlocks++;
          else failedPurchases++;
          break;
        }
        spent.supplies += data.gold - campaign(next).gold;
        purchased[id]++;
        c = next;
      }
  };
  for (let day = 0; day < options.days; day++) {
    const now = new Date(ECONOMY_START);
    now.setDate(now.getDate() + day);
    setClock(now);
    c = { ...c, campaign: campaign(c) };
    const beforeLogin = campaign(c).gold;
    c = claimLoginReward(c, now);
    income.login += campaign(c).gold - beforeLogin;
    if (options.routine !== "login")
      for (const id of options.routine === "active"
        ? ["u-walk-brisk", "u-spaced-recall", "u-bible-recall", "u-read-5"]
        : ["u-walk-brisk", "u-spaced-recall", "u-bible-recall"]) {
        const o = objectives(c).find((o) => o.id === id);
        if (!o) throw Error("Missing routine " + id);
        const next = completeTaken(takeRequest(c, id, now), o, now);
        income.requests += next.completions
          .slice(c.completions.length)
          .reduce((n, r) => n + (r.gold || 0), 0);
        c = next;
      }
    // Spend only actually earned combat points; no exam outcomes or stat gains are fabricated.
    for (const s of SKILLS.filter(
      (s) => !s.nonCombat && !s.automatic && skillWallet(c, s) === "combat",
    ).sort((a, b) => a.cost - b.cost))
      if (
        !c.earnedSkills.includes(s.id) &&
        skillRequirements(c, s).length === 0
      ) {
        c = learnSkill(c, s.id);
        if (campaign(c).equippedSkills.length < 4)
          c = toggleEquippedSkill(c, s.id);
      }
    const today = { wins: 0, losses: 0, explorations: 0 };
    for (
      let slot = 0, outings = 0;
      slot < options.encounters && outings < options.encounters * 3;
      outings++
    ) {
      c = returnToMap(c);
      const data = campaign(c),
        town = data.world!.townId;
      if (options.priority === "equipment") shop();
      for (const q of WORLD_CONTRACTS.filter((q) => q.town === town)) {
        const path = CLASSES.find((p) => p.id === options.classId)!;
        const reserved = TOWN_GEAR.filter(
          (g) =>
            g.town === town &&
            !campaign(c).inventory[g.id] &&
            (g.slot === "armor" || g.mod[path.stat]),
        )
          .filter((g) => g.material === q.resource)
          .reduce((n, g) => n + g.quantity, 0);
        if (
          options.priority === "equipment" &&
          q.kind === "delivery" &&
          (campaign(c).inventory[q.resource!] || 0) - q.quantity < reserved
        )
          continue;
        c = takeWorldContract(c, q.id, now);
        if (
          campaign(c).world!.taken.some((t) => t.id === q.id) &&
          contractProgress(c, q.id) >= q.quantity
        ) {
          const before = campaign(c).gold;
          c = completeWorldContract(c, q.id, now);
          income.commissions += campaign(c).gold - before;
        }
      }
      if (options.priority !== "equipment") shop();
      if (manualUse)
        for (const u of adventureParty(c)) {
          while (
            adventureParty(c).find((p) => p.id === u.id)!.hp / u.maxHp < 0.55 &&
            (campaign(c).inventory.potion || 0) > 0
          ) {
            const before = campaign(c).inventory.potion,
              next = manualUse(c, u.id, "potion");
            if (next === c) break;
            c = next;
            itemsUsed.potion += before - campaign(c).inventory.potion;
          }
          const current = adventureParty(c).find((p) => p.id === u.id)!;
          if (
            current.hp > 0 &&
            current.mp < 5 &&
            (campaign(c).inventory.ether || 0) > 0
          ) {
            const before = campaign(c).inventory.ether;
            c = manualUse(c, u.id, "ether");
            itemsUsed.ether += before - campaign(c).inventory.ether;
          }
        }
      const places = PLACES.filter(
          (p) =>
            placeOpen(campaign(c), p.id) &&
            (options.mode !== "exploration" || p.id === "mossfall-path"),
        ),
        next = places.flatMap((p) =>
          p.stages.filter((id) => !campaign(c).cleared.includes(id)),
        )[0];
      if (next) c = startBattle(c, next, now);
      else {
        const place = places.find((p) => placeCleared(campaign(c), p.id))!;
        const before = campaign(c).gold;
        c = explore(c, place.id, random, now);
        income.exploration += campaign(c).gold - before;
        explorations++;
        today.explorations++;
        if (campaign(c).world!.areas[place.id]?.last?.kind === "boss")
          c = challengeBoss(c, place.id);
      }
      if (!campaign(c).battle) {
        if (adventureParty(c).every((u) => u.hp === 0)) break;
        continue;
      }
      slot++;
      attempts++;
      let turn = 0;
      while (campaign(c).battle?.phase === "player" && turn++ < 160) {
        const before = campaign(c).inventory;
        c = act(c, economyAction(c), now);
        for (const id of ["potion", "ether"] as const)
          itemsUsed[id] += Math.max(
            0,
            (before[id] || 0) - (campaign(c).inventory[id] || 0),
          );
        actions++;
      }
      const phase = campaign(c).battle!.phase;
      if (phase === "won") {
        const before = campaign(c).gold;
        c = claimVictory(c);
        income.battles += campaign(c).gold - before;
        wins++;
        today.wins++;
        c = leaveBattle(c);
      } else {
        if (phase === "player") {
          roundLimit++;
          c = act(c, { kind: "flee", target: 0 }, now);
        }
        losses++;
        today.losses++;
        c = returnToMap(c);
        break;
      }
    }
    c = returnToMap(c);
    const saved = JSON.parse(JSON.stringify(c));
    if (!validateCharacter(saved))
      throw Error(`Invalid economy fixture day ${day + 1}`);
    c = saved;
    history.push({
      day: day + 1,
      gold: campaign(c).gold,
      potion: campaign(c).inventory.potion || 0,
      ether: campaign(c).inventory.ether || 0,
      cleared: campaign(c).cleared.filter((id) =>
        WORLD_ENCOUNTERS.some((e) => e.id === id && e.kind === "stage"),
      ).length,
      totalWins: wins,
      totalLosses: losses,
      ...today,
      realXp: totalXP(c),
      baseStats: stats(c),
      income: { ...income },
      spent: { ...spent },
      itemsUsed: { ...itemsUsed },
    });
  }
  const balance = campaign(c).gold,
    earned = Object.values(income).reduce((a, b) => a + b, 0),
    out = Object.values(spent).reduce((a, b) => a + b, 0);
  if (balance !== earned - out)
    throw Error(`Unreconciled economy: ${balance} vs ${earned - out}`);
  return {
    options,
    day7: history[6],
    day30: history.at(-1),
    income,
    spent,
    itemsUsed,
    purchased,
    wins,
    losses,
    attempts,
    actions,
    explorations,
    roundLimit,
    stockBlocks,
    failedPurchases,
    gold: balance,
    equipment: campaign(c).equipment,
    history,
    character: c,
  };
}
