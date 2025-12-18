import type { DependencyGraph, SchedulerCallback, SchedulerOptions, SchedulerResult, WorkerFunction } from './types.ts';

export default function schedule<T, R>(graph: DependencyGraph<T>, worker: WorkerFunction<T, R>, options: SchedulerOptions, callback: SchedulerCallback<T, R>): void {
  const { nodes, dependencies } = graph;
  const concurrency = options.concurrency || 1;
  const failDependents = !!options.failDependents;

  // Build dependents map (reverse of dependencies)
  const dependents: Record<string, string[]> = {};
  for (const id in nodes) {
    dependents[id] = [];
  }
  for (const id in dependencies) {
    const deps = dependencies[id];
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i];
      if (dependents[dep]) {
        dependents[dep].push(id);
      }
    }
  }

  // Compute in-degrees and find roots
  const inDegree: Record<string, number> = {};
  const roots: string[] = [];
  for (const id in nodes) {
    const deps = dependencies[id] || [];
    inDegree[id] = deps.length;
    if (deps.length === 0) {
      roots.push(id);
    }
  }

  // State tracking
  const results: SchedulerResult<T, R>[] = [];
  const completed: Record<string, boolean> = {};
  const failed: Record<string, boolean> = {};
  const skipped: Record<string, boolean> = {};
  const running: Record<string, boolean> = {};
  let runningCount = 0;
  let completedCount = 0;
  const ready: string[] = roots.slice();

  // Count total entries
  let totalEntries = 0;
  for (const _id in nodes) {
    totalEntries++;
  }

  // Handle empty graph
  if (totalEntries === 0) return callback(null, results);

  const hasFailedDependency = (id: string): boolean => {
    if (!failDependents) return false;
    const deps = dependencies[id] || [];
    for (let i = 0; i < deps.length; i++) {
      if (failed[deps[i]] || skipped[deps[i]]) return true;
    }
    return false;
  };

  const onComplete = (id: string, didFail: boolean, wasSkipped = false): void => {
    delete running[id];
    runningCount--;
    completed[id] = true;
    completedCount++;
    if (didFail) failed[id] = true;
    if (wasSkipped) skipped[id] = true;

    // Unlock dependents
    const deps = dependents[id] || [];
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i];
      inDegree[dep]--;
      if (inDegree[dep] === 0) {
        ready.push(dep);
      }
    }

    if (completedCount === totalEntries) {
      callback(null, results);
    } else {
      tryStartNext();
    }
  };

  const runItem = (id: string): void => {
    const item = nodes[id];

    worker(item, id, (err?: Error, result?: R) => {
      const schedulerResult: SchedulerResult<T, R> = { id, item };
      if (err) {
        schedulerResult.error = err;
      } else {
        schedulerResult.result = result;
      }
      results.push(schedulerResult);
      onComplete(id, !!err);
    });
  };

  const tryStartNext = (): void => {
    while (ready.length > 0 && runningCount < concurrency) {
      const id = ready.shift();
      if (hasFailedDependency(id)) {
        // Skip this item and mark as skipped
        const item = nodes[id];
        results.push({ id, item, skipped: true });
        skipped[id] = true;
        onComplete(id, false, true);
        continue;
      }
      running[id] = true;
      runningCount++;
      runItem(id);
    }
  };

  tryStartNext();
}
