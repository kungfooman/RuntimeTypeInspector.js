import {validateType} from "./validateType.js";
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
function validateSet(value, expect, loc, name, critical, warn, depth) {
  if (!(value instanceof Set)) {
    warn('Given value is not a set.');
    return false;
  }
  const {elementType} = expect;
  let i = 0;
  for (const innerValue of value) {
    const test = validateType(innerValue, elementType, loc, name, critical, warn, depth + 1);
    if (!test) {
      const info = {expect: elementType, got: innerValue};
      warn(`validateSet> invalid set member at [...${name}.values()][${i}]`, info);
      return false;
    }
    i++;
  }
  return true;
}
export {validateSet};
