/**
 * Realm-safe Promise check: the `Object.prototype.toString` brand survives
 * iframe/worker/vm boundaries, where `instanceof Promise` fails because
 * each realm has its own `Promise` constructor. Duck-typing (`then` method)
 * would admit thenables, which are not promises. This is a brand heuristic,
 * not a slot proof: a deliberately crafted `Symbol.toStringTag` spoofs it,
 * and no side-effect-free slot check exists from JS (`Promise.prototype.then.call`
 * perturbs unhandled-rejection tracking). Spoofing is out of scope: anyone
 * running code in the realm has already bypassed type warnings.
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
