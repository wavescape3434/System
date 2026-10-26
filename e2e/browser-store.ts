// Test fixtures use the same primary database as the app; no production storage shim.
import {
  readPrimary,
  commitPrimary,
  PRIMARY_DATABASE,
} from "../src/primary-store";
export async function readString(): Promise<string | null> {
  for (let i = 0; document.querySelector(".save-state") && i < 500; i++)
    await new Promise((r) => setTimeout(r, 10));
  try {
    const record = await readPrimary();
    return record?.character
      ? JSON.stringify(record.character)
      : localStorage.getItem("the-guild.character.v1");
  } catch {
    return localStorage.getItem("the-guild.character.v1");
  }
}
export async function replaceString(value: string): Promise<void> {
  const old = await readPrimary();
  let c: unknown;
  try {
    c = JSON.parse(value);
  } catch {
    c = value;
  }
  const { validateCharacter } = await import("../src/storage");
  if (validateCharacter(c)) {
    await commitPrimary(c, old?.revision || 0, old?.character || null);
    return;
  }
  if (!old) {
    localStorage.setItem("the-guild.character.v1", value);
    return;
  }
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open(PRIMARY_DATABASE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("head", "readwrite");
      tx.objectStore("head").put(
        { version: 1, revision: old.revision + 1, core: c, lengths: {} },
        "current",
      );
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
