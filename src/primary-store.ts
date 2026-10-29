import type { Character } from "./domain";
import {
  loadCharacter,
  STORAGE_KEY,
  validateCharacter,
  upgradeSavedCharacter,
} from "./storage";
export const PRIMARY_DATABASE = "the-guild.primary.v1";
export const HISTORY_FIELDS = [
  "completions",
  "abilityChecks",
  "journeyEvents",
  "journal",
  "assessmentHistory",
  "exams",
  "loginRewards",
  "certificates",
  "skillPurchases",
] as const;
type Field = (typeof HISTORY_FIELDS)[number];
interface Head {
  version: 1;
  revision: number;
  core: Record<string, unknown> | null;
  lengths: Partial<Record<Field, number>>;
}
export interface PrimaryRecord {
  character: Character | null;
  revision: number;
}
const SIZE = 100;
const request = <T>(r: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
const complete = (tx: IDBTransaction): Promise<void> => {
  const pending = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () =>
      reject(tx.error || Error("The save transaction was interrupted."));
    tx.onerror = () => reject(tx.error);
  });
  void pending.catch(() => {});
  return pending;
};
async function open(): Promise<IDBDatabase> {
  if (!globalThis.indexedDB)
    throw Error(
      "Device storage is unavailable. Your existing save has been kept.",
    );
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(PRIMARY_DATABASE, 1);
    let stopped = false;
    r.onupgradeneeded = () => {
      r.result.createObjectStore("head");
      r.result.createObjectStore("history");
    };
    r.onerror = () => reject(r.error);
    r.onblocked = () => {
      stopped = true;
      reject(Error("Close other Guild windows and retry opening the app."));
    };
    r.onsuccess = () => {
      if (stopped) {
        r.result.close();
        return;
      }
      r.result.onversionchange = () => r.result.close();
      resolve(r.result);
    };
  });
}
function validHead(h: Head) {
  return (
    h &&
    h.version === 1 &&
    Number.isSafeInteger(h.revision) &&
    h.revision > 0 &&
    h.lengths &&
    typeof h.lengths === "object" &&
    !Array.isArray(h.lengths) &&
    Object.entries(h.lengths).every(
      ([key, n]) =>
        HISTORY_FIELDS.includes(key as Field) &&
        Number.isSafeInteger(n) &&
        n >= 0,
    ) &&
    (h.core === null ||
      (h.core && typeof h.core === "object" && !Array.isArray(h.core)))
  );
}
export async function readPrimary(): Promise<PrimaryRecord | null> {
  const db = await open();
  try {
    const tx = db.transaction(["head", "history"]),
      done = complete(tx);
    const h = await request<Head | undefined>(
      tx.objectStore("head").get("current"),
    );
    if (!h) {
      await done;
      return null;
    }
    if (!validHead(h))
      throw Error(
        "Your saved record needs recovery. The original data has been kept.",
      );
    if (h.core === null) {
      await done;
      return { character: null, revision: h.revision };
    }
    const core = { ...h.core };
    await Promise.all(
      Object.entries(h.lengths).map(async ([field, length]) => {
        const count = await request(
          tx
            .objectStore("history")
            .count(IDBKeyRange.bound(`${field}:`, `${field}:\uffff`)),
        );
        if (count !== Math.ceil(length! / SIZE))
          throw Error(
            "A saved history is incomplete. The original data has been kept.",
          );
        const chunks = await Promise.all(
          Array.from({ length: count }, (_, i) =>
            request<unknown[]>(tx.objectStore("history").get(`${field}:${i}`)),
          ),
        );
        if (
          chunks.some(
            (c, i) =>
              !Array.isArray(c) ||
              c.length !== Math.min(SIZE, length! - i * SIZE),
          )
        )
          throw Error(
            "A saved history is incomplete. The original data has been kept.",
          );
        core[field] = chunks.flat();
      }),
    );
    await done;
    if (!validateCharacter(core))
      throw Error(
        "Your saved character needs recovery. The original data has been kept.",
      );
    return { character: core, revision: h.revision };
  } finally {
    db.close();
  }
}
export async function commitPrimary(
  character: Character | null,
  expected: number,
  previous: Character | null = null,
): Promise<number> {
  if (character && !validateCharacter(character))
    throw Error("This character cannot be saved.");
  const db = await open();
  try {
    const tx = db.transaction(["head", "history"], "readwrite", {
        durability: "strict",
      }),
      done = complete(tx);
    try {
      const heads = tx.objectStore("head"),
        history = tx.objectStore("history");
      const old = await request<Head | undefined>(heads.get("current"));
      if (
        (Number.isSafeInteger(old?.revision) ? old!.revision : 0) !== expected
      )
        throw Error(
          "Progress changed in another Guild window. Reload before making more changes.",
        );
      if (!previous || previous.id !== character?.id) history.clear();
      const lengths: Head["lengths"] = {},
        core = character ? ({ ...character } as Record<string, unknown>) : null;
      for (const field of HISTORY_FIELDS) {
        const items = character?.[field],
          prior = previous?.[field];
        if (core) delete core[field];
        if (items) lengths[field] = items.length;
        const count = Math.ceil((items?.length || 0) / SIZE),
          oldCount = Math.ceil((previous?.[field]?.length || 0) / SIZE);
        for (let i = 0; i < count; i++) {
          const start = i * SIZE,
            end = Math.min(start + SIZE, items!.length);
          const unchanged =
            previous?.id === character?.id &&
            prior &&
            Math.min(start + SIZE, prior.length) === end &&
            items!
              .slice(start, end)
              .every((item, j) => item === prior[start + j]);
          if (!unchanged)
            history.put(items!.slice(start, end), `${field}:${i}`);
        }
        for (let i = count; i < oldCount; i++) history.delete(`${field}:${i}`);
      }
      heads.put(
        { version: 1, revision: expected + 1, core, lengths } satisfies Head,
        "current",
      );
      await done;
      return expected + 1;
    } catch (e) {
      try {
        tx.abort();
      } catch {
        /* Already settled. */
      }
      await done.catch(() => {});
      throw e;
    }
  } finally {
    db.close();
  }
}
export async function primaryRevision(): Promise<number> {
  const db = await open();
  try {
    const h = await request<Head | undefined>(
      db.transaction("head").objectStore("head").get("current"),
    );
    return Number.isSafeInteger(h?.revision) ? h!.revision : 0;
  } finally {
    db.close();
  }
}
export async function loadPrimary(): Promise<PrimaryRecord> {
  const stored = await readPrimary();
  if (stored) {
    if (!stored.character) return stored;
    const upgraded = upgradeSavedCharacter(stored.character);
    return upgraded === stored.character
      ? stored
      : {
          character: upgraded,
          revision: await commitPrimary(
            upgraded,
            stored.revision,
            stored.character,
          ),
        };
  }
  // A failed migration never removes the source. A committed empty record prevents resurrection.
  const legacy = loadCharacter();
  if (!legacy) return { character: null, revision: 0 };
  try {
    const revision = await commitPrimary(legacy, 0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Database remains authoritative. */
    }
    return { character: legacy, revision };
  } catch (e) {
    // Another window may have completed the same migration first.
    const winner = await readPrimary();
    if (winner) return winner;
    throw e;
  }
}
export async function exportOriginalPrimary(): Promise<string> {
  let db: IDBDatabase;
  try {
    db = await open();
  } catch {
    return localStorage.getItem(STORAGE_KEY) || "";
  }
  try {
    const tx = db.transaction(["head", "history"]);
    const [head, keys, values] = await Promise.all([
      request(tx.objectStore("head").get("current")),
      request(tx.objectStore("history").getAllKeys()),
      request(tx.objectStore("history").getAll()),
    ]);
    return head
      ? JSON.stringify(
          {
            head,
            history: Object.fromEntries(
              keys.map((k, i) => [String(k), values[i]]),
            ),
          },
          null,
          2,
        )
      : localStorage.getItem(STORAGE_KEY) || "";
  } finally {
    db.close();
  }
}
