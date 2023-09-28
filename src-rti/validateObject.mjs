import {assertType      } from "./assertType.mjs";
import {typecheckOptions} from "./typecheckOptions.mjs";
import {typecheckWarn   } from "./typecheckWarn.mjs";
/**
 * @param {*} value 
 * @param {*} properties 
 * @param {*} loc 
 * @param {*} name 
 * @param {*} critical 
 * @returns {boolean}
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
            typecheckWarn(`${loc}> superfluous property> ${name}.${key}`, { properties, value });
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
