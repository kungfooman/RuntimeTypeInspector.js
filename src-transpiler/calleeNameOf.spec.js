import {calleeNameOf} from './calleeNameOf.js';
// Plain calls resolve to their identifier.
function testIdentifierCallee() {
  const node = {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'f',
    },
    arguments: [],
  };
  return calleeNameOf(node) === 'f';
}
// Member calls resolve to the property name.
function testMemberCallee() {
  const node = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'Identifier',
        name: 'a',
      },
      property: {
        type: 'Identifier',
        name: 'b',
      },
    },
    arguments: [],
  };
  return calleeNameOf(node) === 'b';
}
// Computed members have no name: they wrap as user calls.
function testComputedCalleeNameless() {
  const node = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: true,
      object: {
        type: 'Identifier',
        name: 'a',
      },
      property: {
        type: 'StringLiteral',
        value: 'b',
      },
    },
    arguments: [],
  };
  return calleeNameOf(node) === undefined;
}
// Exotic callees have no name: they wrap as user calls.
function testExoticCalleeNameless() {
  const node = {
    type: 'CallExpression',
    callee: {
      type: 'NumericLiteral',
      value: 1,
    },
    arguments: [],
  };
  return calleeNameOf(node) === undefined;
}
// Missing nodes have no name without throwing.
function testMissingNameless() {
  return calleeNameOf(undefined) === undefined && calleeNameOf(null) === undefined;
}
export const tests = [
  testIdentifierCallee,
  testMemberCallee,
  testComputedCalleeNameless,
  testExoticCalleeNameless,
  testMissingNameless,
];
