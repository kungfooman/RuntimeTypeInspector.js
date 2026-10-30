/**
 * Realm-safe Map check: the `Object.prototype.toString` brand survives
 * iframe/worker/vm boundaries, where `instanceof Map` fails because each
 * realm has its own `Map` constructor. Duck-typing (`get`/`set` methods)
 * would admit impostors; the brand only matches genuine maps.
 * @param {*} value - The value to test.
 * @returns {boolean} True for real maps from any realm.
 * @example
 * isMapValue(new Map()); // true
 * isMapValue({get() {}, set() {}}); // false
 */
function isMapValue(value) {
  try {
    return Object.prototype.toString.call(value) === '[object Map]';
  } catch {
    return false;
  }
}
export {isMapValue};
