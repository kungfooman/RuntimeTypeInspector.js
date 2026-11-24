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
// Spread-carrying objects wrap with their written keys: tsc forgives
// spread keys, so only literally written names can fail downstream.
function testSpreadObjectWrapsWithKeys() {
  const inner = {
    type: 'ObjectExpression',
    properties: [
      {
        type: 'ObjectProperty',
        key: {
          type: 'Identifier',
          name: 'a',
        },
        computed: false,
      },
      {
        type: 'SpreadElement',
        argument: {
          type: 'Identifier',
          name: 'o',
        },
      },
    ],
  };
  const actual = wrapLiteralNode(inner);
  const keys = actual.arguments[1];
  const spelled = keys.elements.length === 1 && keys.elements[0].value === 'a' && keys.elements[0].extra?.raw === '"a"';
  return actual.type === 'CallExpression' && actual.callee.name === 'markFreshSpread' && actual.arguments[0] === inner && keys.type === 'ArrayExpression' && spelled;
}
export const tests = [
  testIdentifierPassesThrough,
  testObjectWraps,
  testSpreadObjectWrapsWithKeys,
  testArrayWraps,
  testCallPassesThrough,
];
