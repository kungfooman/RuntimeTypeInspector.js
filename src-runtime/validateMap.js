import {recurse} from "./validators.js";
import {formatMapKey} from "./formatMapKey.js";
import {firstBadEntry} from "./firstBadEntry.js";
import {options} from "./options.js";
/**
 * Validation history per map instance: how many checks passed since the
 * last full scan, the current rescan interval (doubles while a map keeps
 * validating clean), and the size the last scan saw. Keyed by instance in
 * a WeakMap, so entries vanish with the map they describe. The module
 * level `let` keeps resetting cheap: WeakMap has no `clear`.
 * @type {WeakMap<Map, {sinceLast: number, window: number, lastSize: number}>}
 */
let mapCheckWindows = new WeakMap();
/**
 * Largest interval the doubling scheme may reach. A cap keeps the
 * detection latency for persistent drift bounded: the longest a foreign
 * mutation (including content-only edits of stored values) can stay
 * unreported is one window, so the cap is the worst-case staleness in
 * checks, not a scan cost any map keeps paying every check.
 * @type {number}
 */
const mapCheckWindowMax = 1024;
/**
 * Runs the real scan over a map and updates the instance's window
 * history with the verdict. Shared by the first check, the due check and
 * every rescan source, so all of them stay in lockstep about intervals.
 * @param {Map} value - The map to fully scan.
 * @param {{sinceLast: number, window: number, lastSize: number}} record - The instance's history record.
 * @param {*} key - The map node's `key` type (`undefined` means unchecked).
 * @param {*} val - The map node's `val` type (`undefined` means unchecked).
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument.
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Scan verdict, plus history updated in place.
 */
function scanAndSettle(value, record, key, val, loc, name, critical, warn, depth) {
  // Same pattern as the array checks: proven-clean prefixes skip the
  // full recursion entirely (`firstBadEntry` only mirrors checks it can
  // reproduce exactly), so entries before the first suspect never build
  // names, nor recurse. A `-2` means the fast path does not apply and
  // the whole map runs through the complete loop below, which is the
  // behavior this function had before the scan existed.
  const suspect = firstBadEntry(value, key, val);
  if (suspect === -1) {
    // A clean scan doubles the interval: repeated checks of an unchanged
    // map become amortized O(1), while any drift stays detectable within
    // one window.
    record.window = Math.min(record.window * 2, mapCheckWindowMax);
    record.sinceLast = 0;
    record.lastSize = value.size;
    return true;
  }
  let index = -1;
  for (const [k, v] of value) {
    index++;
    if (index < suspect) {
      continue;
    }
    const nameKey = `${name}.get(${formatMapKey(k)})`;
    if (key !== undefined) {
      const goodKey = recurse(k, key, loc, nameKey, critical, warn, depth + 1);
      if (!goodKey) {
        const info = {expect: key, value: k};
        warn(`Map key ${formatMapKey(k)} has wrong type.`, info);
        record.sinceLast = 0;
        record.lastSize = value.size;
        return false;
      }
    }
    if (val !== undefined) {
      const good = recurse(v, val, loc, nameKey, critical, warn, depth + 1);
      if (!good) {
        const info = {expect: val, value: v};
        warn(`Element ${nameKey} has wrong type.`, info);
        record.sinceLast = 0;
        record.lastSize = value.size;
        return false;
      }
    }
  }
  // The scan helper never returns true without its entry path confirming
  // clean, but the fallback above ends in `return true` naturally.
  record.window = Math.min(record.window * 2, mapCheckWindowMax);
  record.sinceLast = 0;
  record.lastSize = value.size;
  return true;
}
/**
 * New instance history: full scan due at the very first check, intervals
 * doubling from there.
 * @returns {{sinceLast: number, window: number, lastSize: number}} Fresh history record.
 */
function freshWindow() {
  return {sinceLast: 0, window: 1, lastSize: NaN};
}
/**
 * Scratch record for the 100% pedantic mode, which never reads window
 * history. `scanAndSettle` only writes on the record, so reusing a
 * module local scratch avoids a fresh allocation per check without
 * carrying state between checks (every meaningful field is rewritten).
 * @type {{sinceLast: number, window: number, lastSize: number}}
 */
const scratchRecord = freshWindow();
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateMap(value, expect, loc, name, critical, warn, depth) {
  const {key, val} = expect;
  if (!(value instanceof Map)) {
    warn(`validateMap> value isn't an instance of Map.`);
    return false;
  }
  if (!options.windowedChecks) {
    // 100% pedantic mode is the default: every check scans the entire
    // map, so no check can hide drift between checks. The window
    // history is left untouched, so later opt-ins start from the
    // first-check behavior again; the scratch record only receives
    // writes that the caller discards.
    return scanAndSettle(value, scratchRecord, key, val, loc, name, critical, warn, depth);
  }
  let record = mapCheckWindows.get(value);
  if (record === undefined) {
    record = freshWindow();
    mapCheckWindows.set(value, record);
  } else {
    // Growth or removal is the cheapest observable proxy for a foreign
    // mutation (including callers RTI cannot see): the interval restarts,
    // so the next checks scan again instead of riding an old window.
    if (value.size !== record.lastSize) {
      record.window = 1;
      record.sinceLast = 0;
    } else {
      const sinceLast = record.sinceLast + 1;
      if (sinceLast < record.window) {
        record.sinceLast = sinceLast;
        return true;
      }
    }
  }
  const clean = scanAndSettle(value, record, key, val, loc, name, critical, warn, depth);
  if (clean) {
    return true;
  }
  // A failed scan drops the interval back to the start: dirty maps are
  // rechecked aggressively, so code with a persistent bug is reported on
  // every check rather than every Nth.
  record.window = 1;
  record.sinceLast = 0;
  return false;
}
/**
 * Test and debug hook: the raw validation history of a map instance.
 * @param {Map} value - The map instance to introspect.
 * @returns {{sinceLast: number, window: number, lastSize: number}|undefined} The record when one exists.
 * @example
 * const map = new Map([[1, 2]]);
 * validateMap(map, {type: 'map', key: 'number', val: 'number'}, 'T#x', 'map', true, console.warn, 0);
 * mapCheckWindowRecord(map).window; // 2 (doubled after the first clean scan)
 */
function mapCheckWindowRecord(value) {
  return mapCheckWindows.get(value);
}
/**
 * Test and debug hook: forgets every map's validation history, so specs
 * can start from the first check behavior again.
 * @example
 * resetMapCheckWindows();
 */
function resetMapCheckWindows() {
  mapCheckWindows = new WeakMap();
}
export {validateMap, mapCheckWindowRecord, resetMapCheckWindows};
