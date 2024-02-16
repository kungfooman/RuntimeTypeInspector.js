import {validateType} from "./validateType.js";
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
function validateTuple(value, expect, loc, name, critical, warn, depth) {
  if (!(value instanceof Array)) {
    warn('Given value for tuple must be an array.');
    return false;
  }
  const {elements} = expect;
  if (value.length !== elements.length) {
    warn('Value and tuple elements have different lengths.');
    return false;
  }
  // const innerWarn = warnAccumulator(10); // max 10 warnings
  const ret = elements.every((element, i) => {
    return validateType(
      value[i],
      element,
      loc,
      `${name}[${i}]`,
      critical,
      warn,
      depth + 1
    );
  });
  if (!ret) {
    warn('Tuple validation failed.');
    return false;
  }
  return true;
}
export {validateTuple};
