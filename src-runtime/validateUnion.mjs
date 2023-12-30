import {validateType} from "./validateType.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateUnion(value, expect, loc, name, critical, warn) {
  const ret = expect.members.some(member => validateType(
    value,
    member,
    loc,
    name + ` union type: ${member?.type || member}`,
    false,
    () => undefined
  ));
  if (!ret) {
    warn(`Given value doesn't satisfy any union member.`);
    return false;
  }
  return true;
}
export {validateUnion};
