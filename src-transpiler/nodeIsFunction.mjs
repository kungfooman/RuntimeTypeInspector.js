/** @typedef {import('@babel/types').Node} Node */
/** @typedef {import('@babel/types').Function} Function */
/**
 * @param {Node} node
 * @returns {node is Function}
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
