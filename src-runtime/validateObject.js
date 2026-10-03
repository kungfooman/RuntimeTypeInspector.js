import {recurse} from "./validators.js";
import {options     } from "./options.js";
import {isObject    } from "./isObject.js";
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
function validateObject(value, expect, loc, name, critical, warn, depth) {
  // Object nodes only: a bare properties bag means a stale direct call
  // under the old contract — fail loudly instead of misreading it.
  if (!expect || expect.type !== 'object') {
    warn('unchecked', {value, type: 'object', loc, name, expect});
    return false;
  }
  const properties = expect.properties;
  if (properties === undefined && !expect.indexSignatures) {
    // Bare `{}`/`object`: accepts every non-nullish value, like TS
    // (`1 extends {}`). Nullish values fall into the guard below for
    // its diagnostic instead of passing silently.
    if (value !== null && value !== undefined) {
      return true;
    }
  }
  if (!isObject(value)) {
    warn('Given value is not an object.');
    return false;
  }
  if (properties && Object.keys(properties).length) {
    if (loc !== 'sortPriority' && loc !== 'getResource' && loc !== 'cmpPriority') {
      Object.keys(value).forEach((key) => {
        if (key === 'profilerHint') {
          return;
        }
        if (!properties[key]) {
          if (options.exactObjects) {
            warn(`Excess property '${name}.${key}' is not allowed (exact object check).`, {properties, value});
          } else if (options.logSuperfluousProperty) {
            warn(`Superfluous property: ${name}.${key}`, {properties, value});
          }
        }
      });
      if (options.exactObjects && Object.keys(value).some((key) => key !== 'profilerHint' && !properties[key])) {
        return false;
      }
    }
    for (const key of Object.keys(properties)) {
      const innerValue = value[key];
      const innerType = properties[key];
      const nameKey = `${name}.${key}`;
      const ret = recurse(innerValue, innerType, loc, nameKey, critical, warn, depth + 1);
      if (!ret) {
        const info = {expect: innerType, value: innerValue};
        warn(`Element ${nameKey} has wrong type.`, info);
        return false;
      }
    }
  }
  return true;
}
export {validateObject};
