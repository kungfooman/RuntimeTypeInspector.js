/**
 * Validates `null`: passes only when value is exactly null.
 * Userland-overridable through the `validators` table, like `validateNumber`.
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} True if value is null.
 */
function validateNull(value, expect, loc, name, critical, warn, depth) {
  const ret = value === null;
  if (!ret) {
    warn(`Expected null.`, {value, expect});
  }
  return ret;
}
export {validateNull};
