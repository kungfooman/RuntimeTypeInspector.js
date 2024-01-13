import {validateType} from "./validateType.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateIntersection(value, expect, loc, name, critical, warn, depth) {
  const {members} = expect;
  // console.log('validateIntersection', {value, expect, loc, name, critical, warn});
  for (const member of members) {
    const good = validateType(value, member, loc, name, critical, warn, depth + 1);
    if (!good) {
      warn(`Doesn't match intersection member.`, {member});
      return false;
    }
  }
  return true;
}
export {validateIntersection};
