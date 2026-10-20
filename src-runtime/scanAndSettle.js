import {recurse} from "./validators.js";
import {formatMapKey} from "./formatMapKey.js";
import {firstBadEntry} from "./firstBadEntry.js";
import {windowCap} from "./windowCap.js";
/**
 * Runs the real scan over a map and updates the instance's window
 * history with the verdict. Shared by the first check, the due check and
 * every rescan source, so all of them stay in lockstep about intervals.
 * @param {Map} value - The map to fully scan.
 * @param {import('./freshWindow.js').MapCheckWindow} record - The instance's history record.
 * @param {*} key - The map node's `key` type (`undefined` means unchecked).
 * @param {*} val - The map node's `val` type (`undefined` means unchecked).
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument.
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Scan verdict, plus history updated in place.
 * @example
 * const record = freshWindow();
 * scanAndSettle(new Map([[1, 'a']]), record, 'number', 'string', 'T#x', 'm', true, console.warn, 0); // true
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
export {scanAndSettle};
