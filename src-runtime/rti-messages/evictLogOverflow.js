import {findLogEntry} from './findLogEntry.js';
/**
 * Evicts the oldest overflow entries from a panel log so the download holds
 * at most `maxSize` entries, newest wins. Two phases: first superseded
 * duplicates go (an entry the same key repeats later), so one distinct
 * check outranks extra firings of a hot one; then, if still over cap, the
 * oldest entries go outright, guarded or not — whole quiet keys can fall
 * out of the download while their rows and hit counts stay exact. The
 * `guarded` set only orders the second phase last: guarded entries are
 * dropped after every unguarded one, so a caller pinning each key's latest
 * entry still biases survival without breaking the ceiling. Never throws:
 * a hostile log keeps best-effort contents instead of breaking the report.
 * @param {object[]} log - The panel `eventLog`, mutated in place.
 * @param {number} maxSize - Kept entries ceiling.
 * @param {Set<object>} [guarded] - Entries dropped last, e.g. each key's
 * latest entry when a faster path than the rescan already knows them.
 * @returns {object[]} The same log, oldest overflow gone first.
 * @example evictLogOverflow([{key: 'a'}, {key: 'a'}, {key: 'b'}], 2) // [{key: 'a'}, {key: 'b'}]
 */
function evictLogOverflow(log, maxSize, guarded) {
  try {
    if (!Array.isArray(log)) {
      return log;
    }
    let overflow = log.length - maxSize;
    if (!(overflow > 0)) {
      return log;
    }
    const dropAt = (at) => {
      log.splice(at, 1);
      overflow--;
      return at - 1;
    };
    const stillOver = () => overflow > 0;
    // Phase one: superseded duplicates first; guarded entries wait.
    for (let at = 0; at < log.length && stillOver(); at++) {
      const entry = log[at];
      if (entry === null || entry === undefined) {
        at = dropAt(at);
        continue;
      }
      if (guarded !== undefined && guarded.has(entry)) {
        continue;
      }
      let entryKey;
      try {
        entryKey = entry.key;
      } catch {
        continue;
      }
      if (findLogEntry(log.slice(at + 1), entryKey) === undefined) {
        continue;
      }
      at = dropAt(at);
    }
    // Phase two: oldest outright, unguarded before guarded — the ceiling
    // holds even when distinct keys outnumber it.
    for (let pass = 0; pass < 2 && stillOver(); pass++) {
      const spareGuarded = pass === 1;
      for (let at = 0; at < log.length && stillOver(); at++) {
        const entry = log[at];
        const isGuarded = guarded !== undefined && guarded.has(entry);
        if (isGuarded !== spareGuarded) {
          continue;
        }
        at = dropAt(at);
      }
    }
    return log;
  } catch {
    return log;
  }
}
export {evictLogOverflow};
