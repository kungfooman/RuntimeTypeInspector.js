import {assertType} from "./assertType.mjs";
import {warn      } from "./warn.mjs";
/**
 * @todo Implement checking all possible key/val types
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateMap(value, expect, loc, name, critical) {
  const {key, val} = expect;
  if (key !== 'string') {
    warn(`${loc}> validateType> map> unhandled key '${key}'`);
    return false;
  }
  // if (val !== 'any') {
  //   warn(`${loc}> validateType> map> expected any, not '${value}'`);
  //   return false;
  // }
  let ret = true;
  for (const [k, v] of value) {
    const good = assertType(
      v,
      val,
      loc,
      `${name}.get('${key}')`,
      critical
    );
    if (!good) {
      ret = false;
    }
  }
  return ret;
}
export {validateMap};
