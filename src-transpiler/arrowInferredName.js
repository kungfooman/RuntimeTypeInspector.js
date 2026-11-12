/**
 * Finds the name JavaScript infers for a directly assigned arrow. A dynamic
 * property key cannot be read without evaluating it again, so it is unknown.
 * @param {import('@babel/types').ArrowFunctionExpression} node - Arrow to inspect.
 * @param {import('@babel/types').Node} parent - Its immediate parent.
 * @returns {string|null} Inferred name, empty for anonymous, or null if dynamic.
 * @example
 * import {parse} from '@babel/parser';
 * const ast = parse('const greet = (x) => x');
 * const declaration = ast.program.body[0].declarations[0];
 * arrowInferredName(declaration.init, declaration); // 'greet'
 */
function arrowInferredName(node, parent) {
  if (
    parent.type === 'VariableDeclarator' &&
    parent.init === node &&
    parent.id.type === 'Identifier'
  ) {
    return parent.id.name;
  }
  if (
    parent.type === 'AssignmentPattern' &&
    parent.right === node &&
    parent.left.type === 'Identifier'
  ) {
    return parent.left.name;
  }
  if (
    parent.type === 'AssignmentExpression' &&
    parent.right === node &&
    parent.left.type === 'Identifier'
  ) {
    return parent.left.name;
  }
  if (parent.type === 'ExportDefaultDeclaration' && parent.declaration === node) {
    return 'default';
  }
  if (parent.type === 'ClassPrivateProperty' && parent.value === node) {
    return `#${parent.key.id.name}`;
  }
  if (
    (
      parent.type === 'ObjectProperty' ||
      parent.type === 'ClassProperty'
    ) &&
    parent.value === node
  ) {
    const {key} = parent;
    if (!parent.computed && key.type === 'Identifier') {
      return key.name;
    }
    if (key.type === 'StringLiteral' || key.type === 'NumericLiteral') {
      return String(key.value);
    }
    return null;
  }
  return '';
}
export {arrowInferredName};
