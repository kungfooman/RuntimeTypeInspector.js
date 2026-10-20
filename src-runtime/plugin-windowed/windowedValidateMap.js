import {freshWindow} from "./freshWindow.js";
import {minTotalMs} from "./minTotalMs.js";
import {windowCap} from "./windowCap.js";
import {scanMapEntries} from "./scanMapEntries.js";
import {recordMapRide, recordMapScan, nowMs} from "../checkStats.js";
import {options} from "../options.js";
/**
 * Validation history per map instance, keyed by instance in a WeakMap,
 * so entries vanish with the map they describe. The module level `let`
 * keeps resetting cheap: WeakMap has no `clear`.
 * @type {WeakMap<Map, import('./freshWindow.js').MapCheckWindow>}
 */
let mapCheckWindows = new WeakMap();
/**
 * Drop-in windowed replacement for `validateMap`, installed through the
 * writable `validators` table (see `setOptions({windowedChecks: true})`
 * or direct assignment). Repeated checks of the same unchanged map ride
 * doubling rescan windows instead of scanning every time: the first
 * check scans everything, further checks ride the current interval, the
 * interval doubles on every clean full scan and restarts on size changes
 * and failing scans. Rides additionally require the map to have
 * accumulated `mapCheckWindowMinTotalMs` of scan time since its content
 * last changed, so maps nobody ever spent real time scanning keep
 * validating every check. Same contract as every validator, so wrapping
 * or replacing this with a custom policy needs no adapter.
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 * @example
 * import {validators} from "../validators.js";
 * validators.validateMap = windowedValidateMap; // opt in to rescan windows
 */
function windowedValidateMap(value, expect, loc, name, critical, warn, depth) {
  const {key, val} = expect;
  if (!(value instanceof Map)) {
    warn(`validateMap> value isn't an instance of Map.`);
    return false;
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
  // The plugin owns the window and the spend: a clean scan doubles
  // the interval (amortized O(1) for unchanged maps), measures its wall
  // time into the running total (the gate reads the total, even with
  // stats off), and records the walk for the hotspot table when stats
  // are on. A failed scan drops the interval back to the start, so
  // dirty maps are rechecked aggressively.
  const startedMs = options.checkStats || options.windowedChecks ? nowMs() : undefined;
  const clean = scanMapEntries(value, key, val, loc, name, critical, warn, depth);
  if (startedMs !== undefined) {
    const spentMs = nowMs() - startedMs;
    record.spentMs += spentMs;
    recordMapScan(loc, name, spentMs);
  }
  if (clean) {
    record.window = Math.min(record.window * 2, windowCap());
    record.sinceLast = 0;
    record.lastSize = value.size;
    return true;
  }
  record.window = 1;
  record.sinceLast = 0;
  record.lastSize = value.size;
  return false;
}
/**
 * Test and debug hook: the raw validation history of a map instance.
 * @param {Map} value - The map instance to introspect.
 * @returns {import('./freshWindow.js').MapCheckWindow|undefined} The record when one exists.
 * @example
 * const map = new Map([[1, 2]]);
 * windowedValidateMap(map, {type: 'map', key: 'number', val: 'number'}, 'T#x', 'map', true, console.warn, 0);
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
export {windowedValidateMap, mapCheckWindowRecord, resetMapCheckWindows};
