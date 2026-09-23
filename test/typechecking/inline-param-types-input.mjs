function add(/** @type {number} */ a, /** @type {number} */ b) {
  return a + b;
}
/**
 * @param {string} a - Keeps JSDoc, inline ignored.
 */
function keep(a, /** @type {number} */ b = 1) {
  return [a, b];
}
