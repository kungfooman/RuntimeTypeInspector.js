/**
 * @typedef {{[Key in 1|2|3]: {testkey: [Key, Key, Key]}}} Test1
 */
/**
 * @param {Test1} x - First argument.
 * @returns {Test1} - Return value.
 */
function identity1(x) {
  return x;
}
identity1({
  1: {testkey: [1, 1, 1]},
  2: {testkey: [2, 2, 2]},
  3: {testkey: [3, 3, 3]},
});
