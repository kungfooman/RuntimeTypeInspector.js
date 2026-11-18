/**
 * Maps each panel log key to its latest entry, newest wins. The refold and
 * eviction paths need the per-key latest entry without rescanning the whole
 * log: eviction guards it, refolding to one entry per key starts from it.
 * First-seen key order decides the refolded slot order; the content comes
 * from the latest entry. Never throws: a hostile log yields an empty map
 * instead of breaking the switch.
 * @param {object[]} log - The panel `eventLog`, entries carrying `key`.
 * @returns {Map<string, object>} Key to its latest entry.
 * @example latestEntriesByKey([{key: 'a', v: 1}, {key: 'a', v: 2}]).get('a') // {key: 'a', v: 2}
 */
function latestEntriesByKey(log) {
  const latest = new Map();
  try {
    if (!Array.isArray(log)) {
      return latest;
    }
    for (const entry of log) {
      if (entry === null || entry === undefined) {
        continue;
      }
      const keyOf = entry.key;
      if (typeof keyOf !== 'string') {
        continue;
      }
      latest.set(keyOf, entry);
    }
  } catch {
    // Hostile log shape: keep whatever accumulated before the throw.
  }
  return latest;
}
export {latestEntriesByKey};
