/**
 * @example
 * trimEndSpaces('test   \n   '); // Returns: 'test   \n'
 * @param {string} str - The input string.
 * @returns {string} Output string without spaces at the end.
 */
function trimEndSpaces(str) {
  let i = str.length - 1;
  // decrement index while character is a space
  while (str[i] === ' ') {
    i--;
  }
  // return string from 0 to non-space character
  return str.slice(0, i + 1);
}
export {trimEndSpaces};
