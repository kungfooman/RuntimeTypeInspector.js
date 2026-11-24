import {parse             } from '@babel/parser';
import {parserOptions     } from './parserOptions.js';
import {wrapNestedLiterals} from './wrapNestedLiterals.js';
/**
 * Parses one call-argument expression for the wrap tests below.
 * @param {string} src - Call source holding the argument.
 * @returns {import('@babel/types').Node} The first argument node.
 */
function firstArgument(src) {
  const ast = parse(src, parserOptions);
  return ast.program.body[0].expression.arguments[0];
}
// Conditional branches wrap independently at their own level.
function testConditionalBranchesWrap() {
  const actual = wrapNestedLiterals(firstArgument('f(a ? {b: 1} : {c: 2})'));
  return actual.consequent.type === 'CallExpression' && actual.alternate.type === 'CallExpression';
}
// Logical sides wrap: fresh values flow through operators.
function testLogicalSidesWrap() {
  const actual = wrapNestedLiterals(firstArgument('f(a && {b: 1})'));
  return actual.right.type === 'CallExpression';
}
// Stale values pass through untouched, keeping their identity.
function testStalePassesThrough() {
  const argument = firstArgument('f(o)');
  return wrapNestedLiterals(argument) === argument;
}
// Nested calls re-enter the main pass instead of wrapping as values.
function testNestedCallDescends() {
  const actual = wrapNestedLiterals(firstArgument('f(g({a: 1}))'));
  return actual.type === 'CallExpression' && actual.callee.name === 'g' && actual.arguments[0].type === 'CallExpression';
}
// Arrow bodies stay stale: a body is not the caller's argument.
function testArrowStaysStale() {
  const actual = wrapNestedLiterals(firstArgument('f((x) => x)'));
  return actual.type === 'ArrowFunctionExpression';
}
// Assignment values wrap: `f(v = {a: 1})` assigns a fresh literal.
function testAssignmentRightWraps() {
  const actual = wrapNestedLiterals(firstArgument('f(v = {b: 1})'));
  return actual.type === 'AssignmentExpression' && actual.right.type === 'CallExpression';
}
// Yielded values wrap: the yielded literal is fresh at its position.
function testYieldArgumentWraps() {
  const ast = parse('function* g() { yield {b: 1}; }', parserOptions);
  const yielded = ast.program.body[0].body.body[0].expression;
  const actual = wrapNestedLiterals(yielded);
  return actual.type === 'YieldExpression' && actual.argument.type === 'CallExpression';
}
export const tests = [
  testConditionalBranchesWrap,
  testLogicalSidesWrap,
  testStalePassesThrough,
  testNestedCallDescends,
  testArrowStaysStale,
  testAssignmentRightWraps,
  testYieldArgumentWraps,
];
