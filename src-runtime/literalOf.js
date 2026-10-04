/**
 * Narrows a runtime value to its literal type, e.g. `camera` becomes
 * `"camera"`. Only literals narrow: objects keep the declared constraint.
 * @param {*} value - The actual value that was validated.
 * @returns {string|number|boolean|undefined} Literal type or undefined.
 * @example
 * literalOf('hi'); // '"hi"'
 * literalOf(7); // 7
 */
function literalOf(value) {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
}
export {literalOf};
