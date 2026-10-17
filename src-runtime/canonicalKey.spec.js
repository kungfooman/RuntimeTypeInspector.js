import {canonicalKey} from './canonicalKey.js';
const noop = () => undefined;
// We want: lossy JSON siblings to key distinctly, so `-0` and `+0`
// (`NaN`/`±Infinity` vs `null`, `undefined` vs missing) never share a
// cache entry the way `JSON.stringify` would let them.
function testLossySiblingsDistinct() {
  const keys = [canonicalKey(-0), canonicalKey(0), canonicalKey(NaN), canonicalKey(Infinity), canonicalKey(-Infinity), canonicalKey(null), canonicalKey(undefined)];
  return new Set(keys).size === keys.length && typeof canonicalKey(['"a"', 1]) === 'string';
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
// We want: cycles to skip the cache instead of crashing the key builder,
// while shared (non-cyclic) subtrees still key — the guard tracks the
// current path, not every node ever seen.
function testCyclesSkipSharedStillKeys() {
  const cyclic = {a: 1};
  cyclic.self = cyclic;
  const cyclicList = [1];
  cyclicList.push(cyclicList);
  // A crash aborts the whole runner (no per-test try/catch), so a throwing
  // key builder must surface as a failure, never an abort.
  let cyclicOut;
  let listOut;
  try {
    cyclicOut = canonicalKey(cyclic);
    listOut = canonicalKey(cyclicList);
  } catch {
    return false;
  }
  if (cyclicOut !== undefined || listOut !== undefined) {
    return false;
  }
  const leaf = {a: 1};
  return canonicalKey({x: leaf, y: leaf}) === canonicalKey({x: {a: 1}, y: {a: 1}});
}
// We want: class instances and built-ins with invisible state (`Map`,
// `Set`, `Date`, `RegExp`) to skip the cache — own-enumerable keys alone
// would collapse them all to `"{}"` regardless of shape.
function testExoticObjectsSkip() {
  class Point {
    constructor() {
      this.x = 1;
    }
  }
  const values = [new Map(), new Set(), new Date(0), /x/, new Point()];
  if (!values.every((value) => canonicalKey(value) === undefined)) {
    return false;
  }
  return canonicalKey({}) === '{}' && canonicalKey(Object.create(null)) === '{}';
}
const tests = [
  testLossySiblingsDistinct,
  testOrderInsensitiveUnserializableOut,
  testCyclesSkipSharedStillKeys,
  testExoticObjectsSkip,
];
export {tests};
