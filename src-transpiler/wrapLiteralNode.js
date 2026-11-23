import {isFreshLiteral} from './isFreshLiteral.js';
/** @typedef {import('@babel/types').Node} Node */
/**
 * Wraps a Babel object or array literal in a `markFresh(...)` call node.
 * Plain literals stay literal: only the two shapes `tsc` treats as fresh
 * literals gain the marker, so stale values pass through untouched.
 * @param {Node} node - Babel expression node.
 * @returns {Node} Wrapped call node, or the original node when not a literal.
 * @example
 * wrapLiteralNode({
 *   type: 'Identifier',
 *   name: 'o',
 * }); // the same identifier: variables stay stale
 * @example
 * wrapLiteralNode({
 *   type: 'ObjectExpression',
 *   properties: [],
 * }); // {type: 'CallExpression', callee: markFresh, arguments: [node]}
 */
function wrapLiteralNode(node) {
  if (!isFreshLiteral(node)) {
    return node;
  }
  return {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'markFresh',
    },
    arguments: [node],
  };
}
export {wrapLiteralNode};
