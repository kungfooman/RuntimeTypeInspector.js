import {parse             } from '@babel/parser';
import {parserOptions     } from './parserOptions.js';
import {Stringifier       } from './Stringifier.js';
import {wrapNestedLiterals} from './wrapNestedLiterals.js';
/**
 * Wraps one argument-level expression and returns the emitted JS.
 * @param {string} src - Expression source to wrap and emit.
 * @returns {string} Emitted JS of the wrapped expression.
 */
function wrapped(src) {
  const ast = parse(`f(${src})`, parserOptions);
  const argument = ast.program.body[0].expression.arguments[0];
  return new Stringifier().toSource(wrapNestedLiterals(argument));
}
// Conditional branches wrap independently at their own level.
function testConditionalBranchesWrap() {
  const actual = wrapped('a ? {b: 1} : {c: 2}');
  const expected = 'a ? markFresh({\n  b: 1\n}) : markFresh({\n  c: 2\n})';
  return actual === expected;
}
// Logical sides wrap: fresh values flow through operators.
function testLogicalSidesWrap() {
  return wrapped('a && {b: 1}') === 'a && markFresh({\n  b: 1\n})';
}
// Stale values emit untouched, keeping their identity.
function testStalePassesThrough() {
  const ast = parse('f(o)', parserOptions);
  const argument = ast.program.body[0].expression.arguments[0];
  return wrapNestedLiterals(argument) === argument && wrapped('o') === 'o';
}
// Nested calls re-enter the main pass instead of wrapping as values.
function testNestedCallDescends() {
  return wrapped('g({a: 1})') === 'g(markFresh({\n  a: 1\n}))';
}
// Arrow bodies stay stale: a body is not the caller's argument.
function testArrowStaysStale() {
  return wrapped('(x) => x') === '(x) => x';
}
// Assignment values wrap: `f(v = {a: 1})` assigns a fresh literal.
function testAssignmentRightWraps() {
  return wrapped('v = {b: 1}') === 'v = markFresh({\n  b: 1\n})';
}
// Deeply nested literals wrap at every level, outer and inner.
function testDeepNestingWrapsEveryLevel() {
  const actual = wrapped('{a: {b: 1}}');
  const expected = 'markFresh({\n  a: markFresh({\n    b: 1\n  })\n})';
  return actual === expected;
}
// Spread sources wrap in place: the inner literal marks, the outer tolerates.
function testSpreadSourceWraps() {
  const actual = wrapped('{...{y: 2}}');
  const expected = 'markFreshSpread({\n...markFresh({\n    y: 2\n  })\n}, [])';
  return actual === expected;
}
// Mixed branches route per side: spread tolerates, plain marks fresh.
function testMixedBranchesRoutePerSide() {
  const actual = wrapped('a ? {...o} : {b: 1}');
  const expected = 'a ? markFreshSpread({\n...o\n}, []) : markFresh({\n  b: 1\n})';
  return actual === expected;
}
// Yielded values wrap: the yielded literal is fresh at its position.
function testYieldArgumentWraps() {
  const ast = parse('function* g() { yield {b: 1}; }', parserOptions);
  const yielded = ast.program.body[0].body.body[0].expression;
  const actual = new Stringifier().toSource(wrapNestedLiterals(yielded));
  return actual === 'yield markFresh({\n  b: 1\n})';
}
// Yielded through an argument: `f(yield {b: 1})` marks the literal.
function testYieldInsideArgumentWraps() {
  const ast = parse('function* g() { f(yield {b: 1}); }', parserOptions);
  const argument = ast.program.body[0].body.body[0].expression.arguments[0];
  const actual = new Stringifier().toSource(wrapNestedLiterals(argument));
  return actual === 'yield markFresh({\n  b: 1\n})';
}
// Awaited literals wrap: `f(await {b: 1})` marks the awaited value.
function testAwaitArgumentWraps() {
  return wrapped('await {b: 1}') === 'await markFresh({\n  b: 1\n})';
}
// Spread arguments wrap: `f(...{a: 1})` marks the spread value.
function testSpreadArgumentWraps() {
  return wrapped('...{a: 1}') === '...markFresh({\n  a: 1\n})';
}
export const tests = [
  testConditionalBranchesWrap,
  testLogicalSidesWrap,
  testStalePassesThrough,
  testNestedCallDescends,
  testArrowStaysStale,
  testAssignmentRightWraps,
  testDeepNestingWrapsEveryLevel,
  testSpreadSourceWraps,
  testMixedBranchesRoutePerSide,
  testYieldArgumentWraps,
  testYieldInsideArgumentWraps,
  testAwaitArgumentWraps,
  testSpreadArgumentWraps,
];
