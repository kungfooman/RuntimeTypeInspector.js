/** @typedef {import('@babel/types').Node} Node */
/** @typedef {import('@babel/types').Function} Function */
/**
 * Checks if the provided node is a function-like structure.
 *
 * @param {Node} node - The Babel AST node to be tested.
 * @returns {node is Function} - `true` if the node is a function-like structure, otherwise `false`.
 */
function nodeIsFunction(node) {
  switch (node.type) {
    case 'ArrowFunctionExpression':
    case 'ClassMethod':
    case 'ClassPrivateMethod':
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ObjectMethod':
      return true;
  }
  return false;
}
export {nodeIsFunction};
