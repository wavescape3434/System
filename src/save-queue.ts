/** Optimistic views; receipts succeed only after durable commit. A failed write drops dependent changes. */
export class SaveQueue<T> {
  current: T;
  committed: T;
  private queue: { value: T; resolve: (ok: boolean) => void }[] = [];
  private running = false;
  private waiters: (() => void)[] = [];
  constructor(
    initial: T,
    private persist: (value: T, previous: T) => Promise<void>,
    private changed: (value: T, pending: boolean, error?: string) => void,
  ) {
    this.current = this.committed = initial;
  }
  get pending() {
    return this.running || this.queue.length > 0;
  }
  enqueue(value: T): Promise<boolean> {
    this.current = value;
    const receipt = new Promise<boolean>((resolve) =>
      this.queue.push({ value, resolve }),
    );
    this.changed(value, true);
    void this.drain();
    return receipt;
  }
  idle(): Promise<void> {
    return this.pending
      ? new Promise((resolve) => this.waiters.push(resolve))
      : Promise.resolve();
  }
  private async drain() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length) {
      const item = this.queue[0];
      try {
        await this.persist(item.value, this.committed);
        this.committed = item.value;
        this.queue.shift();
        item.resolve(true);
      } catch (e) {
        const dropped = this.queue.splice(0);
        this.current = this.committed;
        this.running = false;
        this.changed(
          this.committed,
          false,
          e instanceof Error ? e.message : "The save failed.",
        );
        dropped.forEach((item) => item.resolve(false));
        this.waiters.splice(0).forEach((resolve) => resolve());
        return;
      }
    }
    this.running = false;
    this.changed(this.current, false);
    this.waiters.splice(0).forEach((resolve) => resolve());
  }
}
