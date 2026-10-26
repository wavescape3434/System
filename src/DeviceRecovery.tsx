import { useEffect, useState } from "react";
import type { Character } from "./domain";
import { totalXP } from "./domain";
import { localRecovery, localReplacementRecovery } from "./storage";
import { listDeviceSnapshots, readDeviceSnapshot } from "./device-backups";
import type { DeviceSnapshot } from "./device-backups";
const names = {
  daily: "Daily copy",
  "before-restore": "Before restore",
  "before-new-character": "Before new character",
};
export default function DeviceRecovery({
  onReview,
}: {
  onReview: (c: Character) => void;
}) {
  const [entries, setEntries] = useState<DeviceSnapshot[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [legacy] = useState(() => localRecovery());
  const [replacement] = useState(() => localReplacementRecovery());
  useEffect(() => {
    let disposed = false;
    void listDeviceSnapshots()
      .then((entries) => {
        if (!disposed) setEntries(entries);
      })
      .catch(() => {
        if (!disposed)
          setError(
            "Device recovery copies could not be read. File backups remain available.",
          );
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, []);
  return (
    <section className="device-recovery" aria-label="Device recovery copies">
      {loading && <p role="status">Loading copies…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !entries.length && !legacy && !replacement && !error && (
        <p>No device recovery copies yet.</p>
      )}
      {replacement && (
        <article>
          <div>
            <b>Before replacement · local copy</b>
            <small>{new Date(replacement.at).toLocaleString()}</small>
            <strong>{replacement.character.name}</strong>
            <span>
              {totalXP(replacement.character).toLocaleString()} XP ·{" "}
              {replacement.character.completions.length} requests
            </span>
          </div>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => onReview(replacement.character)}
          >
            Review saved character
          </button>
        </article>
      )}
      {entries.map((entry) => (
        <article key={entry.id}>
          <div>
            <b>{names[entry.kind]}</b>
            <small>{new Date(entry.at).toLocaleString()}</small>
            <strong>{entry.name}</strong>
            <span>
              {entry.xp.toLocaleString()} XP · {entry.completions} request
              {entry.completions === 1 ? "" : "s"} · {entry.goals} goals
            </span>
          </div>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void readDeviceSnapshot(entry.id)
                .then(onReview)
                .catch((e) =>
                  setError(
                    e instanceof Error
                      ? e.message
                      : "This copy could not be read.",
                  ),
                )
                .finally(() => setBusy(false));
            }}
          >
            Review copy
          </button>
        </article>
      ))}
      {legacy && (
        <article>
          <div>
            <b>Earlier local snapshot</b>
            <small>{new Date(legacy.at).toLocaleString()}</small>
            <strong>{legacy.character.name}</strong>
            <span>
              {totalXP(legacy.character).toLocaleString()} XP ·{" "}
              {legacy.character.completions.length} requests
            </span>
          </div>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => onReview(legacy.character)}
          >
            Review snapshot
          </button>
        </article>
      )}
    </section>
  );
}
