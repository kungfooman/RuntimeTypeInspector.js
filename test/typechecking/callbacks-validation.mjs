/**
 * @callback UpdateFunction
 * @param {number} dt - The time since the last update.
 * @ignore
 */
/**
 * @param {UpdateFunction} a - Test callback.
 * @returns {UpdateFunction} Same as input.
 */
function identity(a) {
  return a;
}
identity(() => undefined);
