import {getTypeKeys} from "./getTypeKeys.js";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateKeyof(value, expect, loc, name, critical, warn, depth) {
  const {argument} = expect;
  // console.log("validateKeyof", {value, expect, argument, loc, name, critical, warn});
  const keys = getTypeKeys(argument, warn);
  if (!keys) {
    return false;
  }
  const ret = keys.includes(value);
  if (!ret) {
    warn(`Key '${value}' isn't in keys.`, {value, keys});
  }
  return ret;
}
export {getTypeKeys, validateKeyof};
