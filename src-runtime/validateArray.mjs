import {validateType} from "./validateType.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateArray(value, expect, loc, name, critical, warn) {
  if (!(value instanceof Array)) {
    warn('Given `value` isn\'t an array.');
    return false;
  }
  const {elementType} = expect;
  const n = value.length;
  // some that not validate -> type error
  // todo unit test for arrays with holes
  for (let i = 0; i < n; i++) {
    const valueIndex = value[i];
    const nameIndex = `${name}[${i}]`;
    const ret = validateType(valueIndex, elementType, loc, nameIndex, critical, warn);
    if (!ret) {
      const info = {expect: elementType, value: valueIndex};
      warn(`Element at index ${i} has a wrong type.`, info);
      return false;
    }
  }
  return true;
}
export {validateArray};
