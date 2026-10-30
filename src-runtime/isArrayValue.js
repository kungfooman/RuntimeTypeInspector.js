/**
 * Realm-safe array check: `Array.isArray` reads the internal Array exotic
 * brand instead of comparing against one realm's `Array` constructor, so
 * arrays cloned or shared across iframe/worker/vm boundaries still count.
 * A plain `instanceof Array` fails there and would reject genuine arrays.
 * @param {*} value - The value to test.
 * @returns {boolean} True for real arrays from any realm.
 * @example
 * isArrayValue([0, 0, 1, 1]); // true
 * isArrayValue({length: 4}); // false
 */
function isArrayValue(value) {
  return Array.isArray(value);
}
export {isArrayValue};
