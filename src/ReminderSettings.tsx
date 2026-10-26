import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Character } from "./domain";
import { DEFAULT_PREFERENCES } from "./preferences";
import {
  reminderSettings,
  syncReminders,
  forgetReminderSchedule,
} from "./reminders";
export default function ReminderSettings({
  c,
  update,
}: {
  c: Character;
  update: (c: Character) => Promise<boolean>;
}) {
  const [permission, setPermission] = useState(""),
    [error, setError] = useState("");
  const native = Capacitor.isNativePlatform(),
    settings = reminderSettings(c);
  useEffect(() => {
    if (native)
      LocalNotifications.checkPermissions()
        .then((p) => setPermission(p.display))
        .catch(() => setError("Could not read notification permission."));
  }, [native]);
  return (
    <section className="panel reminder-settings">
      <h2>Request reminders</h2>
      {(["daily", "weekly", "monthly"] as const).map((key) => (
        <label className="setting-toggle" key={key}>
          <span>
            {key === "daily"
              ? "Evening submission reminder"
              : key === "weekly"
                ? "Weekly deadline reminder"
                : "Monthly deadline reminder"}
          </span>
          <input
            type="checkbox"
            checked={settings[key]}
            onChange={(e) =>
              update({
                ...c,
                preferences: {
                  ...DEFAULT_PREFERENCES,
                  ...c.preferences,
                  reminders: { ...settings, [key]: e.target.checked },
                },
              })
            }
          />
        </label>
      ))}
      <label className="field">
        Reminder time
        <input
          type="time"
          aria-label="Reminder time"
          value={settings.time}
          onChange={(e) => {
            if (e.target.value)
              update({
                ...c,
                preferences: {
                  ...DEFAULT_PREFERENCES,
                  ...c.preferences,
                  reminders: { ...settings, time: e.target.value },
                },
              });
          }}
        />
      </label>
      <p className="helper">
        Local time. Deadline reminders arrive the evening before the final day.
        Android may delay delivery while saving battery.
      </p>
      {native ? (
        <>
          <p>
            {permission === "granted"
              ? "Android notifications enabled"
              : "Android notification permission required"}
          </p>
          <button
            className="button secondary"
            onClick={async () => {
              try {
                setError("");
                const p = await LocalNotifications.requestPermissions();
                setPermission(p.display);
                if (p.display === "granted") {
                  forgetReminderSchedule();
                  await syncReminders(c);
                } else
                  setError(
                    "Allow notifications in Android Settings → Apps → The Adventurers Guild → Notifications.",
                  );
              } catch {
                setError(
                  "Could not enable reminders. Try again from Android notification settings.",
                );
              }
            }}
          >
            {permission === "granted"
              ? "Refresh reminders"
              : "Enable Android notifications"}
          </button>
        </>
      ) : (
        <p className="helper">
          Install the Android app for device reminders. These preferences are
          saved with your character.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
