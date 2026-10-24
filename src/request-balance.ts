import type { Cadence } from "./domain";
import type { TaskRank } from "./task-ranks";
import { TASK_XP, TASK_GOLD, TASK_RANKS } from "./task-ranks";

export const CADENCE_MAX_RANK: Record<Cadence, TaskRank> = {
  daily: "C",
  weekly: "A",
  monthly: "SSS",
};
export const CADENCE_MULTIPLIER: Record<Cadence, number> = {
  daily: 1,
  weekly: 4,
  monthly: 18,
};
export const requestReward = (rank: TaskRank, cadence: Cadence) => ({
  xp: TASK_XP[rank] * CADENCE_MULTIPLIER[cadence],
  gold: TASK_GOLD[rank] * CADENCE_MULTIPLIER[cadence],
});
export const allowedRanks = (cadence: Cadence) =>
  TASK_RANKS.slice(0, TASK_RANKS.indexOf(CADENCE_MAX_RANK[cadence]) + 1);
// Promotion prices grow by 2.5x: 2,500, 6,250, 15,625, ... .
export const guildRankThreshold = (index: number) =>
  Math.round((2500 * (2.5 ** index - 1)) / 1.5);
export const oldGuildRankThreshold = (index: number) => 500 * (2 ** index - 1);
