import {findLogEntry} from './findLogEntry.js';
/**
 * Folds one panel log entry into the log by key: same-key ("samish") full
 * reports replace the stored entry in place instead of appending another
 * near-identical row, so one check appears once in the downloaded log no
 * matter how often its failure mode flips (false then undefined for one
 * argument). New keys append at the end with the oldest dropped past the
 * cap, exactly like an uncapped push before. Never throws: the reporting
 * path must survive hostile log shapes without breaking the check.
 * @param {object[]} log - The panel `eventLog`, mutated in place.
 * @param {object} entry - The fresh entry, carrying the panel `key`.
 * @param {number} maxSize - Kept entries ceiling before oldest are dropped.
 * @param {string} [variant] - Optional value discriminator passed through to
 * `findLogEntry`: when present only a fold with the same key and value
 * merges, so one check can keep one entry per distinct value it failed
 * with. The fresh entry inherits the stored fold's `hits` unless it carries
 * its own, so folding never resets the accumulated count.
 * @returns {object} The stored entry (the fresh one when the log was
 * hostile or the key was new).
 * @example upsertLogEntry([], {key: 'a', hits: 1}, 1000) // {key: 'a', hits: 1}
 */
function upsertLogEntry(log, entry, maxSize, variant) {
  try {
    const stored = findLogEntry(log, entry?.key, variant);
    if (stored !== undefined) {
      if (entry.hits === undefined) {
        entry.hits = stored.hits;
      }
      const at = log.indexOf(stored);
      log[at] = entry;
      return entry;
    }
    log.push(entry);
    if (log.length > maxSize) {
      log.splice(0, log.length - maxSize);
    }
    return entry;
  } catch {
    try {
      log.push(entry);
    } catch {
      // Hostile log shape: the row still updates, only the log is lost.
    }
    return entry;
  }
}
export {upsertLogEntry};
