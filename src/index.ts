import schedule from './schedule.ts';
import type { DependencyGraph, SchedulerCallback, SchedulerOptions, SchedulerResult, WorkerFunction } from './types.ts';

export type { DependencyGraph, SchedulerCallback, SchedulerOptions, SchedulerResult, WorkerCallback, WorkerFunction } from './types.ts';

// Callback interface
function topologicalScheduler<T, R>(graph: DependencyGraph<T>, worker: WorkerFunction<T, R>, options: SchedulerOptions, callback: SchedulerCallback<T, R>): void;

// Promise interface
function topologicalScheduler<T, R>(graph: DependencyGraph<T>, worker: WorkerFunction<T, R>, options?: SchedulerOptions): Promise<SchedulerResult<T, R>[]>;

// Implementation
function topologicalScheduler<T, R>(graph: DependencyGraph<T>, worker: WorkerFunction<T, R>, options?: SchedulerOptions | SchedulerCallback<T, R>, callback?: SchedulerCallback<T, R>): void | Promise<SchedulerResult<T, R>[]> {
  // Normalize arguments
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  // Callback mode
  if (typeof callback === 'function') return schedule(graph, worker, options, callback);

  // Promise mode
  return new Promise((resolve, reject) => {
    schedule(graph, worker, options as SchedulerOptions, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

export default topologicalScheduler;
