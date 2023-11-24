import {assertType   } from "./assertType.mjs";
import {typecheckWarn} from "./typecheckWarn.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateSet(value, expect, loc, name, critical) {
  if (!(value instanceof Set)) {
    return false;
  }
  let errors = 0;
  const {elementType} = expect;
  value.forEach((x, i) => {
    const test = assertType(x, elementType, loc, name, critical);
    if (!test) {
      typecheckWarn(`validateSet> invalid set member at ${i}, expected ${elementType}, got ${typeof x}`);
      errors++;
    }
  });
  return errors === 0;
}
export {validateSet};
