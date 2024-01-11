import {validateType} from "./validateType.mjs";
import {typedefs    } from "./registerTypedef.mjs";
import {replaceType } from "./replaceType.js";
import {getTypeKeys } from "./validateKeyof.mjs";
/**
 * @typedef {object} Mapping
 * @property {import('./validateType.mjs').Type} iterable - The iterable.
 * @property {string} element - The element.
 * @property {import('./validateType.mjs').Type} result - The result.
 */
/**
 * @todo Implement checking all possible key/val types
 * @param {*} value - The actual value that we need to validate.
 * @param {Mapping} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateMapping(value, expect, loc, name, critical, warn, depth) {
  const {iterable, element, result} = expect;
  // console.log("validateMapping test", {iterable, element, result});
  const typeKeys = getTypeKeys(iterable, warn);
  if (!typeKeys) {
    warn('validateMapping: missing typeKeys');
    return false;
  }
  /** @type {Record<string, import('./validateType.mjs').Type>} */
  const properties = {};
  for (const typeKey of typeKeys) {
    const cloneResult = structuredClone(result);
    replaceType(cloneResult, element, typeKey, warn);
    properties[typeKey] = cloneResult;
  }
  const tempTypeObject = {type: 'object', properties};
  // console.log('typedefs', typedefs);
  // console.log('typeKeys', typeKeys);
  // console.log('tempTypeObject for ' + loc, tempTypeObject);
  const good = validateType(value, tempTypeObject, loc, name, critical, warn, depth + 1);
  if (!good) {
    const info = {tempTypeObject};
    warn(`validateMapping failed`, info);
    return false;
  }
  return good;
}
export {validateMapping};
