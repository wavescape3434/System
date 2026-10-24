export const TASK_RANKS = [
  "F",
  "E",
  "D",
  "C",
  "B",
  "A",
  "S",
  "SS",
  "SSS",
] as const;
export type TaskRank = (typeof TASK_RANKS)[number];
export const TASK_XP: Record<TaskRank, number> = {
  F: 10,
  E: 25,
  D: 60,
  C: 150,
  B: 350,
  A: 800,
  S: 1800,
  SS: 4200,
  SSS: 10000,
};
export const TASK_NAMES: Record<TaskRank, string> = {
  F: "Foundation",
  E: "Light",
  D: "Routine",
  C: "Challenging",
  B: "Advanced",
  A: "Expert",
  S: "Exceptional",
  SS: "Masterwork",
  SSS: "Legendary achievement",
};
export const checkpointUnits = (rank: TaskRank = "D") =>
  ({ F: 1, E: 1, D: 1, C: 2, B: 2, A: 3, S: 4, SS: 6, SSS: 8 })[rank];
export const milestonePoints = (lv: number) => {
  const n = Math.floor(Math.max(0, lv) / 5);
  return (n * (n + 3)) / 2;
};

export const TASK_GOLD: Record<TaskRank, number> = {
  F: 2,
  E: 5,
  D: 12,
  C: 30,
  B: 70,
  A: 160,
  S: 360,
  SS: 840,
  SSS: 2000,
};
