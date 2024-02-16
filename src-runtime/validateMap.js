import {validateType} from "./validateType.js";
/**
 * @todo Implement checking all possible key/val types
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateMap(value, expect, loc, name, critical, warn, depth) {
  const {key, val} = expect;
  if (key !== 'string') {
    warn(`validateMap> unhandled key '${key}'.`);
    return false;
  }
  if (!(value instanceof Map)) {
    warn(`validateMap> value isn't an instance of Map.`);
    return false;
  }
  // if (val !== 'any') {
  //   warn(`${loc}> validateType> map> expected any, not '${value}'`);
  //   return false;
  // }
  for (const [k, v] of value) {
    const nameKey = `${name}.get('${k}')`;
    const good = validateType(v, val, loc, nameKey, critical, warn, depth + 1);
    if (!good) {
      const info = {expect: val, value: v};
      warn(`Element ${nameKey} has wrong type.`, info);
      return false;
    }
  }
  return true;
}
export {validateMap};
