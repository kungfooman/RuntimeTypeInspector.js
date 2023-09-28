import {assertType    } from "./assertType.mjs";
import {typecheckEvery} from "./typecheckEvery.mjs";
/**
 * @param {*} value 
 * @param {*} expect 
 * @param {*} loc 
 * @param {*} name 
 * @param {*} critical 
 * @returns {boolean}
 */
function validateArray(value, expect, loc, name, critical) {
  if (value && value instanceof Array) {
    const { elementType } = expect;
    // some that not validate -> type error
    return typecheckEvery(value, (_, i) => assertType(
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
