import assert from 'assert';
import schedule, { type DependencyGraph } from 'topological-scheduler';
import { arrayFind, arrayIncludes } from '../lib/compat.ts';

describe('topological-scheduler (callback)', () => {
  describe('basic execution', () => {
    it('executes tasks in dependency order', (done) => {
      const order: string[] = [];
      const graph: DependencyGraph<string> = {
        nodes: { a: 'A', b: 'B', c: 'C' },
        dependencies: { a: [], b: ['a'], c: ['b'] },
      };

      schedule(
        graph,
        (_item, id, cb) => {
          order.push(id);
          cb(null, `done-${id}`);
        },
        { concurrency: 1 },
        (err, results) => {
          assert.equal(err, null);
          assert.deepEqual(order, ['a', 'b', 'c']);
          assert.equal(results.length, 3);
          done();
        }
      );
    });

    it('executes independent tasks in parallel', (done) => {
      const startTimes: Record<string, number> = {};
      const graph: DependencyGraph<string> = {
        nodes: { a: 'A', b: 'B', c: 'C' },
        dependencies: { a: [], b: [], c: ['a', 'b'] },
      };

      schedule(
        graph,
        (_item, id, cb) => {
          startTimes[id] = Date.now();
          setTimeout(() => {
            cb(null, id);
          }, 10);
        },
        { concurrency: 2 },
        (err, _results) => {
          assert.equal(err, null);
          // a and b should start at roughly the same time
          const diff = Math.abs(startTimes.a - startTimes.b);
          assert.ok(diff < 5, `a and b should start together, diff: ${diff}`);
          // c should start after both a and b
          assert.ok(startTimes.c >= startTimes.a + 10 - 5);
          assert.ok(startTimes.c >= startTimes.b + 10 - 5);
          done();
        }
      );
    });

    it('handles empty graph', (done) => {
      const graph: DependencyGraph<string> = {
        nodes: {},
        dependencies: {},
      };

      schedule(
        graph,
        (_item, id, cb) => cb(null, id),
        { concurrency: 1 },
        (err, results) => {
          assert.equal(err, null);
          assert.deepEqual(results, []);
          done();
        }
      );
    });
  });

  describe('error handling', () => {
    it('reports errors in results', (done) => {
      const graph: DependencyGraph<string> = {
        nodes: { a: 'A', b: 'B' },
        dependencies: { a: [], b: [] },
      };

      schedule(
        graph,
        (_item, id, cb) => {
          if (id === 'a') cb(new Error('fail-a'));
          else cb(null, 'ok');
        },
        { concurrency: 2 },
        (err, results) => {
          assert.equal(err, null); // No top-level error
          const aResult = arrayFind(results, (r) => r.id === 'a');
          const bResult = arrayFind(results, (r) => r.id === 'b');
          assert.ok(aResult.error);
          assert.equal(aResult.error.message, 'fail-a');
          assert.equal(bResult.result, 'ok');
          done();
        }
      );
    });

    it('skips dependents when failDependents is true', (done) => {
      const executed: string[] = [];
      const graph: DependencyGraph<string> = {
        nodes: { a: 'A', b: 'B', c: 'C' },
        dependencies: { a: [], b: ['a'], c: [] },
      };

      schedule(
        graph,
        (_item, id, cb) => {
          executed.push(id);
          if (id === 'a') cb(new Error('fail'));
          else cb(null, 'ok');
        },
        { concurrency: 1, failDependents: true },
        (err, results) => {
          assert.equal(err, null);
          // b should be skipped because a failed
          assert.ok(!arrayIncludes(executed, 'b'), 'b should not be executed');
          assert.ok(arrayIncludes(executed, 'c'), 'c should be executed');
          const bResult = arrayFind(results, (r) => r.id === 'b');
          assert.ok(bResult.skipped);
          done();
        }
      );
    });

    it('executes dependents when failDependents is false (default)', (done) => {
      const executed: string[] = [];
      const graph: DependencyGraph<string> = {
        nodes: { a: 'A', b: 'B' },
        dependencies: { a: [], b: ['a'] },
      };

      schedule(
        graph,
        (_item, id, cb) => {
          executed.push(id);
          if (id === 'a') cb(new Error('fail'));
          else cb(null, 'ok');
        },
        { concurrency: 1 },
        (err, _results) => {
          assert.equal(err, null);
          // b should still execute even though a failed
          assert.ok(arrayIncludes(executed, 'b'));
          done();
        }
      );
    });
  });

  describe('concurrency control', () => {
    it('respects concurrency limit', (done) => {
      let maxConcurrent = 0;
      let currentConcurrent = 0;
      const graph: DependencyGraph<string> = {
        nodes: { a: 'A', b: 'B', c: 'C', d: 'D' },
        dependencies: { a: [], b: [], c: [], d: [] },
      };

      schedule(
        graph,
        (_item, id, cb) => {
          currentConcurrent++;
          if (currentConcurrent > maxConcurrent) maxConcurrent = currentConcurrent;
          setTimeout(() => {
            currentConcurrent--;
            cb(null, id);
          }, 10);
        },
        { concurrency: 2 },
        (err, _results) => {
          assert.equal(err, null);
          assert.equal(maxConcurrent, 2);
          done();
        }
      );
    });

    it('defaults to concurrency 1', (done) => {
      let maxConcurrent = 0;
      let currentConcurrent = 0;
      const graph: DependencyGraph<string> = {
        nodes: { a: 'A', b: 'B', c: 'C' },
        dependencies: { a: [], b: [], c: [] },
      };

      schedule(
        graph,
        (_item, id, cb) => {
          currentConcurrent++;
          if (currentConcurrent > maxConcurrent) maxConcurrent = currentConcurrent;
          setTimeout(() => {
            currentConcurrent--;
            cb(null, id);
          }, 5);
        },
        {},
        (err, _results) => {
          assert.equal(err, null);
          assert.equal(maxConcurrent, 1);
          done();
        }
      );
    });
  });

  describe('complex graphs', () => {
    it('handles diamond dependency pattern', (done) => {
      // Diamond: a -> b,c -> d
      const order: string[] = [];
      const graph: DependencyGraph<string> = {
        nodes: { a: 'A', b: 'B', c: 'C', d: 'D' },
        dependencies: { a: [], b: ['a'], c: ['a'], d: ['b', 'c'] },
      };

      schedule(
        graph,
        (_item, id, cb) => {
          order.push(id);
          cb(null, id);
        },
        { concurrency: 4 },
        (err, _results) => {
          assert.equal(err, null);
          // a must come before b and c
          assert.ok(order.indexOf('a') < order.indexOf('b'));
          assert.ok(order.indexOf('a') < order.indexOf('c'));
          // b and c must come before d
          assert.ok(order.indexOf('b') < order.indexOf('d'));
          assert.ok(order.indexOf('c') < order.indexOf('d'));
          done();
        }
      );
    });

    it('handles multiple independent chains', (done) => {
      // Two chains: a -> b -> c and x -> y -> z
      const order: string[] = [];
      const graph: DependencyGraph<string> = {
        nodes: { a: 'A', b: 'B', c: 'C', x: 'X', y: 'Y', z: 'Z' },
        dependencies: { a: [], b: ['a'], c: ['b'], x: [], y: ['x'], z: ['y'] },
      };

      schedule(
        graph,
        (_item, id, cb) => {
          order.push(id);
          setTimeout(() => {
            cb(null, id);
          }, 5);
        },
        { concurrency: 2 },
        (err, _results) => {
          assert.equal(err, null);
          // Chain 1: a before b before c
          assert.ok(order.indexOf('a') < order.indexOf('b'));
          assert.ok(order.indexOf('b') < order.indexOf('c'));
          // Chain 2: x before y before z
          assert.ok(order.indexOf('x') < order.indexOf('y'));
          assert.ok(order.indexOf('y') < order.indexOf('z'));
          done();
        }
      );
    });
  });

  describe('result structure', () => {
    it('includes id, item, and result in results', (done) => {
      const graph: DependencyGraph<{ name: string }> = {
        nodes: { a: { name: 'A' } },
        dependencies: { a: [] },
      };

      schedule(
        graph,
        (item, _id, cb) => cb(null, item.name.toLowerCase()),
        { concurrency: 1 },
        (err, results) => {
          assert.equal(err, null);
          assert.equal(results.length, 1);
          assert.equal(results[0].id, 'a');
          assert.deepEqual(results[0].item, { name: 'A' });
          assert.equal(results[0].result, 'a');
          done();
        }
      );
    });
  });
});
