import {balancedBraceInner} from './balancedBraceInner.js';
// A simple brace group reads whole with its end index.
function testSimpleGroupReadsWhole() {
  const actual = balancedBraceInner('@param {Array<X~Y>} x');
  return (
    actual !== null &&
    actual.text === 'Array<X~Y>' &&
    actual.end === 19
  );
}
// Nested braces depth-count: the outer group reads whole.
function testNestedGroupReadsWhole() {
  const actual = balancedBraceInner('@param {Object<string, {a: number}>} x');
  return actual !== null && actual.text === 'Object<string, {a: number}>';
}
// No opening brace means no group: callers keep TS-parsed text.
function testMissingOpenReturnsNull() {
  return balancedBraceInner('@param x') === null;
}
// An unclosed group never resolves: callers keep TS-parsed text.
function testUnclosedGroupReturnsNull() {
  return balancedBraceInner('@param {number') === null;
}
// The first group wins: constraint position, not later braces.
function testFirstGroupWins() {
  const actual = balancedBraceInner('@template {X~Y} [K={}]');
  return actual !== null && actual.text === 'X~Y';
}
export const tests = [
  testSimpleGroupReadsWhole,
  testNestedGroupReadsWhole,
  testMissingOpenReturnsNull,
  testUnclosedGroupReturnsNull,
  testFirstGroupWins,
];
