/** @typedef {import('@babel/types').Node} Node */
/**
 * Reads the callee name when a call node names one directly.
 * A member call resolves to its property name; computed or exotic
 * callees have no name and read as user calls that still wrap.
 * @param {Node|null|undefined} node - Babel call node.
 * @returns {string|undefined} Callee name or undefined.
 * @example
 * calleeNameOf({
 *   type: 'CallExpression',
 *   callee: {
 *     type: 'Identifier',
 *     name: 'f',
 *   },
 * }); // 'f'
 * @example
 * calleeNameOf({
 *   type: 'CallExpression',
 *   callee: {
 *     type: 'NumericLiteral',
 *     value: 1,
 *   },
 * }); // undefined: exotic callees read as user calls
 */
function calleeNameOf(node) {
  const callee = node?.callee;
  if (callee?.type === 'Identifier') {
    return callee.name;
  }
  if (callee?.type === 'MemberExpression' && callee.computed === false && callee.property?.type === 'Identifier') {
    return callee.property.name;
  }
  return undefined;
}
export {calleeNameOf};
