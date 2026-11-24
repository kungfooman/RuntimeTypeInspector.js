import {parse          } from '@babel/parser';
import {parserOptions  } from './parserOptions.js';
import {Stringifier    } from './Stringifier.js';
import {wrapLiteralNode} from './wrapLiteralNode.js';
/**
 * Parses one expression and wraps it, returning the emitted JS.
 * @param {string} src - Expression source to wrap and emit.
 * @returns {string} Emitted JS of the wrapped node.
 */
function wrapped(src) {
  const ast = parse(`f(${src})`, parserOptions);
  const node = ast.program.body[0].expression.arguments[0];
  return new Stringifier().toSource(wrapLiteralNode(node));
}
// Plain object literals emit a bare markFresh call, no key list.
function testPlainObjectEmitsMarkFresh() {
  const actual = wrapped('{a: 1}');
  const expected = 'markFresh({\n  a: 1\n})';
  return actual === expected;
}
// Identifiers emit unchanged: variables stay stale.
function testIdentifierEmitsUnchanged() {
  return wrapped('o') === 'o';
}
// Calls emit unchanged: results are not literals.
function testCallEmitsUnchanged() {
  return wrapped('g(1)') === 'g(1)';
}
// Spread-carrying objects emit markFreshSpread with written keys only.
function testSpreadObjectEmitsKeys() {
  const actual = wrapped('{a: 1, ...o}');
  const expected = 'markFreshSpread({\n  a: 1,\n...o\n}, ["a"])';
  return actual === expected;
}
// Bare spreads emit an empty key list: nothing was written literally.
function testBareSpreadEmitsEmptyKeys() {
  const actual = wrapped('{...o}');
  const expected = 'markFreshSpread({\n...o\n}, [])';
  return actual === expected;
}
// Array literals emit a bare markFresh call wrapping every element.
function testArrayEmitsMarkFresh() {
  const actual = wrapped('[{a: 1}, o]');
  const expected = 'markFresh([{\n  a: 1\n}, o])';
  return actual === expected;
}
// Impure computed keys route to tolerance with no written names.
function testImpureComputedEmitsEmptyKeys() {
  const actual = wrapped('{[f()]: 1}');
  const expected = 'markFreshSpread({\n  [f()]: 1\n}, [])';
  return actual === expected;
}
// Pure computed identifiers ride along as evaluated key expressions.
function testPureComputedKeyEmitsExpression() {
  const actual = wrapped('{[k]: 1, ...o}');
  const expected = 'markFreshSpread({\n  [k]: 1,\n...o\n}, [k])';
  return actual === expected;
}
// String and numeric keys spell with double quotes in the key list.
function testStringAndNumericKeysEmitQuoted() {
  const first = wrapped('{"a": 1, ...o}');
  const second = wrapped('{0: 1, ...o}');
  return first === 'markFreshSpread({\n  "a": 1,\n...o\n}, ["a"])' && second === 'markFreshSpread({\n  0: 1,\n...o\n}, ["0"])';
}
// Object methods contribute their name to the written keys.
function testObjectMethodEmitsName() {
  const actual = wrapped('{a() {}, ...o}');
  const expected = 'markFreshSpread({\n  a() {},\n...o\n}, ["a"])';
  return actual === expected;
}
export const tests = [
  testPlainObjectEmitsMarkFresh,
  testIdentifierEmitsUnchanged,
  testCallEmitsUnchanged,
  testSpreadObjectEmitsKeys,
  testBareSpreadEmitsEmptyKeys,
  testArrayEmitsMarkFresh,
  testImpureComputedEmitsEmptyKeys,
  testPureComputedKeyEmitsExpression,
  testStringAndNumericKeysEmitQuoted,
  testObjectMethodEmitsName,
];
