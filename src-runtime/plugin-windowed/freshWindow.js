/**
 * Validation history of one map instance: checks passed since the last
 * full scan, the current rescan interval, the size the last scan saw,
 * and the scan wall time accumulated since the content last changed.
 * @typedef {object} MapCheckWindow
 * @property {number} sinceLast - Checks passed since the last full scan.
 * @property {number} window - Current rescan interval, doubles while clean.
 * @property {number} lastSize - Map size the last scan saw.
 * @property {number} spentMs - Scan wall time accumulated since the content last changed.
 */
/**
 * New instance history: full scan due at the very first check, intervals
 * doubling from there, no scan spend accumulated yet.
 * @returns {MapCheckWindow} Fresh history record.
 * @example
 * freshWindow(); // {sinceLast: 0, window: 1, lastSize: -1, spentMs: 0}
 */
function freshWindow() {
  // Sizes are non negative integers, so -1 is the unset sentinel: it can
  // never match a real map size, forcing the size based restart into its
  // conservative "changed" branch whenever a record is read before its
  // first scan wrote a real size. Spend starts at 0, so fresh maps are
  // locked out of rides until they have paid real scan time.
  return {sinceLast: 0, window: 1, lastSize: -1, spentMs: 0};
}
export {freshWindow};
