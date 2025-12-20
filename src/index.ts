import schedule from './schedule.ts';
import type { DependencyGraph, SchedulerCallback, SchedulerOptions, SchedulerResult, WorkerFunction } from './types.ts';

export type { DependencyGraph, SchedulerCallback, SchedulerOptions, SchedulerResult, WorkerCallback, WorkerFunction } from './types.ts';

// Callback interface
function topologicalScheduler<T, R>(graph: DependencyGraph<T>, worker: WorkerFunction<T, R>, options: SchedulerOptions, callback: SchedulerCallback<T, R>): void;

// Promise interface
function topologicalScheduler<T, R>(graph: DependencyGraph<T>, worker: WorkerFunction<T, R>, options?: SchedulerOptions): Promise<SchedulerResult<T, R>[]>;

// Implementation
function topologicalScheduler<T, R>(graph: DependencyGraph<T>, worker: WorkerFunction<T, R>, options?: SchedulerOptions | SchedulerCallback<T, R>, callback?: SchedulerCallback<T, R>): void | Promise<SchedulerResult<T, R>[]> {
  callback = typeof options === 'function' ? options : callback;
  options = typeof options === 'function' ? {} : ((options || {}) as SchedulerOptions);

  if (typeof callback === 'function') return schedule(graph, worker, options, callback);
  return new Promise((resolve, reject) =>
    schedule(graph, worker, options, (err, results) => {
      err ? reject(err) : resolve(results);
    })
  );
}

export default topologicalScheduler;
