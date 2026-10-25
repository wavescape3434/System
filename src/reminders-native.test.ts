import { beforeEach, describe, it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({
  checkPermissions: vi.fn(),
  createChannel: vi.fn(),
  cancel: vi.fn(),
  schedule: vi.fn(),
  requestPermissions: vi.fn(),
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true },
}));
vi.mock("@capacitor/local-notifications", () => ({ LocalNotifications: mock }));
import {
  syncReminders,
  forgetReminderSchedule,
  cancelReminders,
} from "./reminders";
import { demoCharacter, objectives, takeRequest } from "./domain";
const now = new Date(2027, 1, 2, 12);
beforeEach(() => {
  vi.clearAllMocks();
  forgetReminderSchedule();
  mock.checkPermissions.mockResolvedValue({ display: "granted" });
  mock.createChannel.mockResolvedValue(undefined);
  mock.cancel.mockResolvedValue(undefined);
  mock.schedule.mockResolvedValue({ notifications: [] });
});
describe("native reminder adapter", () => {
  it("never prompts during passive refresh when OS permission is missing", async () => {
    mock.checkPermissions.mockResolvedValue({ display: "denied" });
    await syncReminders(demoCharacter(), now);
    expect(mock.requestPermissions).not.toHaveBeenCalled();
    expect(mock.schedule).not.toHaveBeenCalled();
  });
  it("installs a channel, replaces only owned ids, deduplicates refreshes, and routes taps to Taken", async () => {
    let c = demoCharacter();
    const o = objectives(c).find(
      (o) => o.scope === "universal" && o.cadence === "weekly",
    )!;
    c = takeRequest(c, o.id, now);
    await syncReminders(c, now);
    expect(mock.createChannel).toHaveBeenCalledOnce();
    expect(mock.cancel).toHaveBeenCalledWith({
      notifications: [{ id: 71000 }, { id: 71001 }, { id: 71002 }],
    });
    const notifications = mock.schedule.mock.calls[0][0].notifications;
    expect(notifications).toHaveLength(2);
    expect(notifications[0].schedule.on).toEqual({ hour: 21, minute: 0 });
    expect(
      notifications.every(
        (n: { isExactNotification: boolean }) =>
          n.isExactNotification === false,
      ),
    ).toBe(true);
    expect(notifications[1].extra).toMatchObject({
      view: "taken",
      cadence: "weekly",
      requestId: o.id,
    });
    await syncReminders(c, now);
    expect(mock.schedule).toHaveBeenCalledOnce();
  });
  it("clears schedules when all reminder preferences are disabled or the character is removed", async () => {
    const c = demoCharacter();
    await syncReminders(c, now);
    c.preferences = {
      units: "metric",
      textSize: "standard",
      reduceMotion: false,
      equipment: ["bodyweight"],
      showLockedRequests: true,
      defaultPage: "guild",
      reminders: { daily: false, weekly: false, monthly: false, time: "21:00" },
    };
    await syncReminders(c, now);
    expect(mock.cancel).toHaveBeenCalledTimes(2);
    expect(mock.schedule).toHaveBeenCalledOnce();
    await cancelReminders();
    expect(mock.cancel).toHaveBeenCalledTimes(3);
  });
});
