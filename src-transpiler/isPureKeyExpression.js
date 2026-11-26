/** @typedef {import('@babel/types').Node} Node */
/**
 * Reports whether a computed key expression can be re-evaluated without
 * observable change. Only side-effect-free reads qualify: identifiers,
 * member chains over pure roots, literals, pure unaries and hole-free
 * template literals. Calls, updates, assignments, awaits, yields and
 * everything composite may run user code, so they read impure and the
 * emitter skips them instead of evaluating them twice.
 * @param {Node|null|undefined} node - Key expression to test.
 * @returns {boolean} True when re-evaluation is unobservable.
 * @example
 * isPureKeyExpression({type: 'Identifier', name: 'k'}); // true
 * @example
 * isPureKeyExpression({type: 'CallExpression', callee: {type: 'Identifier'}});
 * // false: calls may run user code
 */
function isPureKeyExpression(node) {
  if (!node || typeof node.type !== 'string') {
    return false;
  }
  if (node.type === 'Identifier' || node.type === 'ThisExpression') {
    return true;
  }
  if (node.type === 'StringLiteral' || node.type === 'NumericLiteral') {
    return true;
  }
  if (node.type === 'BooleanLiteral' || node.type === 'NullLiteral') {
    return true;
  }
  if (node.type === 'BigIntLiteral') {
    return true;
  }
  if (node.type === 'TemplateLiteral') {
    return Array.isArray(node.expressions) && node.expressions.length === 0;
  }
  if (node.type === 'UnaryExpression') {
    return isPureKeyExpression(node.argument);
  }
  if (node.type === 'MemberExpression') {
    if (!isPureKeyExpression(node.object)) {
      return false;
    }
    if (node.computed === false) {
      return true;
    }
    return isPureKeyExpression(node.property);
  }
  return false;
}
export {isPureKeyExpression};
