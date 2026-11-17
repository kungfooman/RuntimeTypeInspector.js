/**
 * Finds the folded log entry for one panel key, searching newest first so a
 * re-reported key lands on its latest fold instead of rescanning the whole
 * log on every hot loop report. Never throws: the reporting path must
 * survive hostile log shapes without breaking the check.
 * @param {object[]} log - The panel `eventLog`, entries carrying `key`.
 * @param {string} key - The panel key to find.
 * @param {string} [variant] - Optional value discriminator (`valueToString`):
 * when present only a fold with the same key and value matches, so one
 * check can keep one entry per distinct value it failed with.
 * @returns {object|undefined} The stored entry, or undefined when absent.
 * @example findLogEntry([{key: 'a'}, {key: 'b'}], 'b') // {key: 'b'}
 */
function findLogEntry(log, key, variant) {
  try {
    for (let i = log.length - 1; i >= 0; i--) {
      const entry = log[i];
      if (entry === null || entry === undefined) {
        continue;
      }
      if (entry.key !== key) {
        continue;
      }
      if (variant !== undefined && entry.valueToString !== variant) {
        continue;
      }
      return entry;
    }
  } catch {
    // Hostile log shape: report no match instead of breaking the check.
  }
  return undefined;
}
export {findLogEntry};
