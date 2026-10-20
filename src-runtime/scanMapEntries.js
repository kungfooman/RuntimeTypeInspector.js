import {recurse} from "./validators.js";
import {formatMapKey} from "./formatMapKey.js";
import {firstBadEntry} from "./firstBadEntry.js";
/**
 * Scans every entry of a map and reports the verdict, writing nothing:
 * no window history, no spend, no stats. Policy (doubling, gating,
 * recording) belongs to the caller. The fast path skips proven-clean
 * prefixes without per-entry names or recursion.
 * @param {Map} value - The map to fully scan.
 * @param {*} key - The map node's `key` type (`undefined` means unchecked).
 * @param {*} val - The map node's `val` type (`undefined` means unchecked).
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument.
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Scan verdict, true when every entry checks out.
 * @example
 * scanMapEntries(new Map([[1, 'a']]), 'number', 'string', 'T#x', 'm', true, console.warn, 0); // true
 */
function scanMapEntries(value, key, val, loc, name, critical, warn, depth) {
  // Same pattern as the array checks: proven-clean prefixes skip the
  // full recursion entirely (`firstBadEntry` only mirrors checks it can
  // reproduce exactly), so entries before the first suspect never build
  // names, nor recurse. A `-2` means the fast path does not apply and
  // the whole map runs through the complete loop below.
  const suspect = firstBadEntry(value, key, val);
  if (suspect === -1) {
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
        return false;
      }
    }
    if (val !== undefined) {
      const good = recurse(v, val, loc, nameKey, critical, warn, depth + 1);
      if (!good) {
        const info = {expect: val, value: v};
        warn(`Element ${nameKey} has wrong type.`, info);
        return false;
      }
    }
  }
  return true;
}
export {scanMapEntries};
