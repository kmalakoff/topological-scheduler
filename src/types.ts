// Re-export DependencyGraph from topological-sort-group
export type { DependencyGraph } from 'topological-sort-group';

export interface SchedulerOptions {
  concurrency?: number; // Default: 1
  failDependents?: boolean; // Skip nodes whose dependencies failed
}

export type WorkerCallback<R> = (err?: Error, result?: R) => void;

export type WorkerFunction<T, R> = (item: T, id: string, callback: WorkerCallback<R>) => void;

export interface SchedulerResult<T, R> {
  id: string;
  item: T;
  result?: R;
  error?: Error;
  skipped?: boolean;
}

export type SchedulerCallback<T, R> = (err?: Error, results?: SchedulerResult<T, R>[]) => void;
