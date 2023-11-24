import {assertType} from "./assertType.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @returns {boolean} Boolean indicating if a type is correct.
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
