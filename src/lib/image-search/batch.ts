export type BatchRunOptions<T, R> = {
  items: T[];
  concurrency: number;
  worker: (item: T) => Promise<R>;
  delayBetweenMs?: number;
};

export async function runWithConcurrency<T, R>(
  options: BatchRunOptions<T, R>
): Promise<R[]> {
  const concurrency = Math.max(1, Math.min(options.concurrency, 10));
  const results: R[] = new Array(options.items.length);
  let index = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const current = index++;
      if (current >= options.items.length) return;
      results[current] = await options.worker(options.items[current]);
      if (options.delayBetweenMs) {
        await new Promise((resolve) => setTimeout(resolve, options.delayBetweenMs));
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, options.items.length) }, () => runWorker());
  await Promise.all(workers);
  return results;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
