import type { Character } from "./domain";
import { totalXP } from "./domain";
import { validateCharacter, saveReplacementRecovery } from "./storage";
export type SnapshotKind = "daily" | "before-restore" | "before-new-character";
export interface DeviceSnapshot {
  id: string;
  at: string;
  kind: SnapshotKind;
  characterId: string;
  name: string;
  xp: number;
  completions: number;
  goals: number;
}
const DB = "the-guild.recovery.v1";
const pending = new Map<string, Promise<void>>();
async function database(): Promise<IDBDatabase> {
  if (!globalThis.indexedDB)
    throw Error(
      "Device recovery is unavailable. Export a backup file before replacing this character.",
    );
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    let settled = false;
    request.onupgradeneeded = () => {
      request.result.createObjectStore("entries", { keyPath: "id" });
      request.result.createObjectStore("characters");
    };
    request.onerror = () => {
      settled = true;
      reject(request.error);
    };
    request.onblocked = () => {
      settled = true;
      reject(Error("Close other Guild windows and retry the recovery copy."));
    };
    request.onsuccess = () => {
      if (settled) {
        request.result.close();
        return;
      }
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}
const result = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
const committed = (tx: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () =>
      reject(tx.error || Error("Recovery copy was not saved."));
    tx.onerror = () => reject(tx.error);
  });
export async function listDeviceSnapshots(): Promise<DeviceSnapshot[]> {
  const db = await database();
  try {
    return (
      (await result(
        db.transaction("entries").objectStore("entries").getAll(),
      )) as DeviceSnapshot[]
    ).sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
  } finally {
    db.close();
  }
}
export async function readDeviceSnapshot(id: string): Promise<Character> {
  const db = await database();
  try {
    const tx = db.transaction(["entries", "characters"]),
      [entry, character] = await Promise.all([
        result(tx.objectStore("entries").get(id)),
        result(tx.objectStore("characters").get(id)),
      ]);
    if (
      !entry ||
      !validateCharacter(character) ||
      entry.characterId !== character.id
    )
      throw Error(
        "This recovery copy is invalid. Your current character is unchanged.",
      );
    return character;
  } finally {
    db.close();
  }
}
export async function saveDeviceSnapshot(
  c: Character,
  kind: SnapshotKind,
  now = new Date(),
): Promise<void> {
  if (!validateCharacter(c))
    throw Error("This character cannot be saved as a recovery copy.");
  const db = await database();
  try {
    const dailyId = `${c.id}:daily:${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const tx = db.transaction(["entries", "characters"], "readwrite"),
      done = committed(tx),
      entries = tx.objectStore("entries"),
      characters = tx.objectStore("characters");
    try {
      const records = (await result(entries.getAll())) as DeviceSnapshot[];
      if (kind === "daily" && records.some((e) => e.id === dailyId)) {
        await done;
        return;
      }
      const entry: DeviceSnapshot = {
        id: kind === "daily" ? dailyId : crypto.randomUUID(),
        kind,
        at: now.toISOString(),
        characterId: c.id,
        name: c.name,
        xp: totalXP(c),
        completions: c.completions.length,
        goals: Object.keys(c.skillPlans?.goals || {}).length,
      };
      entries.put(entry);
      characters.put(c, entry.id);
      const all = [
        entry,
        ...records.sort(
          (a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id),
        ),
      ];
      for (const group of [
        all.filter((e) => e.kind === "daily").slice(3),
        all.filter((e) => e.kind !== "daily").slice(2),
      ])
        for (const old of group) {
          entries.delete(old.id);
          characters.delete(old.id);
        }
      await done;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* Already aborted or completed. */
      }
      await done.catch(() => {});
      throw error;
    }
  } finally {
    db.close();
  }
}
export function queueDailySnapshot(c: Character): Promise<void> {
  const capturedAt = new Date();
  const day = capturedAt.toDateString(),
    key = `${c.id}:${day}`;
  const old = pending.get(key);
  if (old) return old;
  for (const existing of pending.keys())
    if (!existing.endsWith(`:${day}`)) pending.delete(existing);
  const operation = new Promise<void>((resolve) => {
    if (typeof globalThis.requestIdleCallback === "function")
      requestIdleCallback(() => resolve(), { timeout: 1500 });
    else setTimeout(resolve, 8);
  }).then(() => saveDeviceSnapshot(c, "daily", capturedAt));
  pending.set(key, operation);
  void operation.catch(() => pending.delete(key));
  return operation;
}

export async function preserveBeforeReplacement(
  c: Character,
  kind: "before-restore" | "before-new-character",
): Promise<void> {
  try {
    await saveDeviceSnapshot(c, kind);
  } catch {
    try {
      saveReplacementRecovery(c);
    } catch {
      throw Error(
        "Could not preserve your current character. Free device storage and retry; your current character is unchanged.",
      );
    }
  }
}
