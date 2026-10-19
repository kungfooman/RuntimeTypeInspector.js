import {options} from "./options.js";
import {captureStackLines} from "./captureStack.js";
/**
 * Hotspot statistics per validation call site (loc). Each row counts how
 * often a loc was checked, how many map window rides and full map scans
 * happened on its behalf, and the wall time scans and top level checks
 * took. The panel sorts rows by scan cost, so tuning targets (like the
 * `mapCheckWindowCap`) come from measurements instead of guesses. Every
 * row also keeps the call stack captured when the row was first created,
 * so the panel can answer "where does this loc actually live".
 * @type {Map<string, {checks: number, rides: number, scans: number, scanMs: number, maxScanMs: number, checkMs: number, maxCheckMs: number, stack: string}>}
 */
let checkStats = new Map();
/**
 * Row budget: pathological code bases with unbounded generated locs must
 * not turn a debug instrument into a leak. Once full, new locs go
 * unrecorded while already known locs keep updating.
 * @type {number}
 */
const maxRows = 4096;
/**
 * Millisecond clock, guarded for environments without `performance`.
 * @returns {number} Elapsed milliseconds on some arbitrary timeline.
 */
function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : 0;
}
/**
 * How many stack frames a row keeps: enough to reach the application
 * frame above the RTI internals, small enough that 4096 rows stay cheap.
 * @type {number}
 */
const stackFrames = 12;
/**
 * Fetches (or lazily creates) the row of a loc. The row's call stack is
 * captured exactly once, here, so hot locs (millions of checks) pay the
 * `new Error()` cost a single time instead of per check.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @returns {{checks: number, rides: number, scans: number, scanMs: number, maxScanMs: number, checkMs: number, maxCheckMs: number, stack: string}|undefined} The row, or undefined at the row budget.
 */
function rowFor(loc) {
  let row = checkStats.get(loc);
  if (row === undefined) {
    if (checkStats.size >= maxRows) {
      return undefined;
    }
    const stack = captureStackLines(stackFrames).join('\n');
    row = {checks: 0, rides: 0, scans: 0, scanMs: 0, maxScanMs: 0, checkMs: 0, maxCheckMs: 0, stack};
    checkStats.set(loc, row);
  }
  return row;
}
/**
 * Records one top level check of a loc. Called by `inspectType` after
 * validation finished; the measured milliseconds cover the pure
 * validation work, not message building.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {number|undefined} ms - Measured duration, undefined when timing was off.
 * @example
 * options.checkStats = true;
 * recordCheck("T#m", 1.5);
 * getCheckStats()[0]; // {loc: "T#m", checks: 1, ..., checkMs: 1.5, ...}
 */
function recordCheck(loc, ms) {
  if (!options.checkStats) {
    return;
  }
  const row = rowFor(loc);
  if (row === undefined) {
    return;
  }
  row.checks++;
  if (typeof ms === "number" && ms >= 0) {
    row.checkMs += ms;
    if (row.maxCheckMs < ms) {
      row.maxCheckMs = ms;
    }
  }
}
/**
 * Records one map window ride at a loc: the check was skipped because
 * the map rode its current rescan interval.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @example
 * options.checkStats = true;
 * recordMapRide("T#m");
 * getCheckStats()[0].rides; // 1
 */
function recordMapRide(loc) {
  if (!options.checkStats) {
    return;
  }
  const row = rowFor(loc);
  if (row === undefined) {
    return;
  }
  row.rides++;
}
/**
 * Records one full map scan at a loc together with its wall time.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {number|undefined} ms - Measured duration, undefined when timing was off.
 * @example
 * options.checkStats = true;
 * recordMapScan("T#m", 0.25);
 * getCheckStats()[0].scans; // 1
 */
function recordMapScan(loc, ms) {
  if (!options.checkStats) {
    return;
  }
  const row = rowFor(loc);
  if (row === undefined) {
    return;
  }
  row.scans++;
  if (typeof ms === "number" && ms >= 0) {
    row.scanMs += ms;
    if (row.maxScanMs < ms) {
      row.maxScanMs = ms;
    }
  }
}
/**
 * Snapshot of all rows, sorted by what a hotspot hunter cares about:
 * scan wall time first (the dominant cost of big maps), then top level
 * check time, then raw check counts, loc name last for stable output.
 * @returns {{loc: string, checks: number, rides: number, scans: number, scanMs: number, maxScanMs: number, checkMs: number, maxCheckMs: number, stack: string}[]} Sorted rows.
 * @example
 * getCheckStats(); // [{loc, checks, rides, scans, scanMs, maxScanMs, checkMs, maxCheckMs, stack}, ...]
 */
function getCheckStats() {
  const rows = [];
  for (const [loc, row] of checkStats) {
    rows.push({loc, ...row});
  }
  rows.sort((a, b) => b.scanMs - a.scanMs || b.checkMs - a.checkMs || b.checks - a.checks || (a.loc < b.loc ? -1 : 1));
  return rows;
}
/**
 * Forgets all recorded statistics, so specs and the panel's reset button
 * start from a clean slate.
 * @example
 * resetCheckStats();
 * getCheckStats(); // []
 */
function resetCheckStats() {
  checkStats = new Map();
}
export {checkStats, recordCheck, recordMapRide, recordMapScan, getCheckStats, resetCheckStats, nowMs};
