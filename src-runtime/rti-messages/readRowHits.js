/**
 * Reads the exact firing count per panel row: the row is the source of
 * truth for how often each key fired, including coalesced repeat ticks that
 * never reach the log as entries. Refolding the log to `one` stamps these
 * counts onto the surviving entries instead of summing the log's partial
 * per-entry numbers, which only cover what the log happened to keep.
 * Never throws: a hostile registry reads as no counts instead of breaking
 * the switch.
 * @param {Record<string, {hits?: number}>} warnings - Panel rows by key.
 * @returns {Map<string, number>} Key to its row hit count.
 * @example readRowHits({a: {hits: 42}}).get('a') // 42
 */
function readRowHits(warnings) {
  const hits = new Map();
  try {
    if (warnings === null || warnings === undefined) {
      return hits;
    }
    for (const key of Object.keys(warnings)) {
      const row = warnings[key];
      if (row === null || row === undefined) {
        continue;
      }
      const count = row.hits;
      if (typeof count === 'number' && Number.isFinite(count)) {
        hits.set(key, count);
      }
    }
  } catch {
    // Hostile registry: keep whatever accumulated before the throw.
  }
  return hits;
}
export {readRowHits};
