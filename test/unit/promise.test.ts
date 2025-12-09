import assert from 'assert';
import Pinkie from 'pinkie-promise';
import schedule, { type DependencyGraph } from 'topological-scheduler';
import { arrayFind } from '../lib/compat.ts';

describe('topological-scheduler (promise)', () => {
  (() => {
    // patch and restore promise
    if (typeof global === 'undefined') return;
    const globalPromise = global.Promise;
    before(() => {
      global.Promise = Pinkie;
    });
    after(() => {
      global.Promise = globalPromise;
    });
  })();

  it('returns promise when no callback provided', async () => {
    const graph: DependencyGraph<string> = {
      nodes: { a: 'A', b: 'B' },
      dependencies: { a: [], b: ['a'] },
    };

    const results = await schedule(graph, (_item, id, cb) => cb(null, `result-${id}`), { concurrency: 1 });

    assert.equal(results.length, 2);
    const aResult = arrayFind(results, (r) => r.id === 'a');
    const bResult = arrayFind(results, (r) => r.id === 'b');
    assert.equal(aResult.result, 'result-a');
    assert.equal(bResult.result, 'result-b');
  });
});
