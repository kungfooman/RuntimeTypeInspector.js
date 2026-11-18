import {evictLogOverflow  } from './evictLogOverflow.js';
import {latestEntriesByKey} from './latestEntriesByKey.js';
/**
 * Refolds an already collected panel log to a different folding mode, so
 * switching the download style applies to what was logged before the
 * switch, not just to what arrives after. `full` keeps every entry in
 * order; `one` keeps each key's latest entry in place (first-seen slot,
 * latest content); `values` keeps one entry per key per distinct offending
 * value, newest variant content per slot. Entry `hits` are exact: the
 * caller passes the row counts (`readRowHits`), which include coalesced
 * repeat ticks that never reach the log as entries, and the refold stamps
 * them onto the survivors instead of summing the log's partial numbers.
 * Without row counts each kept entry counts its own firing. Over-cap
 * results evict oldest first but never drop a key's surviving entry.
 * Folding forward is lossy: entries already folded to `one` keep
 * only their latest value, so switching back to `values` cannot resurrect
 * the values the fold replaced. Never throws: hostile input yields a
 * best-effort copy instead of breaking the switch.
 * @param {object} args - Named refold inputs.
 * @param {object[]} args.log - The panel `eventLog`, entries carrying `key`.
 * @param {'one'|'values'|'full'} args.mode - The folding to apply.
 * @param {number} args.maxSize - Kept entries ceiling.
 * @param {Map<string, number>} [args.hitsByKey] - Exact firing counts per
 * key, e.g. from `readRowHits(this.warnings)`.
 * @returns {object[]} The refolded log, newest fold content per slot.
 * @example refoldLogEntries({log: [{key: 'a', hits: 1}], mode: 'one', maxSize: 1000}) // [{key: 'a', hits: 1}]
 */
function refoldLogEntries({log, mode, maxSize, hitsByKey}) {
  try {
    const kept = Array.isArray(log) ? log.slice() : [];
    if (mode === 'full') {
      evictLogOverflow(kept, maxSize);
      return kept;
    }
    const latest = latestEntriesByKey(kept);
    const stampHits = (entry) => {
      if (hitsByKey === undefined) {
        return;
      }
      try {
        const count = hitsByKey.get(entry.key);
        if (typeof count === 'number' && Number.isFinite(count)) {
          entry.hits = count;
        }
      } catch {
        // Hostile hits map: keep the entry's own count.
      }
    };
    const folded = [];
    if (mode === 'one') {
      for (const entry of latest.values()) {
        stampHits(entry);
        if (entry.hits === undefined) {
          entry.hits = 1;
        }
        folded.push(entry);
      }
      evictLogOverflow(folded, maxSize);
      return folded;
    }
    const foldedByVariant = new Map();
    for (const entry of kept) {
      if (entry === null || entry === undefined) {
        continue;
      }
      if (typeof entry.key !== 'string') {
        continue;
      }
      const variantKey = `${entry.key}${String(entry.valueToString)}`;
      const seen = foldedByVariant.get(variantKey);
      if (seen === undefined) {
        stampHits(entry);
        if (entry.hits === undefined) {
          entry.hits = 1;
        }
        foldedByVariant.set(variantKey, entry);
        folded.push(entry);
        continue;
      }
      Object.assign(seen, entry);
      stampHits(seen);
    }
    evictLogOverflow(folded, maxSize);
    return folded;
  } catch {
    return Array.isArray(log) ? log.slice() : [];
  }
}
export {refoldLogEntries};
