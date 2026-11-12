import {substituteClass} from './substituteClass.js';
const noop = () => undefined;
// We want: a class's element type substitutes, because it is the only
// type position of the node.
function testClassElement() {
  const input = {
    type: 'class',
    elementType: 'K',
  };
  const actual = JSON.stringify(substituteClass(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'class',
    elementType: '"a"',
  });
  return actual === expected;
}
// We want: a class with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testClassUnchanged() {
  const input = {
    type: 'class',
    elementType: 'number',
  };
  return substituteClass(input, 'K', '"a"', noop) === input;
}
// We want: nested class element types substitute recursively, because
// the element type may itself contain the search key at any depth.
function testClassNested() {
  const input = {
    type: 'class',
    elementType: {
      type: 'array',
      elementType: 'K',
    },
  };
  const actual = JSON.stringify(substituteClass(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'class',
    elementType: {
      type: 'array',
      elementType: '"a"',
    },
  });
  return actual === expected;
}
const tests = [
  testClassElement,
  testClassUnchanged,
  testClassNested,
];
export {tests};
