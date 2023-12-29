import {assertType} from "./assertType.mjs";
import {every     } from "./every.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateArray(value, expect, loc, name, critical) {
  if (value && value instanceof Array) {
    const {elementType} = expect;
    // some that not validate -> type error
    return every(value, (_, i) => assertType(
      _,
      elementType,
      loc,
      `${name}[${i}]`,
      critical
    ));
  }
  // if it's not even an array -> type error
  return false;
}
export {validateArray};
