import {ownWrittenKeys} from './ownWrittenKeys.js';
import {Stringifier   } from './Stringifier.js';
// Plain keys contribute their names, so validators forgive the rest.
function testPlainKeysCollected() {
  const actual = ownWrittenKeys({
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
        type: 'ObjectProperty',
        key: {
          type: 'StringLiteral',
          value: 'b',
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
  });
  const names = actual.elements.map((element) => element.value);
  const spelled = actual.elements.every((element) => typeof element.extra?.raw === 'string');
  return actual.type === 'ArrayExpression' && names.length === 2 && names[0] === 'a' && names[1] === 'b' && spelled;
}
// Synthetic key literals render verbatim: the Stringifier reads extra.raw,
// so a missing spelling would emit an empty hole and poison the names array.
function testKeyLiteralsRender() {
  const loc = {
    start: {
      line: 1,
      column: 6,
      index: 6,
    },
    end: {
      line: 1,
      column: 20,
      index: 20,
    },
  };
  const actual = ownWrittenKeys({
    type: 'ObjectExpression',
    loc,
    properties: [
      {
        type: 'ObjectProperty',
        key: {
          type: 'Identifier',
          name: 'x',
        },
        computed: false,
      },
      {
        type: 'SpreadElement',
        argument: {
          type: 'Identifier',
          name: 'bag',
        },
      },
    ],
  });
  return new Stringifier().toSource(actual) === '["x"]';
}
// Computed keys contribute their key expression, evaluated at runtime.
function testComputedKeyKept() {
  const key = {
    type: 'Identifier',
    name: 'k',
  };
  const actual = ownWrittenKeys({
    type: 'ObjectExpression',
    properties: [
      {
        type: 'ObjectProperty',
        key,
        computed: true,
      },
      {
        type: 'SpreadElement',
        argument: {
          type: 'Identifier',
          name: 'o',
        },
      },
    ],
  });
  return actual.elements.length === 1 && actual.elements[0] === key;
}
// Methods contribute their names like properties do.
function testMethodKeysCollected() {
  const actual = ownWrittenKeys({
    type: 'ObjectExpression',
    properties: [
      {
        type: 'ObjectMethod',
        key: {
          type: 'Identifier',
          name: 'm',
        },
        computed: false,
      },
    ],
  });
  return actual.elements.length === 1 && actual.elements[0].value === 'm';
}
export const tests = [
  testPlainKeysCollected,
  testKeyLiteralsRender,
  testComputedKeyKept,
  testMethodKeysCollected,
];
