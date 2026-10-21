import {options} from "./options.js";
import {captureStackLines} from "./captureStack.js";
/**
 * One hotspot row: per-parameter counters (keyed by loc plus argument
 * name) for checks, map window rides, container walks of every kind,
 * their wall times and maxima, the fold buffer the enclosing check
 * attributes, and the call stack captured at row creation.
 * @typedef {object} CheckStatsRow
 * @property {number} checks - Top level checks of this parameter.
 * @property {number} rides - Window rides (map checks skipped).
 * @property {number} skips - Host-suppressed checks (ignoredChecks).
 * @property {number} scans - Full map scans.
 * @property {number} scanMs - Total map scan time.
 * @property {number} maxScanMs - Slowest single map scan.
 * @property {number} setMs - Total Set walk time.
 * @property {number} maxSetMs - Slowest single Set walk.
 * @property {number} setWalks - Set walks.
 * @property {number} arrayMs - Total Array walk time.
 * @property {number} maxArrayMs - Slowest single Array walk.
 * @property {number} arrayWalks - Array walks.
 * @property {number} objectMs - Total object key walk time.
 * @property {number} maxObjectMs - Slowest single object key walk.
 * @property {number} objectWalks - Object key walks.
 * @property {number} checkMs - Total check time, walks folded in.
 * @property {number} maxCheckMs - Slowest single check.
 * @property {number} pendingScanMs - Walk time awaiting fold into the next check.
 * @property {string} stack - Call stack captured at row creation.
 */
/**
 * Hotspot statistics per validation call site and parameter (loc plus
 * argument name). Each row counts how often one parameter was checked,
 * how many map window rides and full container walks happened on its
 * behalf, and the wall time walks and top level checks took. The panel
 * sorts rows by scan cost, so tuning targets (like the
 * `mapCheckWindowCap`) come from measurements instead of guesses. Every
 * row also keeps the call stack captured when the row was first created,
 * so the panel can answer "where does this loc actually live".
 * @type {Map<string, CheckStatsRow>}
 */
let checkStats = new Map();
/**
 * Row budget: pathological code bases with unbounded generated locs must
 * not turn a debug instrument into a leak. Once full, new rows go
 * unrecorded while already known rows keep updating.
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
 * Fetches (or lazily creates) the row of one parameter: the key is the
 * loc plus the argument name, so each parameter of a call site gets its
 * own row instead of all parameters dissolving into one. The row's call
 * stack is captured exactly once, here, so hot rows (millions of checks)
 * pay the `new Error()` cost a single time instead of per check.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} name - Argument name, like `defines`.
 * @returns {CheckStatsRow|undefined} The row, or undefined at the row budget.
 */
function rowFor(loc, name) {
  const key = `${loc} ${name}`;
  let row = checkStats.get(key);
  if (row === undefined) {
    if (checkStats.size >= maxRows) {
      return undefined;
    }
    const stack = captureStackLines(stackFrames).join('\n');
    row = {
      checks: 0,
      rides: 0,
      skips: 0,
      scans: 0,
      scanMs: 0,
      maxScanMs: 0,
      setMs: 0,
      maxSetMs: 0,
      setWalks: 0,
      arrayMs: 0,
      maxArrayMs: 0,
      arrayWalks: 0,
      objectMs: 0,
      maxObjectMs: 0,
      objectWalks: 0,
      checkMs: 0,
      maxCheckMs: 0,
      pendingScanMs: 0,
      stack,
    };
    checkStats.set(key, row);
  }
  return row;
}
/**
 * Records one top level check of one parameter. Called by `inspectType`
 * after validation finished; the measured milliseconds cover the pure
 * validation work, not message building. Walks this check triggered
 * deeper inside (nested containers) were recorded on the same row under
 * the same loc plus name, so the check cost takes the larger of the two
 * readings: under a coarse clock every fast check measures 0 while its
 * walks still accumulate real time, and reporting "108339 checks, 0us"
 * hides the very hotspot the table exists to show. Under a fine clock
 * the measured time already contains the walks, so it wins and nothing
 * is counted twice.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} name - Argument name, like `defines`.
 * @param {number|undefined} ms - Measured duration, undefined when timing was off.
 * @example
 * options.checkStats = true;
 * recordCheck("T#m", "v", 1.5);
 * getCheckStats()[0]; // {loc: "T#m v", checks: 1, ..., checkMs: 1.5, ...}
 */
