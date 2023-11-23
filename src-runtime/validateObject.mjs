import {assertType      } from "./assertType.mjs";
import {typecheckOptions} from "./typecheckOptions.mjs";
import {typecheckWarn   } from "./typecheckWarn.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} properties - The properties.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @returns {boolean} - Boolean indicating if a type is correct.
 */
function validateObject(value, properties, loc, name, critical) {
  if (!(value instanceof Object)) {
    return false;
  }
  if (properties && Object.keys(properties).length) {
    if (loc !== 'sortPriority' && loc !== 'getResource' && loc !== 'cmpPriority') {
      Object.keys(value).forEach((key) => {
        if (key === 'profilerHint') {
          return;
        }
        if (!properties[key]) {
          if (typecheckOptions.logSuperfluousProperty) {
            typecheckWarn(`${loc}> superfluous property> ${name}.${key}`, {properties, value});
          }
        }
      });
    }
    return Object.keys(properties).every((key) => {
      const innerValue = value[key];
      const innerType = properties[key];
      return assertType(
        innerValue,
        innerType,
        loc,
        `${name}.${key}`,
        critical
      );
    });
  }
  return value instanceof Object;
}
export {validateObject};
