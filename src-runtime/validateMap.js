import {recurse} from "./validators.js";
import {formatMapKey} from "./formatMapKey.js";
import {firstBadEntry} from "./firstBadEntry.js";
import {options} from "./options.js";
import {recordMapRide, recordMapScan, nowMs} from "./checkStats.js";
/**
 * Validation history per map instance: how many checks passed since the
 * last full scan, the current rescan interval (doubles while a map keeps
 * validating clean), the size the last scan saw, and the scan wall time
 * accumulated since the content last changed (feeds the spend gate
 * below). Keyed by instance in a WeakMap, so entries vanish with the map
 * they describe. The module level `let` keeps resetting cheap: WeakMap
 * has no `clear`.
 * @type {WeakMap<Map, {sinceLast: number, window: number, lastSize: number, spentMs: number}>}
 */
let mapCheckWindows = new WeakMap();
/**
 * Fetches the live window cap, floored to a sane positive integer so a
 * panel input or misconfigured `setOptions` cannot stall the doubling
 * scheme with zero or negative caps.
 * @returns {number} Smallest usable cap, at least 1.
 */
function windowCap() {
  return Math.max(1, Math.floor(options.mapCheckWindowCap));
}
/**
 * Fetches the live scan spend budget (see
 * `options.mapCheckWindowMinTotalMs`), where an unusable value (NaN or
 * negative, possible only through direct `options` writes since the
 * panel and worker guards reject both) degrades to `0`, no budget. The
 * budget is an optimization knob, not a safety latch, so garbage must
 * keep windowing working instead of silently turning it back into 100%
 * pedantic scanning.
 * @returns {number} Accumulated scan milliseconds that unlock rides, 0 when unset or unusable.
 */
function minTotalMs() {
  const v = options.mapCheckWindowMinTotalMs;
  return Number.isFinite(v) && v > 0 ? v : 0;
}
/**
 * Runs the real scan over a map and updates the instance's window
 * history with the verdict. Shared by the first check, the due check and
 * every rescan source, so all of them stay in lockstep about intervals.
 * @param {Map} value - The map to fully scan.
 * @param {{sinceLast: number, window: number, lastSize: number, spentMs: number}} record - The instance's history record.
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
    record.window = Math.min(record.window * 2, windowCap());
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
  record.window = Math.min(record.window * 2, windowCap());
  record.sinceLast = 0;
  record.lastSize = value.size;
  return true;
}
/**
 * Runs a full scan, adds its wall time to the instance's running spend
 * (the gate decides rides from the total, even with stats off) and
 * records it in the check statistics when those are on, so panel users
 * can see which call sites actually pay for scanning.
 * @param {Map} value - The map to fully scan.
 * @param {{sinceLast: number, window: number, lastSize: number, spentMs: number}} record - The instance's history record.
 * @param {*} key - The map node's `key` type (`undefined` means unchecked).
 * @param {*} val - The map node's `val` type (`undefined` means unchecked).
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument.
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Scan verdict, stats recorded when enabled.
 */
function timedScan(value, record, key, val, loc, name, critical, warn, depth) {
  // Windowed mode always measures: the ride gate below accumulates
  // every scan's spend. Pedantic mode only measures for the stats, so
  // the default with stats off stays a single boolean read and no clock
  // calls. `recordMapScan` itself turns into a no-op with stats off.
  const measuring = options.checkStats || options.windowedChecks;
  const startedMs = measuring ? nowMs() : undefined;
  const clean = scanAndSettle(value, record, key, val, loc, name, critical, warn, depth);
  if (startedMs !== undefined) {
    const spentMs = nowMs() - startedMs;
    record.spentMs += spentMs;
    recordMapScan(loc, name, spentMs);
  }
  return clean;
}
/**
 * New instance history: full scan due at the very first check, intervals
 * doubling from there, no scan spend accumulated yet.
 * @returns {{sinceLast: number, window: number, lastSize: number, spentMs: number}} Fresh history record.
 */
function freshWindow() {
  // Sizes are non negative integers, so -1 is the unset sentinel: it can
  // never match a real map size, forcing the size based restart into its
  // conservative "changed" branch whenever a record is read before its
  // first scan wrote a real size. Spend starts at 0, so fresh maps are
  // locked out of rides until they have paid real scan time.
  return {sinceLast: 0, window: 1, lastSize: -1, spentMs: 0};
}
/**
 * Scratch record for the 100% pedantic mode, which never reads window
 * history nor scan spend. `scanAndSettle` only writes on the record, so
 * reusing a module local scratch avoids a fresh allocation per check
 * without carrying state between checks (every field it reads is
 * rewritten or discarded).
 * @type {{sinceLast: number, window: number, lastSize: number, spentMs: number}}
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
    return timedScan(value, scratchRecord, key, val, loc, name, critical, warn, depth);
  }
  let record = mapCheckWindows.get(value);
  if (record === undefined) {
    record = freshWindow();
    mapCheckWindows.set(value, record);
  } else {
    // Growth or removal is the cheapest observable proxy for a foreign
    // mutation (including callers RTI cannot see): the interval restarts
    // and the spend is reset, so the next checks scan again instead of
    // riding an old window, and rides only resume after the new content
    // has earned its own budget.
    if (value.size !== record.lastSize) {
      record.window = 1;
      record.sinceLast = 0;
      record.spentMs = 0;
    } else {
      const sinceLast = record.sinceLast + 1;
      // The spend gate: a check may only skip once this map's scans have
      // accumulated real time. Cheap scans keep validating (the saved
      // time is worth less than the lost check) until their total earns
      // rides, while a map that already cost real time amortizes from
      // then on. A clockless environment accumulates 0, which cannot
      // clear any positive budget: the conservative direction.
      if (sinceLast < record.window && record.spentMs >= minTotalMs()) {
        record.sinceLast = sinceLast;
        recordMapRide(loc, name);
        return true;
      }
    }
  }
  const clean = timedScan(value, record, key, val, loc, name, critical, warn, depth);
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
 * @returns {{sinceLast: number, window: number, lastSize: number, spentMs: number}|undefined} The record when one exists.
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
