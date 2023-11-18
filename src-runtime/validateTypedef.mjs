import {typedefs    } from "./registerTypedef.mjs";
import {validateType} from "./validateType.mjs";
/**
 * @param {*} value 
 * @param {*} expect 
 * @param {*} loc 
 * @param {*} name 
 * @param {*} critical 
 * @return {boolean}
 */
function validateTypedef(value, expect, loc, name, critical) {
  if (expect.optional && value === undefined) {
    return true;
  }
  const typedef = typedefs[expect.type];
  // Prevent circular validation
  if (typeof typedef === 'string') {
    return false;
  }
  return validateType(value, typedef, loc, name, critical);
}
export {validateTypedef};
