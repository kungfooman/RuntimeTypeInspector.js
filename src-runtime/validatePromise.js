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
function validatePromise(value, expect, loc, name, critical, warn, depth) {
  if (!(value instanceof Promise)) {
    warn('Given value is not a Promise.', {value});
    return false;
  }
  // The inner elementType can't be checked synchronously without awaiting,
  // so a Promise instance alone satisfies `Promise<T>` at call time.
  return true;
}
export {validatePromise};
