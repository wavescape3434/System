import type { Character } from "./domain";
import { campaign } from "./rpg";
export const localDay = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
export const LOGIN_REWARDS = [
  { gold: 10, potion: 1, ether: 0 },
  { gold: 15, potion: 0, ether: 1 },
  { gold: 15, potion: 1, ether: 0 },
  { gold: 20, potion: 0, ether: 1 },
  { gold: 20, potion: 1, ether: 0 },
  { gold: 25, potion: 0, ether: 1 },
  { gold: 50, potion: 2, ether: 1 },
];
export function loginReward(c: Character, now = new Date()) {
  const records = c.loginRewards || [],
    day = localDay(now),
    last = records.at(-1);
  const claimed =
    records.some((r) => r.day === day) || (!!last && last.day > day);
  const cycleDay =
    claimed && last ? last.cycleDay : ((last?.cycleDay || 0) % 7) + 1;
  return { ...LOGIN_REWARDS[cycleDay - 1], cycleDay, claimed, day };
}
export function claimLoginReward(c: Character, now = new Date()): Character {
  const reward = loginReward(c, now);
  if (reward.claimed) return c;
  const data = campaign(c);
  const inventory = {
    ...data.inventory,
    potion: (data.inventory.potion || 0) + reward.potion,
    ether: (data.inventory.ether || 0) + reward.ether,
  };
  return {
    ...c,
    loginRewards: [
      ...(c.loginRewards || []),
      { day: reward.day, at: now.toISOString(), cycleDay: reward.cycleDay },
    ],
    campaign: {
      ...data,
      gold: data.gold + reward.gold,
      inventory,
      ...(data.battle
        ? {
            battle: {
              ...data.battle,
              items: {
                ...data.battle.items,
                potion: (data.battle.items.potion || 0) + reward.potion,
                ether: (data.battle.items.ether || 0) + reward.ether,
              },
            },
          }
        : {}),
    },
  };
}
