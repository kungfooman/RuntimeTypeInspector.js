import {isFreshLiteral} from './isFreshLiteral.js';
// Object literals read as fresh, so they gain the marker.
function testObjectPasses() {
  const node = {
    type: 'ObjectExpression',
    properties: [],
  };
  return isFreshLiteral(node) === true;
}
// Array literals read as fresh, so spread elements wrap too.
function testArrayPasses() {
  const node = {
    type: 'ArrayExpression',
    elements: [],
  };
  return isFreshLiteral(node) === true;
}
// Variables stay stale: the same shape in a variable passes structurally.
function testIdentifierFails() {
  const node = {
    type: 'Identifier',
    name: 'o',
  };
  return isFreshLiteral(node) === false;
}
// Calls stay stale: results are not literals.
function testCallFails() {
  const node = {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'f',
    },
    arguments: [],
  };
  return isFreshLiteral(node) === false;
}
// Missing nodes read as stale without throwing.
function testMissingFails() {
  const fromUndefined = isFreshLiteral(undefined) === false;
  return fromUndefined && isFreshLiteral(null) === false;
}
export const tests = [
  testObjectPasses,
  testArrayPasses,
  testIdentifierFails,
  testCallFails,
  testMissingFails,
];
