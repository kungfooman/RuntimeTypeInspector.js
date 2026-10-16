import {canonicalKey} from './canonicalKey.js';
const noop = () => undefined;
// We want: lossy JSON siblings to key distinctly, so `-0` and `+0` (and
// `NaN` vs `null`, `undefined` vs missing) never share a cache entry.
function testLossySiblingsDistinct() {
  return canonicalKey(-0) !== canonicalKey(0) &&
    canonicalKey(NaN) !== canonicalKey(null) &&
    canonicalKey(undefined) !== canonicalKey(null) &&
    typeof canonicalKey(['"a"', 1]) === 'string';
}
// We want: key order to never split a hit, while functions and symbols
// opt out instead of sharing wrongly.
function testOrderInsensitiveUnserializableOut() {
  if (canonicalKey({b: 1, a: 2}) !== canonicalKey({a: 2, b: 1})) {
    return false;
  }
  if (canonicalKey(() => {}) !== undefined || canonicalKey(Symbol('s')) !== undefined) {
    return false;
  }
  return canonicalKey({fn: () => {}}) === undefined;
}
const tests = [
  testLossySiblingsDistinct,
  testOrderInsensitiveUnserializableOut,
];
export {tests};
