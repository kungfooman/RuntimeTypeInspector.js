import {wrapLiteralNode} from './wrapLiteralNode.js';
// Identifiers pass through untouched: variables stay stale.
function testIdentifierPassesThrough() {
  const node = {
    type: 'Identifier',
    name: 'o',
  };
  return wrapLiteralNode(node) === node;
}
// Object literals wrap in markFresh: tsc excess-checks them.
function testObjectWraps() {
  const inner = {
    type: 'ObjectExpression',
    properties: [],
  };
  const actual = wrapLiteralNode(inner);
  return actual.type === 'CallExpression' && actual.callee.name === 'markFresh' && actual.arguments[0] === inner;
}
// Array literals wrap: spread elements read as fresh too.
function testArrayWraps() {
  const inner = {
    type: 'ArrayExpression',
    elements: [],
  };
  const actual = wrapLiteralNode(inner);
  return actual.type === 'CallExpression' && actual.callee.name === 'markFresh' && actual.arguments[0] === inner;
}
// Calls pass through: results are not literals.
function testCallPassesThrough() {
  const node = {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'f',
    },
    arguments: [],
  };
  return wrapLiteralNode(node) === node;
}
export const tests = [
  testIdentifierPassesThrough,
  testObjectWraps,
  testArrayWraps,
  testCallPassesThrough,
];
