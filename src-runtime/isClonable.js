/**
 * @param {*} value - The value that we need to validate.
 * @returns {boolean} Boolean indicating if value is clonable.
 */
function isClonable(value) {
  try {
    structuredClone(value);
    return true;
  } catch (e) {
    return false;
  }
}
export {isClonable};
