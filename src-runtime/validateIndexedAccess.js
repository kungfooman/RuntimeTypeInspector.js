import {createTypeFromIndexedAccess} from "./createTypeFromIndexedAccess.js";
import {recurse} from "./validators.js";
/**
 * @typedef {object} IndexedAccess
 * @property {'indexedAccess'} type - The type.
 * @property {import('./validateType.js').Type} object - The object, for example `Obj`
 * @property {import('./validateType.js').Type} index - The index, for example `{type: 'keyof', argument: 'Obj'}`
 */
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {IndexedAccess} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateIndexedAccess(value, expect, loc, name, critical, warn, depth) {
  const created = createTypeFromIndexedAccess(expect, warn);
  if (!created) {
    warn('validateIndexedAccess: unresolvable indexed access', {expect});
    return false;
  }
  return recurse(value, created, loc, name, critical, warn, depth + 1);
}
export {validateIndexedAccess};
