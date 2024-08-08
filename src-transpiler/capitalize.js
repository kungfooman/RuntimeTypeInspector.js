/**
 * @example
 * capitalize("hello"); // Outputs: Hello
 * @param {string} _ - The input string.
 * @returns {string} The capitalized output string.
 */
function capitalize(_) {
  return _[0].toUpperCase() + _.slice(1);
}
export {capitalize};
