/**
 * Validates `bigint`, including `123n` literals via `expect.literal`.
 * Userland-overridable through the `validators` table, like `validateNumber`.
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} True if value is a matching bigint.
 */
function validateBigint(value, expect, loc, name, critical, warn, depth) {
  if (expect && typeof expect === 'object' && expect.literal !== undefined) {
    try {
      const ret = value === BigInt(expect.literal);
      if (!ret) {
        warn(`Expected literal ${expect.literal}.`, {value, expect});
      }
      return ret;
    } catch {
      warn(`Expected bigint.`, {value, expect});
      return false;
    }
  }
  const ret = typeof value === 'bigint';
  if (!ret) {
    warn(`Expected bigint.`, {value, expect});
  }
  return ret;
}
export {validateBigint};
