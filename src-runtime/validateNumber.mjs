import {typecheckWarn} from "./typecheckWarn.mjs";
/**
 * Validates if a given property is neither NaN nor +-Infinity
 * @param {Object<string|number, number>} obj - The object to test a property of.
 * @param {string|number} prop - Name or index or property.
 * @returns {boolean} True if property is a "proper" number (neither Nan nor Infinity)
 */
function validateNumber(obj, prop) {
  const val = obj[prop];
  const type = typeof obj;
  if (val === null) {
    typecheckWarn(`${type}#${prop} null`, {obj});
    return false;
  }
  if (val === undefined) {
    typecheckWarn(`${type}#${prop} undefined`, {obj});
    return false;
  }
  if (isNaN(val)) {
    typecheckWarn(`${type}#${prop} NaN`, {obj});
    return false;
  }
  if (!isFinite(val)) {
    typecheckWarn(`${type}#${prop} +-Infinity`, {obj});
    return false;
  }
  return true;
}
export {validateNumber};
