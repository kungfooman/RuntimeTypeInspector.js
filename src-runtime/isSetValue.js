/**
 * Realm-safe Set check: the `Object.prototype.toString` brand survives
 * iframe/worker/vm boundaries, where `instanceof Set` fails because each
 * realm has its own `Set` constructor. Duck-typing (`add`/`has` methods)
 * would admit impostors; the brand only matches genuine sets.
 * @param {*} value - The value to test.
 * @returns {boolean} True for real sets from any realm.
 * @example
 * isSetValue(new Set()); // true
 * isSetValue({add() {}, has() {}}); // false
 */
function isSetValue(value) {
  try {
    return Object.prototype.toString.call(value) === '[object Set]';
  } catch {
    return false;
  }
}
export {isSetValue};
