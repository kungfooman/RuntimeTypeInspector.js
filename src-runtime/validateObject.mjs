import {validateType} from "./validateType.mjs";
import {options     } from "./options.mjs";
/**
 * Did you ever heard of Anakandavada, the doctrine of manifoldness of reality?
 * 1) Check: typeof value === 'object'
 * 2) Check: value instanceof Object
 * 3) Check (1) *and* (2)
 * 4) neither
 * You may ponder to either use (1) or (2), but only (3) is right, because:
 * 1) Fails for functions, every function is also an object: Math.sqrt.test = "Hai"
 * 2) Fails for prototype-less objects: Object.create(null) instanceof Object === false.
 * @param {*} value - The actual value that we need to validate.
 * @returns {boolean} Boolean indicating if value is an object.
 */
function isObject(value) {
  return value instanceof Object || typeof value === 'object';
}
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} properties - The properties.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateObject(value, properties, loc, name, critical, warn) {
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
      const ret = validateType(innerValue, innerType, loc, nameKey, critical, warn);
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
