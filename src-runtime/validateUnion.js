import {validateType} from "./validateType.js";
/**
 * @typedef {object} Union
 * @property {'union'} type - The type.
 * @property {any[]} members - The members.
 */
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {Union} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateUnion(value, expect, loc, name, critical, warn, depth) {
  const ret = expect.members.some(member => validateType(
    value,
    member,
    loc,
    name + ` union type: ${member?.type || member}`,
    false,
    () => undefined,
    depth + 1
  ));
  if (!ret) {
    warn(`Given value doesn't satisfy any union member.`);
    return false;
  }
  return true;
}
export {validateUnion};
