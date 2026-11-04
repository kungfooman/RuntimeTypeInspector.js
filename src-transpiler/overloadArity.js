import {arrowArity} from './arrowArity.js';
import {collectOverloadBlocks} from './collectOverloadBlocks.js';
import {splitOverloadSections} from './splitOverloadSections.js';

/**
 * Counts the leading dummy parameters an overload wrapper needs.
 * @param {object} node - Arrow node carrying overload documentation.
 * @param {object[]} parents - Traversal ancestors for doc lookup.
 * @returns {number} Required parameter count, else zero.
 * @example
 * import {parse} from '@babel/parser';
 * import {parserOptions} from './parserOptions.js';
 * const ast = parse('(first, second = 1) => first', parserOptions);
 * const arrow = ast.program.body[0].expression;
 * overloadArity(arrow, [ast.program, arrow]); // 0
 */
function overloadArity(node, parents) {
  const sections = splitOverloadSections(collectOverloadBlocks(node, parents));
  if (!sections.overloads.length) return 0;
  return arrowArity(node);
}
export {overloadArity};
