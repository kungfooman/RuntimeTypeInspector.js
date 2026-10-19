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
 * @type {Map<string, {checks: number, rides: number, scans: number, scanMs: number, maxScanMs: number, setMs: number, maxSetMs: number, setWalks: number, arrayMs: number, maxArrayMs: number, arrayWalks: number, objectMs: number, maxObjectMs: number, objectWalks: number, checkMs: number, maxCheckMs: number, pendingScanMs: number, stack: string}>}
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
 * @returns {{checks: number, rides: number, scans: number, scanMs: number, maxScanMs: number, setMs: number, maxSetMs: number, setWalks: number, arrayMs: number, maxArrayMs: number, arrayWalks: number, objectMs: number, maxObjectMs: number, objectWalks: number, checkMs: number, maxCheckMs: number, pendingScanMs: number, stack: string}|undefined} The row, or undefined at the row budget.
 */
function rowFor(loc) {
  let row = checkStats.get(loc);
  if (row === undefined) {
    if (checkStats.size >= maxRows) {
      return undefined;
    }
    const stack = captureStackLines(stackFrames).join('\n');
    row = {checks: 0, rides: 0, scans: 0, scanMs: 0, maxScanMs: 0, setMs: 0, maxSetMs: 0, setWalks: 0, arrayMs: 0, maxArrayMs: 0, arrayWalks: 0, objectMs: 0, maxObjectMs: 0, objectWalks: 0, checkMs: 0, maxCheckMs: 0, pendingScanMs: 0, stack};
    checkStats.set(loc, row);
  }
  return row;
}
/**
 * Records one top level check of a loc. Called by `inspectType` after
 * validation finished; the measured milliseconds cover the pure
 * validation work, not message building. Scans this check triggered
 * deeper inside (nested maps) were recorded on the same row under the
 * same loc, so the check cost takes the larger of the two readings:
 * under a coarse clock every fast check measures 0 while its scans
 * still accumulate real time, and reporting "108339 checks, 0us" hides
 * the very hotspot the table exists to show. Under a fine clock the
 * measured time already contains the scans, so it wins and nothing is
 * counted twice.
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
  // Nested scan time already sits in this row's scan ledger: the check's
  // own clock wrapped those scans, so the true check cost is at least
  // the scans. Take the best available reading of that one quantity.
  const nested = row.pendingScanMs;
  row.pendingScanMs = 0;
  const own = typeof ms === "number" && ms >= 0 ? ms : 0;
  const cost = Math.max(own, nested);
  row.checkMs += cost;
  if (row.maxCheckMs < cost) {
    row.maxCheckMs = cost;
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
 * Records one full map scan at a loc together with its wall time. The
 * time also lands in the row's fold buffer: the enclosing top level
 * check picks it up in `recordCheck`, so scan-heavy locs never report
 * checks that cost nothing.
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
    row.pendingScanMs += ms;
    if (row.maxScanMs < ms) {
      row.maxScanMs = ms;
    }
  }
}
/**
 * Records one full `Set` walk at a loc together with its wall time. The
 * time also lands in the row's fold buffer: the enclosing top level
 * check picks it up in `recordCheck`, so set-heavy locs never report
 * checks that cost nothing.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {number|undefined} ms - Measured duration, undefined when timing was off.
 * @example
 * options.checkStats = true;
 * recordSetScan("T#m", 0.25);
 * getCheckStats()[0].setMs; // 0.25
 */
function recordSetScan(loc, ms) {
  if (!options.checkStats) {
    return;
  }
  const row = rowFor(loc);
  if (row === undefined) {
    return;
  }
  row.setWalks++;
  if (typeof ms === "number" && ms >= 0) {
    row.setMs += ms;
    row.pendingScanMs += ms;
    if (row.maxSetMs < ms) {
      row.maxSetMs = ms;
    }
  }
}
/**
 * Records one full `Array` (or array-like) walk at a loc together with
 * its wall time. Same fold contract as `recordSetScan`: the enclosing
 * check attributes the time.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {number|undefined} ms - Measured duration, undefined when timing was off.
 * @example
 * options.checkStats = true;
 * recordArrayScan("T#m", 0.25);
 * getCheckStats()[0].arrayMs; // 0.25
 */
function recordArrayScan(loc, ms) {
  if (!options.checkStats) {
    return;
  }
  const row = rowFor(loc);
  if (row === undefined) {
    return;
  }
  row.arrayWalks++;
  if (typeof ms === "number" && ms >= 0) {
    row.arrayMs += ms;
    row.pendingScanMs += ms;
    if (row.maxArrayMs < ms) {
      row.maxArrayMs = ms;
    }
  }
}
/**
 * Records one plain object key walk at a loc together with its wall
 * time. Same fold contract as `recordSetScan`: the enclosing check
 * attributes the time.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {number|undefined} ms - Measured duration, undefined when timing was off.
 * @example
 * options.checkStats = true;
 * recordObjectScan("T#m", 0.25);
 * getCheckStats()[0].objectMs; // 0.25
 */
function recordObjectScan(loc, ms) {
  if (!options.checkStats) {
    return;
  }
  const row = rowFor(loc);
  if (row === undefined) {
    return;
  }
  row.objectWalks++;
  if (typeof ms === "number" && ms >= 0) {
    row.objectMs += ms;
    row.pendingScanMs += ms;
    if (row.maxObjectMs < ms) {
      row.maxObjectMs = ms;
    }
  }
}
/**
 * Snapshot of all rows, sorted by what a hotspot hunter cares about:
 * scan wall time first (the dominant cost of big maps), then top level
 * check time, then raw check counts, loc name last for stable output.
 * @returns {{loc: string, checks: number, rides: number, scans: number, scanMs: number, maxScanMs: number, setMs: number, maxSetMs: number, setWalks: number, arrayMs: number, maxArrayMs: number, arrayWalks: number, objectMs: number, maxObjectMs: number, objectWalks: number, checkMs: number, maxCheckMs: number, pendingScanMs: number, stack: string}[]} Sorted rows.
 * @example
 * getCheckStats(); // [{loc, checks, rides, scans, scanMs, maxScanMs, setMs, ..., checkMs, maxCheckMs, pendingScanMs, stack}, ...]
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
export {checkStats, recordCheck, recordMapRide, recordMapScan, recordSetScan, recordArrayScan, recordObjectScan, getCheckStats, resetCheckStats, nowMs};
