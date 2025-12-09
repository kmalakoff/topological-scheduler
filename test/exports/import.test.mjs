import assert from 'assert';
import schedule, * as scheduler from 'topological-scheduler';

describe('exports .mjs', () => {
  it('exports', () => {
    assert.equal(typeof scheduler.default, 'function');
  });

  it('named exports', () => {
    assert.equal(typeof schedule, 'function');
  });
});
