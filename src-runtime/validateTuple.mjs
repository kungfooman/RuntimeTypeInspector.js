import {inspectType} from "./assertType.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateTuple(value, expect, loc, name, critical) {
  if (!value) {
    return false;
  }
  if (!(value instanceof Array)) {
    return false;
  }
  const {elements} = expect;
  return elements.every((element, i) => {
    return inspectType(
      value[i],
      element,
      loc,
      `${name}[${i}]`,
      critical
    );
  });
}
export {validateTuple};
