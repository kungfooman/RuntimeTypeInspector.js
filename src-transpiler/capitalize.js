/**
 * @example
 * capitalize("hello"); // Outputs: Hello
 * @param {string} _ 
 * @returns {string}
 */
function capitalize(_) {
  return _[0].toUpperCase() + _.slice(1);
}
export {capitalize};
