import {validateType} from "./validateType.mjs";
import {options     } from "./options.mjs";
import {isObject    } from "./isObject.js";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} properties - The properties.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateObject(value, properties, loc, name, critical, warn, depth) {
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
          if (options.logSuperfluousProperty) {
            warn(`Superfluous property: ${name}.${key}`, {properties, value});
          }
        }
      });
    }
    for (const key of Object.keys(properties)) {
      const innerValue = value[key];
      const innerType = properties[key];
      const nameKey = `${name}.${key}`;
      const ret = validateType(innerValue, innerType, loc, nameKey, critical, warn, depth + 1);
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
