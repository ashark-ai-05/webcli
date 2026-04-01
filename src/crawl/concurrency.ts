export class ConcurrencyController {
  private active = 0;
  private waiters: (() => void)[] = [];

  constructor(
    private maxConcurrency: number = 5,
    private delayMs: number = 1000,
  ) {}

  async acquire(): Promise<void> {
    if (this.active < this.maxConcurrency) {
      this.active++;
      return;
    }
    // Wait for a slot
    await new Promise<void>(resolve => this.waiters.push(resolve));
    this.active++;
  }

  async release(): Promise<void> {
    this.active--;
    // Polite delay between requests
    if (this.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }
    const next = this.waiters.shift();
    if (next) next();
  }

  getActive(): number { return this.active; }
}
