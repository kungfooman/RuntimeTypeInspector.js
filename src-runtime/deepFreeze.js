/**
 * Deep-freezes a cached type tree (one-time per cache entry, negligible
 * amortized). Validation is read-only over expect trees, so shared cache
 * entries must never be mutated by later readers: freezing turns a future
 * mutator from silent cache corruption into a loud failure the suite
 * catches instead.
 * @param {*} value - The tree to freeze.
 * @returns {*} The frozen tree.
 * @example
 * substitutedCache.set(key, deepFreeze(substituted));
 */
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      deepFreeze(value[key]);
    }
  }
  return value;
}
export {deepFreeze};
