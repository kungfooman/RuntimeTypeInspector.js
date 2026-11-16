/**
 * Runs one best effort action, swallowing sync throws, for fire and
 * forget reporting paths that must never break the check they report.
 * @param {Function} fn - The action to run.
 * @returns {void}
 * @example
 * bestEffort(() => { throw new Error('lost'); });
 */
function bestEffort(fn) {
  try {
    fn();
  } catch {
    // Reporting must never break the check it reports.
  }
}
export {bestEffort};
