import {validateType} from "./validateType.mjs";
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
function validateRecord(value, expect, loc, name, critical, warn, depth) {
  const {key, val} = expect;
  if (key !== 'string') {
    warn(`> validateType> record> unhandled key '${key}'`);
    return false;
  }
  if (typeof value !== 'object') {
    warn(`> validateType> record> expected object, not '${value}'`);
    return false;
  }
  for (const key of Object.keys(value)) {
    const valueKey = value[key];
    const nameKey = `${name}['${key}']`;
    const ret = validateType(valueKey, val, loc, nameKey, critical, warn, depth + 1);
    if (!ret) {
      const info = {
        expect: val,
        value: valueKey
      };
      warn(`> validateType> record> The ${nameKey} property has an invalid type.`, info);
      return false;
    }
  }
  return true;
}
export {validateRecord};
