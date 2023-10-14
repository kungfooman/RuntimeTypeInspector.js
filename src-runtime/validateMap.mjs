import {assertType   } from "./assertType.mjs";
import {typecheckWarn} from "./typecheckWarn.mjs";
/**
 * @todo Implement checking all possible key/val types
 * @param {*} value 
 * @param {*} expect 
 * @param {*} loc 
 * @param {*} name 
 * @param {*} critical 
 * @returns {boolean}
 */
function validateMap(value, expect, loc, name, critical) {
  const { key, val } = expect;
  if (key !== 'string') {
    typecheckWarn(`${loc}> validateType> map> unhandled key '${key}'`);
    return false;
  }
  // if (val !== 'any') {
  //   typecheckWarn(`${loc}> validateType> map> expected any, not '${value}'`);
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
