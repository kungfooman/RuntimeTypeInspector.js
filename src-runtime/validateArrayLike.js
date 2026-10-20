import {recurse} from "./validators.js";
import {firstBadIndex} from "./firstBadIndex.js";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value: an
 * `ArrayLike` reference node, its first argument being the element type
 * (bare `ArrayLike` without arguments checks shape only).
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateArrayLike(value, expect, loc, name, critical, warn, depth) {
  // Reference nodes only: a bare element type here means a stale direct
  // call under the old contract — fail loudly instead of validating
  // everything against a defaulted `any`.
  if (!expect || expect.type !== 'reference') {
    warn('unchecked', {value, type: 'arrayLike', loc, name, expect});
    return false;
  }
  const elementType = Array.isArray(expect.args) ? (expect.args[0] ?? 'any') : 'any';
  if (value === null || value === undefined) {
    warn(`Expected ArrayLike, got ${value}.`, {value, expect: elementType});
    return false;
  }
  const valueType = typeof value;
  if (valueType !== 'object' && valueType !== 'function' && valueType !== 'string') {
    warn('Expected ArrayLike (object with numeric length).', {value});
    return false;
  }
  const {length} = value;
  if (typeof length !== 'number' || !Number.isInteger(length) || length < 0) {
    warn('Expected ArrayLike to have an integer length >= 0.', {value});
    return false;
  }
  // Primitive fast path: skip the proven-clean prefix without per-element
  // names or recursion; the loop below still runs from the first suspect,
  // so results and warnings are identical.
  const firstBad = firstBadIndex(value, length, elementType);
  if (firstBad === -1) {
    return true;
  }
  for (let i = firstBad; i < length; i++) {
    const valueIndex = value[i];
    const nameIndex = `${name}[${i}]`;
    const ret = recurse(valueIndex, elementType, loc, nameIndex, critical, warn, depth + 1);
    if (!ret) {
      const info = {expect: elementType, value: valueIndex};
      warn(`Element at index ${i} has a wrong type.`, info);
      return false;
    }
  }
  return true;
}
export {validateArrayLike};
