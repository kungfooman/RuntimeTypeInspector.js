import {variables} from "./registerVariable.js";
/**
 * @example
 * getTypeKeys({type: 'typeof', argument: 'DataTypeMap'}, console.warn);
 * @param {*} expect - The type.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {string[]|undefined} Keys or undefined.
 */
function getTypeKeys(expect, warn) {
  if (expect?.type === 'typeof') {
    const varName = expect.argument;
    const variable = variables[varName];
    if (variable === undefined) {
      warn(`Can't find variable named '${varName}'.`);
      return;
    }
    return Object.keys(variable);
  }
}
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateKeyof(value, expect, loc, name, critical, warn) {
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
