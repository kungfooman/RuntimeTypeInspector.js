/**
 * Realm-safe Promise check: the `Object.prototype.toString` brand survives
 * iframe/worker/vm boundaries, where `instanceof Promise` fails because
 * each realm has its own `Promise` constructor. Duck-typing (`then` method)
 * would admit thenables, which are not promises; the brand only matches
 * genuine promises.
 * @param {*} value - The value to test.
 * @returns {boolean} True for real promises from any realm.
 * @example
 * isPromiseValue(Promise.resolve(1)); // true
 * isPromiseValue({then() {}}); // false
 */
function isPromiseValue(value) {
  try {
    return Object.prototype.toString.call(value) === '[object Promise]';
  } catch {
    return false;
  }
}
export {isPromiseValue};
