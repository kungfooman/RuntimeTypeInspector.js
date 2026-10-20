import {recurse} from "./validators.js";
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
  if (value === null || value === undefined) {
    warn(`> validateType> record> expected object, not '${value}'`);
    return false;
  }
  if (typeof value !== 'object') {
    warn(`> validateType> record> expected object, not '${value}'`);
    return false;
  }
  for (const prop of Object.keys(value)) {
    const nameKey = `${name}['${prop}']`;
    // Runtime keys are always strings: `string` (and `any`-family) keys
    // need no check, `number` needs a canonical match (`'0'` passes,
    // `'a'` fails) since `recurse` would compare string against number,
    // and everything else (unions, literals, typedefs, templates)
    // validates each key like a value.
    if (key === 'number' || typeof key === 'number') {
      const ok = typeof key === 'number' ? prop === String(key) : String(Number(prop)) === prop;
      if (!ok) {
        warn(`> validateType> record> key '${prop}' is no number.`, {expect: key, value: prop});
        return false;
      }
    } else if (key !== undefined && key !== 'any' && key !== 'unknown' && key !== '*' && key !== 'string') {
      if (!recurse(prop, key, loc, nameKey, critical, warn, depth + 1)) {
        warn(`> validateType> record> key '${prop}' has an invalid type.`, {expect: key, value: prop});
        return false;
      }
    }
    const valueKey = value[prop];
    if (val === undefined) {
      continue;
    }
    const ret = recurse(valueKey, val, loc, nameKey, critical, warn, depth + 1);
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
