import type { Character } from "./domain";
import { takenObjectives, isComplete } from "./domain";
import { periodEnd } from "./calendar-goals";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
export const DEFAULT_REMINDERS = {
  daily: true,
  weekly: true,
  monthly: true,
  time: "21:00",
};
export const REMINDER_CHANNEL = "guild-requests";
export const reminderSettings = (c: Character) => ({
  ...DEFAULT_REMINDERS,
  ...c.preferences?.reminders,
});
export function deadlineReminder(
  cadence: "weekly" | "monthly",
  time: string,
  now = new Date(),
) {
  const d = periodEnd(cadence, now),
    [hour, minute] = time.split(":").map(Number);
  // Evening before the last calendar day: 27 hours remain at the default 9pm.
  d.setDate(d.getDate() - 2);
  d.setHours(hour, minute, 0, 0);
  return d;
}
export function reminderPlan(c: Character, now = new Date()) {
  const p = reminderSettings(c),
    [hour, minute] = p.time.split(":").map(Number);
  const plan: {
    id: number;
    title: string;
    body: string;
    at: Date;
    requestId?: string;
    cadence?: string;
    repeats?: boolean;
  }[] = [];
  if (p.daily) {
    const at = new Date(now);
    at.setHours(hour, minute, 0, 0);
    if (at <= now) at.setDate(at.getDate() + 1);
    plan.push({
      id: 71000,
      title: "Guild requests",
      body: "Submit your completed requests before the day ends.",
      at,
      repeats: true,
    });
  }
  const pending = takenObjectives(c, now).filter(
    (o) => o.cadence !== "daily" && !isComplete(c, o, now),
  );
  for (const cadence of ["weekly", "monthly"] as const) {
    if (!p[cadence]) continue;
    const requests = pending.filter((o) => o.cadence === cadence);
    if (!requests.length) continue;
    let at = deadlineReminder(cadence, p.time, now);
    let late = false;
    if (at <= now) {
      const accepted = (c.takenRequests || []).filter(
        (r) => requests.some((o) => o.id === r.id) && new Date(r.takenAt) > at,
      );
      if (!accepted.length) continue;
      // A late acceptance still gets a deadline reminder; use its fixed acceptance
      // time so ordinary app updates cannot keep postponing the notification.
      const takenAt = Math.max(...accepted.map((r) => Date.parse(r.takenAt)));
      const preferred = new Date(takenAt);
      preferred.setHours(hour, minute, 0, 0);
      at =
        preferred.getTime() > takenAt
          ? preferred
          : new Date(takenAt + 30 * 60000);
      const end = periodEnd(cadence, now).getTime();
      if (at.getTime() >= end) at = new Date(end - 5 * 60000);
      if (at <= now) continue;
      late = true;
    }
    plan.push({
      id: cadence === "weekly" ? 71001 : 71002,
      title: `${cadence === "weekly" ? "Weekly quests" : "Monthly adventures"} ${late && at.toDateString() === new Date(periodEnd(cadence, now).getTime() - 1).toDateString() ? "end today" : "end tomorrow"}`,
      body: `${requests.length} taken request${requests.length === 1 ? "" : "s"} remaining. ${requests[0].title}${requests.length > 1 ? ` and ${requests.length - 1} more.` : "."}`,
      at,
      cadence,
      requestId: requests[0].id,
    });
  }
  return plan;
}
let lastSchedule = "";
let queue: Promise<void> = Promise.resolve();
export function syncReminders(c: Character, now = new Date()): Promise<void> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve();
  const plan = reminderPlan(c, now);
  // Repeating reminders retain their next time as the day changes; deadline schedules are period-specific.
  const signature = JSON.stringify({
    character: c.id,
    plan: plan.map((n) => ({
      ...n,
      at: n.repeats ? reminderSettings(c).time : n.at.toISOString(),
    })),
  });
  queue = queue
    .catch(() => {})
    .then(async () => {
      if (signature === lastSchedule) return;
      const permissions = await LocalNotifications.checkPermissions();
      if (permissions.display !== "granted") {
        lastSchedule = "";
        return;
      }
      await LocalNotifications.createChannel({
        id: REMINDER_CHANNEL,
        name: "Guild reminders",
        importance: 3,
        description: "Request submission and deadline reminders",
      });
      await LocalNotifications.cancel({
        notifications: [71000, 71001, 71002].map((id) => ({ id })),
      });
      if (plan.length)
        await LocalNotifications.schedule({
          notifications: plan.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            channelId: REMINDER_CHANNEL,
            smallIcon: "ic_guild_notification",
            iconColor: "#c6a96e",
            isExactNotification: false,
            schedule: n.repeats
              ? {
                  on: { hour: n.at.getHours(), minute: n.at.getMinutes() },
                  repeats: true,
                  allowWhileIdle: true,
                }
              : { at: n.at, allowWhileIdle: true },
            extra: {
              page: "objectives",
              view: "taken",
              cadence: n.cadence,
              requestId: n.requestId,
            },
          })),
        });
      lastSchedule = signature;
    });
  return queue;
}
export function forgetReminderSchedule() {
  lastSchedule = "";
}
export function cancelReminders(): Promise<void> {
  lastSchedule = "";
  if (!Capacitor.isNativePlatform()) return Promise.resolve();
  queue = queue
    .catch(() => {})
    .then(() =>
      LocalNotifications.cancel({
        notifications: [71000, 71001, 71002].map((id) => ({ id })),
      }),
    );
  return queue;
}
