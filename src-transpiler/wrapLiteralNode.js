import {isFreshLiteral} from './isFreshLiteral.js';
import {needsTolerance} from './needsTolerance.js';
import {ownWrittenKeys} from './ownWrittenKeys.js';
/** @typedef {import('@babel/types').Node} Node */
/**
 * Wraps a Babel object or array literal in a `markFresh(...)` call node.
 * Plain literals stay literal: only the two shapes `tsc` treats as fresh
 * literals gain the marker, so stale values pass through untouched.
 * Objects carrying spreads wrap with `markFreshSpread` plus their
 * statically written key names instead: `tsc` never excess-checks keys
 * arriving through `...spread`, so validators forgive every other key.
 * Impure computed keys (calls, updates and the rest) take the same path:
 * their names are not statically written, and re-reading them would run
 * user code twice, so only the pure keys count.
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
  if (node.type === 'ObjectExpression' && needsTolerance(node)) {
    return {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'markFreshSpread',
      },
      arguments: [node, ownWrittenKeys(node)],
    };
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
