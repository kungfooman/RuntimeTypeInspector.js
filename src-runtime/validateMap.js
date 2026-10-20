import {timedScan} from "./timedScan.js";
import {freshWindow} from "./freshWindow.js";
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
 * Validates a `Map` argument by scanning every entry, every check: 100%
 * pedantic, no check can hide drift between checks. This is the default
 * `validators.validateMap` entry; the windowed rescan policy lives in
 * `windowedValidateMap.js` and installs through the writable
 * `validators` table (opt in via
 * `setOptions({windowedChecks: true})`).
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
  // Every check scans the entire map, so no check can hide drift
  // between checks. The scratch record only receives writes that the
  // caller discards, and no window history is touched.
  return timedScan(value, scratchRecord, key, val, loc, name, critical, warn, depth);
}
export {validateMap};
