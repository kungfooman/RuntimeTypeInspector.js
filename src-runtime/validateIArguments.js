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
function validateIArguments(value, expect, loc, name, critical, warn, depth) {
  // The `arguments` object (or anything with an iterator): nullish values
  // fail instead of throwing on the property read.
  if (value === null || value === undefined) {
    warn('Expected IArguments, got nullish value.', {value});
    return false;
  }
  return value[Symbol.iterator] instanceof Function;
}
export {validateIArguments};
