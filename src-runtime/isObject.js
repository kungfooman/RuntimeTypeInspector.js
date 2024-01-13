/**
 * Did you ever heard of Anakandavada, the doctrine of manifoldness of reality?
 * 1) Check: typeof value === 'object'
 * 2) Check: value instanceof Object
 * 3) Check (1) *and* (2)
 * 4) neither
 * You may ponder to either use (1) or (2), but only (3) is right, because:
 * 1) Fails for functions, every function is also an object: Math.sqrt.test = "Hai"
 * 2) Fails for prototype-less objects: Object.create(null) instanceof Object === false.
 * @param {*} value - The actual value that we need to validate.
 * @returns {boolean} Boolean indicating if value is an object.
 */
function isObject(value) {
  return value instanceof Object || typeof value === 'object';
}
export {isObject};
