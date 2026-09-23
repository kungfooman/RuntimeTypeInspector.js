import {recurse} from "./validators.js";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} elementType - The element type each indexed entry must satisfy.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateArrayLike(value, elementType, loc, name, critical, warn, depth) {
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
  for (let i = 0; i < length; i++) {
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
