import {assertType   } from "./assertType.mjs";
import {typecheckWarn} from "./typecheckWarn.mjs";
/**
 * @param {*} value 
 * @param {*} expect 
 * @param {*} loc 
 * @param {*} name 
 * @param {*} critical 
 * @return {boolean}
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
