import {evaluateCondition} from "./evaluateCondition.js";
import {recurse} from "./validators.js";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {object} expect - Conditional type with check/extends/true/false.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateCondition(value, expect, loc, name, critical, warn, depth) {
  const {checkType, extendsType, trueType, falseType} = expect;
  const decision = evaluateCondition(checkType, extendsType, warn);
  if (decision === true) {
    return recurse(value, trueType, loc, name, critical, warn, depth + 1);
  }
  if (decision === false) {
    return recurse(value, falseType, loc, name, critical, warn, depth + 1);
  }
  warn('validateCondition: undecidable condition, failing closed.', {expect});
  return false;
}
export {validateCondition};
