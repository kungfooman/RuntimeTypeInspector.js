/**
 * Returns the length JavaScript assigns to an arrow function. A default or
 * rest parameter terminates the count, while destructuring counts as one.
 * @param {import('@babel/types').ArrowFunctionExpression} node - Arrow to inspect.
 * @returns {number} Number of parameters before the first default or rest.
 * @example
 * import {parse} from '@babel/parser';
 * const ast = parse('(a, b = 1) => a');
 * arrowArity(ast.program.body[0].expression); // 1
 */
function arrowArity(node) {
  let count = 0;
  for (const param of node.params) {
    if (param.type === 'AssignmentPattern' || param.type === 'RestElement') break;
    count++;
  }
  return count;
}
export {arrowArity};
