import {recurse} from "./validators.js";
import {firstBadIndex} from "./firstBadIndex.js";
import {options} from "./options.js";
import {recordArrayScan, nowMs} from "./checkStats.js";
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
function validateArray(value, expect, loc, name, critical, warn, depth) {
  if (!(value instanceof Array)) {
    warn('Given `value` isn\'t an array.');
    return false;
  }
  const {elementType} = expect;
  const n = value.length;
  // some that not validate -> type error
  // todo unit test for arrays with holes
  // Primitive fast path: skip the proven-clean prefix without per-element
  // names or recursion; the loop below still runs from the first suspect,
  // so results and warnings are identical.
  const firstBad = firstBadIndex(value, n, elementType);
  if (firstBad === -1) {
    return true;
  }
  // Stats only: time the element walk so the hotspot table can split a
  // loc's cost by container. One boolean read when off, no clock calls.
  const startedMs = options.checkStats ? nowMs() : undefined;
  const done = (ret) => {
    if (startedMs !== undefined) {
      recordArrayScan(loc, name, nowMs() - startedMs);
    }
    return ret;
  };
  for (let i = firstBad; i < n; i++) {
    const valueIndex = value[i];
    const nameIndex = `${name}[${i}]`;
    const ret = recurse(valueIndex, elementType, loc, nameIndex, critical, warn, depth + 1);
    if (!ret) {
      const info = {expect: elementType, value: valueIndex};
      warn(`Element at index ${i} has a wrong type.`, info);
      return done(false);
    }
  }
  return done(true);
}
export {validateArray};
