import {markFreshCallArgs} from './markFreshCallArgs.js';
import {wrapLiteralNode  } from './wrapLiteralNode.js';
/** @typedef {import('@babel/types').Node} Node */
/**
 * Wraps literals nested inside one call-argument expression, mutating in
 * place and returning the same node. Conditional branches, logical sides,
 * sequence entries, spreads, awaits, unary operands, parens and template
 * holes each carry their own literal, so each wraps at its own level.
 * Nested call arguments re-enter the main pass; nested functions stay
 * stale (an arrow body is not the outer caller's argument).
 * @param {Node} node - Babel expression node.
 * @returns {Node} The same node, with literals wrapped.
 * @example
 * import {parse} from '@babel/parser';
 * const test = parse('f(a ? {b: 1} : o)').program.body[0].expression.arguments[0];
 * wrapNestedLiterals(test).consequent.type; // 'CallExpression'
 * @example
 * import {parse} from '@babel/parser';
 * const idle = parse('f(o)').program.body[0].expression.arguments[0];
 * wrapNestedLiterals(idle) === idle; // true: stale values pass through
 */
function wrapNestedLiterals(node) {
  if (node?.type === 'ObjectExpression') {
    for (const property of node.properties) {
      if (property?.type === 'ObjectProperty') {
        property.value = wrapNestedLiterals(property.value);
      } else if (property?.type === 'SpreadElement') {
        property.argument = wrapNestedLiterals(property.argument);
      }
    }
    return wrapLiteralNode(node);
  }
  if (node?.type === 'ArrayExpression') {
    for (let index = 0; index < node.elements.length; index++) {
      if (node.elements[index] !== null) {
        node.elements[index] = wrapNestedLiterals(node.elements[index]);
      }
    }
    return wrapLiteralNode(node);
  }
  if (node?.type === 'ConditionalExpression') {
    node.consequent = wrapNestedLiterals(node.consequent);
    node.alternate = wrapNestedLiterals(node.alternate);
    return node;
  }
  if (node?.type === 'LogicalExpression') {
    node.left = wrapNestedLiterals(node.left);
    node.right = wrapNestedLiterals(node.right);
    return node;
  }
  if (node?.type === 'SequenceExpression') {
    node.expressions = node.expressions.map((entry) => wrapNestedLiterals(entry));
    return node;
  }
  if (node?.type === 'SpreadElement') {
    node.argument = wrapNestedLiterals(node.argument);
    return node;
  }
  if (node?.type === 'AwaitExpression' || node?.type === 'UnaryExpression' || node?.type === 'UpdateExpression' || node?.type === 'YieldExpression') {
    node.argument = wrapNestedLiterals(node.argument);
    return node;
  }
  if (node?.type === 'AssignmentExpression') {
    // `f(v = {a: 1})` assigns a fresh literal: tsc excess-checks it.
    node.right = wrapNestedLiterals(node.right);
    return node;
  }
  if (node?.type === 'ParenthesizedExpression') {
    node.expression = wrapNestedLiterals(node.expression);
    return node;
  }
  if (node?.type === 'CallExpression' || node?.type === 'OptionalCallExpression' || node?.type === 'NewExpression') {
    markFreshCallArgs(node);
    return node;
  }
  if (node?.type === 'TaggedTemplateExpression') {
    node.quasi = wrapNestedLiterals(node.quasi);
    return node;
  }
  if (node?.type === 'TemplateLiteral') {
    for (let index = 0; index < node.expressions.length; index++) {
      node.expressions[index] = wrapNestedLiterals(node.expressions[index]);
    }
    return node;
  }
  return node;
}
export {wrapNestedLiterals};
