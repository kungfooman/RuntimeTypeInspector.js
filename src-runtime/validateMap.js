import {options} from "./options.js";
import {recordMapRide} from "./checkStats.js";
import {freshWindow} from "./freshWindow.js";
import {minTotalMs} from "./minTotalMs.js";
import {timedScan} from "./timedScan.js";
/**
 * Validation history per map instance, keyed by instance in a WeakMap,
 * so entries vanish with the map they describe. The module level `let`
 * keeps resetting cheap: WeakMap has no `clear`.
 * @type {WeakMap<Map, import('./freshWindow.js').MapCheckWindow>}
 */
let mapCheckWindows = new WeakMap();
/**
 * Scratch record for the 100% pedantic mode, which never reads window
 * history nor scan spend. `scanAndSettle` only writes on the record, so
 * reusing a module local scratch avoids a fresh allocation per check
 * without carrying state between checks (every field it reads is
 * rewritten or discarded).
 * @type {import('./freshWindow.js').MapCheckWindow}
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
 * @returns {import('./freshWindow.js').MapCheckWindow|undefined} The record when one exists.
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
