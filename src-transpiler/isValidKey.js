/**
 * Checks whether a key renders raw in a dotted display name: plain
 * identifiers join with `.` or `#`, everything else needs brackets.
 * @example
 * isValidKey('set'); // true
 * isValidKey('a-b'); // false
 * @param {string} key - The key segment to test.
 * @returns {boolean} True for plain identifiers.
 */
function isValidKey(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(key);
}
export {isValidKey};
