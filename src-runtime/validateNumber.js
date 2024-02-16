/**
 * @todo validateNumber and validateDivision aren't validation functions like the others... streamline or change names.
 * Validates if a given property is neither NaN nor +-Infinity
 * @param {Object<string|number, number>} obj - The object to test a property of.
 * @param {string|number} prop - Name or index or property.
 * @returns {boolean} True if property is a "proper" number (neither Nan nor Infinity)
 */
function validateNumber(obj, prop) {
  const val = obj[prop];
  const type = typeof obj;
  if (val === null) {
    console.warn(`${type}#${prop} null`, {obj});
    return false;
  }
  if (val === undefined) {
    console.warn(`${type}#${prop} undefined`, {obj});
    return false;
  }
  if (isNaN(val)) {
    console.warn(`${type}#${prop} NaN`, {obj});
    return false;
  }
  if (!isFinite(val)) {
    console.warn(`${type}#${prop} +-Infinity`, {obj});
    return false;
  }
  return true;
}
export {validateNumber};
