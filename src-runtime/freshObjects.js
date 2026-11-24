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
 * Spread-tolerated keys per fresh literal. `tsc` never excess-checks keys
 * arriving through `...spread`: only keys written literally in the fresh
 * object count. The transpiler records the statically written key names
 * beside the mark; validators forgive every other key on that value.
 * @type {WeakMap<object, Set<string>>}
 */
const toleratedKeys = new WeakMap();
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
/**
 * Tags a fresh literal carrying spread elements: only keys written
 * literally in the fresh object count as excess, every other key on the
 * runtime value came through a spread and reads tolerated. Own keys are
 * fixed at emit time, so the written set is derived from the transpiled
 * shape instead of trusting a runtime array.
 * Never throws: exotic values keep their plain fresh mark.
 * @param {*} value - The fresh literal value.
 * @param {string[]} [ownKeys] - Key names written literally in the source.
 * @returns {*} The same value.
 */
function markFreshSpread(value, ownKeys) {
  markFresh(value);
  if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
    try {
      const written = new Set(Array.isArray(ownKeys) ? ownKeys : []);
      toleratedKeys.set(value, written);
    } catch {
      // fall through: the plain fresh mark above still applies
    }
  }
  return value;
}
/**
 * Reports whether an excess key on a fresh value arrived through a spread
 * and is therefore tolerated. Values marked without a spread record (or
 * never marked at all) tolerate nothing: every unknown key counts.
 * Never throws: revoked proxies and exotic values tolerate nothing.
 * @param {*} value - The fresh literal value.
 * @param {string} key - The excess key to test.
 * @returns {boolean} True when the key came through a spread.
 */
function isToleratedSpreadKey(value, key) {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return false;
  }
  try {
    const written = toleratedKeys.get(value);
    if (written === undefined) {
      return false;
    }
    return !written.has(key);
  } catch {
    return false;
  }
}
export {markFresh, isFresh, markFreshSpread, isToleratedSpreadKey};
