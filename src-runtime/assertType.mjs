import { typecheckOptions } from "./typecheckOptions.mjs";
import { typecheckWarn } from "./typecheckWarn.mjs";
import { validateType } from "./validateType.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @returns {boolean} - Boolean indicating if a type is correct.
 */
export function assertType(value, expect, loc, name, critical = true) {
  if (!expect) {
    typecheckWarn("assertType> 'expect' always should be set");
    return false;
  }
  const ret = validateType(value, expect, loc, name, critical);
  if (!ret && critical) {
    typecheckOptions.count++;
    let expectStr = ', expected: ' + JSON.stringify(expect);
    if (expectStr.length >= 40) {
      expectStr = ', expected: ';
    }
    expectStr = '';
    const msg = `${loc}> type of '${name}' is invalid${expectStr}`;
    typecheckWarn(msg, { expect, value });
  }
  return ret;
}
