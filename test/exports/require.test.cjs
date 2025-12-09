const assert = require('assert');
const scheduler = require('topological-scheduler');
const schedule = require('topological-scheduler');

describe('exports .cjs', () => {
  it('exports', () => {
    assert.equal(typeof scheduler, 'function');
  });

  it('named exports', () => {
    assert.equal(typeof schedule, 'function');
  });
});
