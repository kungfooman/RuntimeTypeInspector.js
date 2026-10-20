import {options} from "../options.js";
import {nowMs} from "../checkStats.js";
/**
 * Builds the walk timer for a container validator: times the element or
 * key walk so the hotspot table can split a loc's cost by container, and
 * records it through the kind specific recorder. One boolean read when
 * stats are off, no clock calls.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} name - Name of the argument.
 * @param {function(string, string, number): void} record - Kind recorder like `recordArrayScan`.
 * @returns {function(boolean): boolean} `done` wrapper: records the walk time, returns the verdict.
 * @example
 * const done = timeWalk('T#x', 'items', recordArrayScan);
 * done(true); // true, walk time recorded when stats are on
 */
function timeWalk(loc, name, record) {
  const startedMs = options.checkStats ? nowMs() : undefined;
  return (ret) => {
    if (startedMs !== undefined) {
      record(loc, name, nowMs() - startedMs);
    }
    return ret;
  };
}
export {timeWalk};
