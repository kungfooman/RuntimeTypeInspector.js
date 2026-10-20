import {options} from "./options.js";
import {scanAndSettle} from "./scanAndSettle.js";
import {recordMapScan, nowMs} from "./checkStats.js";
/**
 * Runs a full scan, adds its wall time to the instance's running spend
 * (the gate decides rides from the total, even with stats off) and
 * records it in the check statistics when those are on, so panel users
 * can see which call sites actually pay for scanning.
 * @param {Map} value - The map to fully scan.
 * @param {import('./freshWindow.js').MapCheckWindow} record - The instance's history record.
 * @param {*} key - The map node's `key` type (`undefined` means unchecked).
 * @param {*} val - The map node's `val` type (`undefined` means unchecked).
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument.
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Scan verdict, stats recorded when enabled.
 * @example
 * const record = freshWindow();
 * timedScan(new Map([[1, 'a']]), record, 'number', 'string', 'T#x', 'm', true, console.warn, 0); // true
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
export {timedScan};
