import { describe, it, expect } from "vitest";
import { SaveQueue } from "./save-queue";
const deferred = () => {
  let resolve!: () => void, reject!: (e: Error) => void;
  const promise = new Promise<void>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
describe("durable save receipts", () => {
  it("shows pending progress but waits for commit before acknowledging it", async () => {
    const gate = deferred(),
      events: unknown[] = [];
    const q = new SaveQueue(
      0,
      () => gate.promise,
      (...e) => events.push(e),
    );
    let acknowledged = false;
    const receipt = q.enqueue(1).then((ok) => {
      acknowledged = ok;
      return ok;
    });
    expect(q.current).toBe(1);
    expect(q.committed).toBe(0);
    expect(q.pending).toBe(true);
    await Promise.resolve();
    expect(acknowledged).toBe(false);
    gate.resolve();
    expect(await receipt).toBe(true);
    await q.idle();
    expect(q.committed).toBe(1);
    expect(events.at(-1)).toEqual([1, false]);
  });
  it("serializes writes against the last committed record", async () => {
    const gates = [deferred(), deferred()],
      writes: unknown[] = [];
    const q = new SaveQueue(
      0,
      (next, previous) => {
        writes.push([next, previous]);
        return gates[writes.length - 1].promise;
      },
      () => {},
    );
    const a = q.enqueue(1),
      b = q.enqueue(2);
    expect(writes).toEqual([[1, 0]]);
    gates[0].resolve();
    expect(await a).toBe(true);
    expect(writes).toEqual([
      [1, 0],
      [2, 1],
    ]);
    gates[1].resolve();
    expect(await b).toBe(true);
    await q.idle();
    expect(q.committed).toBe(2);
  });
  it("rolls back a failed change and dependent changes while retaining acknowledged progress", async () => {
    let count = 0;
    const gate = deferred(),
      events: unknown[] = [];
    const q = new SaveQueue(
      0,
      async () => {
        if (++count > 1) await gate.promise;
      },
      (...e) => events.push(e),
    );
    expect(await q.enqueue(1)).toBe(true);
    const a = q.enqueue(2),
      b = q.enqueue(3),
      idle = q.idle();
    gate.reject(Error("Quota exceeded"));
    expect(await a).toBe(false);
    expect(await b).toBe(false);
    await idle;
    expect(q.current).toBe(1);
    expect(q.committed).toBe(1);
    expect(count).toBe(2);
    expect(events.at(-1)).toEqual([1, false, "Quota exceeded"]);
  });
  it("can save again after failure and commits a reset as an explicit empty record", async () => {
    let fail = true;
    const q = new SaveQueue<string | null>(
      "original",
      async () => {
        if (fail) throw Error("offline storage");
      },
      () => {},
    );
    expect(await q.enqueue("lost")).toBe(false);
    expect(q.current).toBe("original");
    fail = false;
    expect(await q.enqueue("retained")).toBe(true);
    expect(await q.enqueue(null)).toBe(true);
    expect(q.committed).toBe(null);
  });
});
