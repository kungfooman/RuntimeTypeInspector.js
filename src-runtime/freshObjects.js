/**
 * Fresh-object-literal tracking for TypeScript-parity excess checks. `tsc`
 * rejects unknown keys only on fresh literals (`f({...extra})` throws while
 * `const o = {...extra}; f(o)` passes), but runtime values carry no
 * literal-vs-variable provenance. The transpiler restores it by wrapping
 * each fresh literal subexpression at a checked call site with `markFresh`;
 * validators read it back with `isFresh` per object node (outer fresh with
 * a stale inner value checks only the outer level, exactly like `tsc`).
 * A `WeakSet` keeps entries garbage-collectable and `markFresh` returns its
 * argument, so wrapping never changes the evaluated value.
 * @example
 * markFresh({a: 1}) !== {a: 1}; // true: identity is a new object
 * @example
 * const fresh = markFresh({a: 1});
 * isFresh(fresh); // true
 * @example
 * isFresh({a: 1}); // false: never wrapped, so stale
 */
const freshObjects = new WeakSet();
/**
 * Tags a value as a fresh object literal, returning it for inline wrapping.
 * Primitives pass through untouched: only objects can carry excess keys.
 * @param {*} value - The value to tag.
 * @returns {*} The same value.
 */
function markFresh(value) {
  if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
    freshObjects.add(value);
  }
  return value;
}
/**
 * Reports whether a value was tagged as a fresh object literal.
 * Never throws: revoked proxies and exotic values read as stale.
 * @param {*} value - The value to test.
 * @returns {boolean} True when the value was tagged fresh.
 */
function isFresh(value) {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return false;
  }
  try {
    return freshObjects.has(value);
  } catch {
    return false;
  }
}
export {markFresh, isFresh};
