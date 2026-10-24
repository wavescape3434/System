import type { Character, Cadence, Objective } from "./domain";
export function periodStart(cadence: Cadence, now = new Date()): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (cadence === "weekly") d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  if (cadence === "monthly") d.setDate(1);
  return d;
}
export function periodEnd(cadence: Cadence, now = new Date()): Date {
  const d = periodStart(cadence, now);
  if (cadence === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + (cadence === "weekly" ? 7 : 1));
  return d;
}
export function calendarGoal(c: Character, o: Objective): Objective {
  if (c.calendarVersion !== 1 || o.cadence === "daily") return o;
  const monthly = o.cadence === "monthly",
    rank = o.rank || "D",
    high = ["S", "SS", "SSS"].includes(rank);
  const monthlyDays = {
    F: 7,
    E: 9,
    D: 12,
    C: 16,
    B: 21,
    A: 23,
    S: 23,
    SS: 23,
    SSS: 23,
  };
  const oldSessions = o.minimumSessions || 0;
  return {
    ...o,
    calendarBound: true,
    persistent: false,
    instanceId: undefined,
    preparationDays: high ? o.minimumDays : undefined,
    preparationSessions: high ? oldSessions : undefined,
    minimumDays: monthly ? monthlyDays[rank] : o.minimumDays,
    minimumSessions:
      monthly && high
        ? ["STR", "DEX", "CON"].includes(o.stat)
          ? 12
          : 18
        : o.minimumSessions,
    minutes: monthly
      ? `${Math.min(oldSessions, high ? (["STR", "DEX", "CON"].includes(o.stat) ? 12 : 18) : oldSessions)} practice days · this month`
      : o.minutes,
    description: o.description
      .replace(/across at least four weeks/g, "during this calendar month")
      .replace(/at your own pace this month/g, "during this calendar month"),
  };
}
export function adventureConditionMet(
  c: Character,
  contractId: string,
  cadence: Cadence,
  now = new Date(),
): boolean {
  return (c.campaign?.world?.receipts || []).some(
    (r) =>
      r.contractId === contractId &&
      new Date(r.at) >= periodStart(cadence, now) &&
      new Date(r.at) <= now,
  );
}
export function adventureBonus(c: Character, o: Objective, now = new Date()) {
  return o.adventureBonus &&
    adventureConditionMet(c, o.adventureBonus.contractId, o.cadence, now)
    ? o.adventureBonus
    : undefined;
}
