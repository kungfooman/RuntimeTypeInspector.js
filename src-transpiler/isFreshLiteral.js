/** @typedef {import('@babel/types').Node} Node */
/** @typedef {import('@babel/types').ObjectExpression} ObjectExpression */
/** @typedef {import('@babel/types').ArrayExpression} ArrayExpression */
/**
 * Reports whether a Babel node reads as a fresh object or array literal.
 * Only these two shapes carry excess-key checking in `tsc`: variables,
 * calls, functions and member access all read as stale, so only literals
 * gain the `markFresh` marker at call sites.
 * @param {Node|null|undefined} node - Babel node to test.
 * @returns {node is ObjectExpression|ArrayExpression} True for object and array literals.
 * @example
 * isFreshLiteral({
 *   type: 'ObjectExpression',
 *   properties: [],
 * }); // true
 * @example
 * isFreshLiteral({
 *   type: 'Identifier',
 *   name: 'o',
 * }); // false
 */
function isFreshLiteral(node) {
  return node?.type === 'ObjectExpression' || node?.type === 'ArrayExpression';
}
export {isFreshLiteral};
