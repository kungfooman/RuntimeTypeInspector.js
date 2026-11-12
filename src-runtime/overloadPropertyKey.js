/**
 * Converts a computed property key exactly once, using the same coercion as
 * an object literal. The resulting string or symbol can be reused safely.
 * @param {*} value - Computed property key value.
 * @returns {string|symbol} The resulting property key.
 * @example
 * overloadPropertyKey(123); // '123'
 */
function overloadPropertyKey(value) {
  const property = {
    [value]: true,
  };
  return Reflect.ownKeys(property)[0];
}
export {overloadPropertyKey};
