// No level ceiling. Each following level costs more XP than the last.
export const xpForLevel = (lv: number, base = 100) => {
  const n = Math.max(0, Math.floor(lv) - 1);
  return Math.round(base * (n + 0.15 * n * n));
};
export function levelFromXP(xp: number, base = 100): number {
  const safe = Math.max(0, Number.isFinite(xp) ? xp : 0);
  let lv = Math.floor((Math.sqrt(1 + (0.6 * safe) / base) - 1) / 0.3) + 1;
  // Correct rounding at exact cumulative boundaries.
  while (xpForLevel(lv + 1, base) <= safe) lv++;
  while (lv > 1 && xpForLevel(lv, base) > safe) lv--;
  return lv;
}
export function levelProgress(xp: number, base = 100) {
  const lv = levelFromXP(xp, base),
    start = xpForLevel(lv, base);
  return {
    level: lv,
    current: xp - start,
    needed: xpForLevel(lv + 1, base) - start,
    next: xpForLevel(lv + 1, base),
  };
}
// A stat milestone at levels 5, 10, 15 ...; intermediate levels earn skill points.
export const statMilestones = (lv: number) => Math.floor(lv / 5);
