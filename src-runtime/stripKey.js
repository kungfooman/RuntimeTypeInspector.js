/**
 * Strips one level of quotes from a quoted literal (`'"a"'` to `a`):
 * keys arrive quoted from `keyof` and literal positions.
 * @param {*} key - The key to strip.
 * @returns {*} Unquoted key, or the input when unquoted.
 * @example
 * stripKey('"a"'); // 'a'
 * stripKey('a'); // 'a'
 */
function stripKey(key) {
  return typeof key === 'string' && key.length >= 2 && (key[0] === "'" && key[key.length - 1] === "'" || key[0] === '"' && key[key.length - 1] === '"') ? key.slice(1, -1) : key;
}
export {stripKey};
