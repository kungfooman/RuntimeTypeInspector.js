/**
 * Deep-freezes a cached type tree (one-time per cache entry, negligible
 * amortized). Validation is read-only over expect trees, so shared cache
 * entries must never be mutated by later readers: freezing turns a future
 * mutator from silent cache corruption into a loud failure the suite
 * catches instead.
 * @param {*} value - The tree to freeze.
 * @returns {*} The frozen tree.
 * @example
 * const tree = deepFreeze({a: {b: 1}});
 * Object.isFrozen(tree) && Object.isFrozen(tree.a); // true
 */
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      // Live `ref` bindings ride on `reference` nodes for identity checks:
      // freezing a user constructor would be an observable side effect
      // (no more static patching), so the tree freezes around them.
      if (key === 'ref') {
        continue;
      }
      deepFreeze(value[key]);
    }
  }
  return value;
}
export {deepFreeze};
