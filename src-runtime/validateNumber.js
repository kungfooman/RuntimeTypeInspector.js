/**
 * Validates that a value is a proper number: actual `number` type (no
 * coercion, so boxed `new Number()` is rejected) and neither NaN nor
 * +-Infinity. Uses `Number.isNaN`/`Number.isFinite` instead of the global
 * `isNaN`/`isFinite` to avoid false positives like `isNaN("1") === false`.
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} True if value is a proper number.
 */
function validateNumber(value, expect, loc, name, critical, warn, depth) {
  if (typeof value !== 'number') {
    warn(`Expected number, got ${value === null ? 'null' : typeof value}.`, {value});
    return false;
  }
  if (Number.isNaN(value)) {
    warn('Expected number, got NaN.', {value});
    return false;
  }
  if (!Number.isFinite(value)) {
    warn('Expected finite number, got +-Infinity.', {value});
    return false;
  }
  return true;
}
export {validateNumber};
