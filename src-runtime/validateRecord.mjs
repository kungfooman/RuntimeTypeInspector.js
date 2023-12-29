import {assertType} from "./assertType.mjs";
import {warn      } from "./warn.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateRecord(value, expect, loc, name, critical) {
  const {key, val} = expect;
  if (key !== 'string') {
    warn(`${loc}> validateType> record> unhandled key '${key}'`);
    return false;
  }
  if (typeof value !== 'object') {
    warn(`${loc}> validateType> record> expected object, not '${value}'`);
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
