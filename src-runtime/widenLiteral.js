/**
 * Widens a literal to its base type, mirroring TypeScript's literal widening
 * for freshly inferred candidates (`"a"` -> `string`, `1` -> `number`).
 * @param {string|number|boolean} literal - The pinned literal.
 * @returns {string} Widened base type.
 * @example
 * widenLiteral('"a"'); // 'string'
 * widenLiteral(1); // 'number'
 */
function widenLiteral(literal) {
  if (typeof literal === 'string') {
    return 'string';
  }
  if (typeof literal === 'number') {
    return 'number';
  }
  return 'boolean';
}
export {widenLiteral};
