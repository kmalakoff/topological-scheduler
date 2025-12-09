import assert from 'assert';
import * as scheduler from 'topological-scheduler';
import schedule, { type DependencyGraph, type SchedulerOptions, type WorkerFunction } from 'topological-scheduler';

describe('exports .ts', () => {
  it('exports', () => {
    assert.equal(typeof scheduler.default, 'function');
  });

  it('named exports', () => {
    assert.equal(typeof schedule, 'function');
  });

  it('types are usable', () => {
    const graph: DependencyGraph<string> = {
      nodes: { a: 'A' },
      dependencies: { a: [] },
    };
    assert.ok(graph);

    const options: SchedulerOptions = { concurrency: 2 };
    assert.ok(options);

    const worker: WorkerFunction<string, string> = (item, _id, cb) => cb(null, item);
    assert.ok(worker);
  });
});
