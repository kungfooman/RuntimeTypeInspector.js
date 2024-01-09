import {typedefs    } from "./registerTypedef.mjs";
import {validateType} from "./validateType.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {import('./validateType.mjs').TypeObject} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateTypedef(value, expect, loc, name, critical, warn, depth) {
  if (expect.optional && value === undefined) {
    return true;
  }
  const typedef = typedefs[expect.type];
  // Prevent circular validation
  // if (typeof typedef === 'string' && typedef !== 'Function') {
  //   return false;
  // }
  return validateType(value, typedef, loc, name, critical, warn, depth + 1);
}
export {validateTypedef};
