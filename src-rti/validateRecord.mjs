import {assertType   } from "./assertType.mjs";
import {typecheckWarn} from "./typecheckWarn.mjs";
/**
 * @param {*} value 
 * @param {*} expect 
 * @param {*} loc 
 * @param {*} name 
 * @param {*} critical 
 * @returns {boolean}
 */
function validateRecord(value, expect, loc, name, critical) {
  const {key, val} = expect;
  if (key !== 'string') {
    typecheckWarn(`${loc}> validateType> record> unhandled key '${key}'`);
    return false;
  }
  if (typeof value !== 'object') {
    typecheckWarn(`${loc}> validateType> record> expected object, not '${value}'`);
    return false;
  }
  return Object.keys(value).every(
    key => assertType(
      value[key],
      val,
      loc,
      `${name}['${key}']`,
      critical
    )
  );
}
export {validateRecord};
