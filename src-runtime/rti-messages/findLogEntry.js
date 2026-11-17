/**
 * Finds the folded log entry for one panel key, searching newest first so a
 * re-reported key lands on its latest fold instead of rescanning the whole
 * log on every hot loop report. Never throws: the reporting path must
 * survive hostile log shapes without breaking the check.
 * @param {object[]} log - The panel `eventLog`, entries carrying `key`.
 * @param {string} key - The panel key to find.
 * @returns {object|undefined} The stored entry, or undefined when absent.
 * @example findLogEntry([{key: 'a'}, {key: 'b'}], 'b') // {key: 'b'}
 */
function findLogEntry(log, key) {
  try {
    for (let i = log.length - 1; i >= 0; i--) {
      if (log[i]?.key === key) {
        return log[i];
      }
    }
  } catch {
    // Hostile log shape: report no match instead of breaking the check.
  }
  return undefined;
}
export {findLogEntry};
