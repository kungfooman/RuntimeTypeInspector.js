import {assertType} from "./assertType.mjs";
/**
 * @param {*} value 
 * @param {*} expect 
 * @param {*} loc 
 * @param {*} name 
 * @param {*} critical 
 * @returns {boolean}
 */
function validateUnion(value, expect, loc, name, critical) {
  return expect.members.some(member => assertType(
    value,
    member,
    loc,
    name + ` union type: ${member?.type || member}`,
    false
  ));
}
export {validateUnion};
