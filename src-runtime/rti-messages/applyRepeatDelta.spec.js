import {applyRepeatDelta} from './applyRepeatDelta.js';
function testBumpsByDelta() {
  // A coalesced flush bumps by the delta: one message, many ticks.
  const rows = new Map([['L1-a', {
    hits: 1,
  }]]);
  const out = applyRepeatDelta(rows, {
    key: 'L1-a',
    ticks: 41,
  }, 'abc');
  const row = rows.get('L1-a');
  return out === 'L1-a' && row.hits === 42;
}
function testForeignKeysSuffixed() {
  // Foreign registries bump their own suffixed row, never the local one.
  const rows = new Map([['L1-a@foreign', {
    hits: 1,
  }]]);
  const out = applyRepeatDelta(rows, {
    key: 'L1-a',
    ticks: 2,
    source: 'foreign',
  }, 'abc');
  const row = rows.get('L1-a@foreign');
  return out === 'L1-a@foreign' && row.hits === 3;
}
function testUnknownKeyReturnsNull() {
  // A repeat for a key the panel never saw (reloaded after the report)
  // has no row to bump and no payload to build one from: it lands nowhere.
  const rows = new Map();
  const out = applyRepeatDelta(rows, {
    key: 'nope-x',
    ticks: 5,
  }, 'abc');
  return out === null && rows.size === 0;
}
export const tests = [
  testBumpsByDelta,
  testForeignKeysSuffixed,
  testUnknownKeyReturnsNull,
];
