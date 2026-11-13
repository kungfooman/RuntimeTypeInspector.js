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
  if (typeof key !== 'string' || key.length < 2) {
    return key;
  }
  const single = key[0] === "'" && key[key.length - 1] === "'";
  const quoted = key[0] === '"' && key[key.length - 1] === '"';
  if (single || quoted) {
    return key.slice(1, -1);
  }
  return key;
}
export {stripKey};
