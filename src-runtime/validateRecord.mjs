import {assertType   } from "./assertType.mjs";
import {typecheckWarn} from "./typecheckWarn.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @returns {boolean} - Boolean indicating if a type is correct.
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
