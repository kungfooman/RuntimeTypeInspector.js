import {resolveTemplateLiteralValues} from "./resolveTemplateLiteralValues.js";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {object} expect - The supposed type information of said value.
 * @param {string[]} expect.quasis - The literal chunks.
 * @param {import('./validateType.js').Type[]} expect.types - The interpolated types.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateTemplateLiteral(value, expect, loc, name, critical, warn, depth) {
  const values = resolveTemplateLiteralValues(expect, warn);
  if (!values) {
    warn(`Given value '${value}' couldn't be checked against template literal type.`, {loc, name, expect});
    return false;
  }
  if (values.includes(value)) {
    return true;
  }
  warn(`Given value '${value}' doesn't satisfy template literal type.`, {loc, name, expect, values});
  return false;
}
export {validateTemplateLiteral};
