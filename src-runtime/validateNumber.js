/**
 * Validates that a value is a proper number: actual `number` type (no
 * coercion, so boxed `new Number()` is rejected) and neither NaN nor
 * +-Infinity. Uses `Number.isNaN`/`Number.isFinite` instead of the global
 * `isNaN`/`isFinite` to avoid false positives like `isNaN("1") === false`.
 * For the old `validateNumber(obj, prop)` shape use `validateNumberInObject`.
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
/**
 * Legacy obj/prop-style wrapper: validates `obj[prop]` as a proper number
 * and keeps the `type#prop` warning keys the old `validateNumber(obj, prop)`
 * generated. Delegates the actual check to `validateNumber`.
 * @param {Object<string|number, *>} obj - The object holding the property.
 * @param {string|number} prop - Name or index of property.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {boolean} True if `obj[prop]` is a proper number.
 */
function validateNumberInObject(obj, prop, warn = console.warn) {
  const value = obj?.[prop];
  const key = `${obj === null ? 'null' : typeof obj}#${String(prop)}`;
  const details = [];
  const collect = (...args) => details.push(...args);
  const ret = validateNumber(value, 'number', key, String(prop), true, collect, 0);
  if (!ret) {
    warn(key, {obj, prop, value}, ...details);
  }
  return ret;
}
export {validateNumber, validateNumberInObject};
