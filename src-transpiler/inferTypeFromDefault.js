/**
 * Infers a parameter type from its default value AST node.
 * Returns widened types like TypeScript does (`= 0` means `number`, not
 * literal `0`; `= null` widens to `any`).
 * Returns `undefined` when nothing useful can be inferred — the caller then
 * emits no check, exactly like an undocumented parameter today.
 * Shapes match what `expandType` produces so they can be embedded as-is.
 * @param {import('@babel/types').Node} node - The default value AST node.
 * @returns {string | object | undefined} Inferred type or `undefined` to skip.
 */
function inferTypeFromDefault(node) {
  if (!node) {
    return;
  }
  switch (node.type) {
    case 'NumericLiteral':
      return 'number';
    case 'StringLiteral':
      return 'string';
    case 'BooleanLiteral':
      return 'boolean';
    case 'BigIntLiteral':
      return {type: 'bigint'};
    case 'RegExpLiteral':
      return 'RegExp';
    case 'TemplateLiteral':
      return 'string';
    case 'ArrayExpression':
      return {type: 'array', elementType: 'any'};
    case 'ObjectExpression':
      return {type: 'object', properties: {}};
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      return 'Function';
    case 'NewExpression': {
      const {callee} = node;
      if (callee.type === 'Identifier') {
        return callee.name;
      }
      break;
    }
    case 'UnaryExpression': {
      const {operator, argument} = node;
      if (operator === '!' ) {
        return 'boolean';
      }
      if (operator === 'void' || operator === 'typeof') {
        return operator === 'void' ? 'undefined' : 'string';
      }
      if ((operator === '-' || operator === '+') && argument.type === 'NumericLiteral') {
        return 'number';
      }
      if ((operator === '-' || operator === '+') && argument.type === 'BigIntLiteral') {
        return {type: 'bigint'};
      }
      break;
    }
    default:
      // NullLiteral, identifiers, calls, member access, conditionals etc.:
      // nothing precise to infer, skip instead of emitting an `any` no-op.
      break;
  }
}
export {inferTypeFromDefault};
