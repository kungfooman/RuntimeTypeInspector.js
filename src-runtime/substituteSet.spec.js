import {substituteSet} from './substituteSet.js';
const noop = () => undefined;
// We want: a set's element type substitutes, because it is the only
// type position of the node.
function testSetElement() {
  const input = {
    type: 'set',
    elementType: 'K',
  };
  const actual = JSON.stringify(substituteSet(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'set',
    elementType: '"a"',
  });
  return actual === expected;
}
// We want: a set with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testSetUnchanged() {
  const input = {
    type: 'set',
    elementType: 'number',
  };
  return substituteSet(input, 'K', '"a"', noop) === input;
}
// We want: nested set element types substitute recursively, because
// the element type may itself contain the search key at any depth.
function testSetNested() {
  const input = {
    type: 'set',
    elementType: {
      type: 'array',
      elementType: 'K',
    },
  };
  const actual = JSON.stringify(substituteSet(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'set',
    elementType: {
      type: 'array',
      elementType: '"a"',
    },
  });
  return actual === expected;
}
const tests = [
  testSetElement,
  testSetUnchanged,
  testSetNested,
];
export {tests};
