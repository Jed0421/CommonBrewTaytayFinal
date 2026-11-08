import { AsyncLocalStorage } from 'node:async_hooks';
const requests = new AsyncLocalStorage<Promise<unknown>[]>();
export function withDatabaseTasks<T>(fn: () => T): T { return requests.run([], fn); }
export function trackDatabaseTask<T>(task: Promise<T>): Promise<T> {
  requests.getStore()?.push(task);
  // Retain failures for the response barrier even when legacy callers catch them.
  void task.catch(() => {});
  return task;
}
export async function drainDatabaseTasks(): Promise<void> {
  const tasks = requests.getStore();
  if (!tasks) return;
  let count = 0;
  let failure: unknown;
  while (count < tasks.length) {
    const batch = tasks.slice(count);
    count = tasks.length;
    const results = await Promise.allSettled(batch);
    for (const result of results) if (result.status === 'rejected') failure ??= result.reason;
  }
  if (failure) throw failure;
}
