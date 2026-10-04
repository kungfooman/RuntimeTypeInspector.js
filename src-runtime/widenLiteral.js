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
  return typeof literal === 'string' ? 'string' : typeof literal === 'number' ? 'number' : 'boolean';
}
export {widenLiteral};