function recordCheck(loc, name, ms) {
  if (!options.checkStats) {
    return;
  }
  const row = rowFor(loc, name);
  if (row === undefined) {
    return;
  }
  row.checks++;
  // Nested walk time already sits in this row's ledgers: the check's own
  // clock wrapped those walks, so the true check cost is at least the
  // walks. Take the best available reading of that one quantity.
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
 * Records one map window ride for one parameter: the check was skipped
 * because the map rode its current rescan interval.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} name - Argument name, like `defines`.
 * @example
 * options.checkStats = true;
 * recordMapRide("T#m", "v");
 * getCheckStats()[0].rides; // 1
 */
function recordMapRide(loc, name) {
  if (!options.checkStats) {
    return;
  }
  const row = rowFor(loc, name);
  if (row === undefined) {
    return;
  }
  row.rides++;
}
/**
 * Records one host-suppressed check for one parameter: `inspectType`
 * skipped validation because the loc sits in `ignoredChecks`. Creating
 * the row captures its call stack once (same as every recorder), which
 * is bounded by the row budget; the per-check snapshotting the
 * suppression avoids never runs, so suppressed checks stay cheap.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} name - Argument name, like `defines`.
 * @example
 * options.checkStats = true;
 * recordSkip("T#m", "v");
 * getCheckStats()[0].skips; // 1
 */
function recordSkip(loc, name) {
  if (!options.checkStats) {
    return;
  }
  const row = rowFor(loc, name);
  if (row === undefined) {
    return;
  }
  row.skips++;
}
/**
 * Records one full map scan for one parameter together with its wall
 * time. The time also lands in the row's fold buffer: the enclosing top
 * level check picks it up in `recordCheck`, so scan-heavy rows never
 * report checks that cost nothing.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} name - Argument name, like `defines`.
 * @param {number|undefined} ms - Measured duration, undefined when timing was off.
 * @example
 * options.checkStats = true;
 * recordMapScan("T#m", "v", 0.25);
 * getCheckStats()[0].scans; // 1
 */
function recordMapScan(loc, name, ms) {
  if (!options.checkStats) {
    return;
  }
  const row = rowFor(loc, name);
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
 * Records one full `Set` walk for one parameter together with its wall
 * time. The time also lands in the row's fold buffer: the enclosing top
 * level check picks it up in `recordCheck`, so set-heavy rows never
 * report checks that cost nothing.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} name - Argument name, like `defines`.
 * @param {number|undefined} ms - Measured duration, undefined when timing was off.
 * @example
 * options.checkStats = true;
 * recordSetScan("T#m", "v", 0.25);
 * getCheckStats()[0].setMs; // 0.25
 */
function recordSetScan(loc, name, ms) {
  if (!options.checkStats) {
    return;
  }
  const row = rowFor(loc, name);
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
 * Records one full `Array` (or array-like) walk for one parameter
 * together with its wall time. Same fold contract as `recordSetScan`:
 * the enclosing check attributes the time.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} name - Argument name, like `defines`.
 * @param {number|undefined} ms - Measured duration, undefined when timing was off.
 * @example
 * options.checkStats = true;
 * recordArrayScan("T#m", "v", 0.25);
 * getCheckStats()[0].arrayMs; // 0.25
 */
function recordArrayScan(loc, name, ms) {
  if (!options.checkStats) {
    return;
  }
  const row = rowFor(loc, name);
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
 * Records one plain object key walk for one parameter together with its
 * wall time. Same fold contract as `recordSetScan`: the enclosing check
 * attributes the time.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} name - Argument name, like `defines`.
 * @param {number|undefined} ms - Measured duration, undefined when timing was off.
 * @example
 * options.checkStats = true;
 * recordObjectScan("T#m", "v", 0.25);
 * getCheckStats()[0].objectMs; // 0.25
 */
function recordObjectScan(loc, name, ms) {
  if (!options.checkStats) {
    return;
  }
  const row = rowFor(loc, name);
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
 * container walk wall time first (the dominant cost of big containers),
 * then top level check time, then raw check counts, row key last for
 * stable output.
 * @returns {{loc: string, ...CheckStatsRow}[]} Sorted rows.
 * @example
 * getCheckStats(); // [{loc, ...CheckStatsRow}, ...]
 */
function getCheckStats() {
  const rows = [];
  for (const [loc, row] of checkStats) {
    rows.push({loc, ...row});
  }
  const walkMs = (row) => row.scanMs + row.setMs + row.arrayMs + row.objectMs;
  rows.sort((a, b) => walkMs(b) - walkMs(a) || b.checkMs - a.checkMs || b.checks - a.checks ||
    (a.loc < b.loc ? -1 : 1));
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
export {
  checkStats,
  recordCheck,
  recordMapRide,
  recordSkip,
  recordMapScan,
  recordSetScan,
  recordArrayScan,
  recordObjectScan,
  getCheckStats,
  resetCheckStats,
  nowMs,
};
