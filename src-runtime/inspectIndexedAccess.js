import {crossContextPostMessage} from './crossContextPostMessage.js';
import {breakpoints            } from './inspectType.js';
import {options                } from './options.js';
/**
 * Reports an invalid array-index access to the RTI UI.
 * @param {*} value - The accessed object.
 * @param {*} index - The index.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} msg - The warning message.
 * @param {object} details - Object with some local details for quick devtools checking.
 */
function addIndexedAccessWarning(value, index, loc, msg, details) {
  options.count++;
  const name = 'indexedAccess';
  const key = `${loc}-${name}`;
  if (breakpoints.has(key)) {
    // console.log("breakpoints", breakpoints);
    debugger;
    breakpoints.delete(key); // trigger only once to quickly get app running again
    crossContextPostMessage({type: 'rti', action: 'deleteBreakpoint', destination: 'ui', key});
  }
  const strings = [msg];
  crossContextPostMessage({
    type: 'rti',
    action: 'addError',
    destination: 'ui',
    value, index, loc, name, strings, key,
    details,
  });
}
/**
 * Pass-through wrapper for `value[index]` that validates array indexing.
 *
 * Only actual sequences (arrays, typed arrays and strings) with numeric
 * indices are bounds/integer-checked, everything else (e.g. `obj[key]`)
 * is passed through untouched.
 * @param {*} value - The accessed object.
 * @param {*} index - The index.
 * @param {string} [loc] - The location of the access, defaults to `unspecified`.
 * @example
 * inspectIndexedAccess([1, 2, 3], 1);   // Outputs: 2
 * inspectIndexedAccess([1, 2, 3], 42);  // Warns: out of bounds
 * inspectIndexedAccess({a: 1}, 'a');    // Outputs: 1, without any checks
 * @returns {*} The element `value[index]`.
 */
function inspectIndexedAccess(value, index, loc = 'unspecified') {
  if (!options.enabled) {
    return value?.[index];
  }
  if (value == null) {
    addIndexedAccessWarning(value, index, loc, 'inspectIndexedAccess> accessing index on nullish value', {value, index});
    return undefined;
  }
  const isSequence = Array.isArray(value) ||
    ArrayBuffer.isView(value) ||
    typeof value === 'string';
  if (isSequence && typeof index === 'number') {
    const {length} = value;
    if (!Number.isInteger(index)) {
      addIndexedAccessWarning(value, index, loc, 'inspectIndexedAccess> index isn\'t an integer', {index, length});
    } else if (index < 0 || index >= length) {
      addIndexedAccessWarning(value, index, loc, 'inspectIndexedAccess> index out of bounds', {index, length});
    }
  }
  return value[index];
}
export {inspectIndexedAccess};
