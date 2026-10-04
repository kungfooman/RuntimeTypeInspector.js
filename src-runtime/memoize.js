/**
 * The cache shapes behind every memo in the runtime, in one place so
 * invalidation and eviction stay uniform instead of reimplemented per call
 * site. Both are allocation-free on hits (no closures, no wrapper objects
 * per lookup): factories run once at module load, lookups are method calls.
 */
/**
 * Identity-keyed self-invalidating cache for derivations over stable
 * nodes (shared type trees, constructors). Entries carry the registry
 * versions they were derived under; a version move recomputes instead of
 * serving stale shapes. WeakMap: dead nodes vanish instead of leaking,
 * so there is deliberately no `clear` or `size`.
 * @param {...Function} versionFns - Nullary functions reading current
 * registry versions (live bindings, inlined).
 * @returns {{has: Function, get: Function, set: Function}} The cache. Check
 * `has` before `get`: cached `undefined` results are valid entries.
 * @example
 * const cache = versionedCache(() => 0);
 * const node = {type: 'object'};
 * cache.set(node, ['a']);
 * cache.get(node); // ['a']
 */
function versionedCache(...versionFns) {
  const map = new WeakMap();
  return {
    has(node) {
      const entry = map.get(node);
      if (!entry) {
        return false;
      }
      for (let i = 0; i < versionFns.length; i++) {
        if (entry.versions[i] !== versionFns[i]()) {
          return false;
        }
      }
      return true;
    },
    get(node) {
      const entry = map.get(node);
      return entry && entry.value;
    },
    set(node, value) {
      map.set(node, {versions: versionFns.map((fn) => fn()), value});
      return value;
    },
  };
}
export {versionedCache};
