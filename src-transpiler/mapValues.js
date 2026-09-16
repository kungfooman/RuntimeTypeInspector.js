/**
 * Returns a new object with each value mapped by `fn`, leaving the original
 * untouched.  Returns `obj` as-is if it is falsy.
 * @param {Record<string, any>} obj - The source object.
 * @param {(value: any, key: string) => any} fn - Mapping function.
 * @returns {Record<string, any>} A new object with mapped values.
 */
function mapValues(obj, fn) {
  if (!obj) return obj;
  const result = {};
  for (const key in obj) {
    result[key] = fn(obj[key], key);
  }
  return result;
}
export {mapValues};
