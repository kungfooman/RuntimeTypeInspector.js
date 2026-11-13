import {substituteTuple} from './substituteTuple.js';
const noop = () => undefined;
// We want: tuple elements substitute, because each element is a separate
// type position.
function testTupleElements() {
  const input = {
    type: 'tuple',
    elements: ['K', 'number'],
  };
  const actual = JSON.stringify(substituteTuple(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'tuple',
    elements: ['"a"', 'number'],
  });
  return actual === expected;
}
// We want: a tuple with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testTupleUnchanged() {
  const input = {
    type: 'tuple',
    elements: ['string', 'number'],
  };
  return substituteTuple(input, 'K', '"a"', noop) === input;
}
// We want: nested tuple elements substitute recursively, because an
// element may itself contain the search key at any depth.
function testTupleNested() {
  const input = {
    type: 'tuple',
    elements: [{
      type: 'array',
      elementType: 'K',
    }, 'number'],
  };
  const actual = JSON.stringify(substituteTuple(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'tuple',
    elements: [{
      type: 'array',
      elementType: '"a"',
    }, 'number'],
  });
  return actual === expected;
}
const tests = [
  testTupleElements,
  testTupleUnchanged,
  testTupleNested,
];
export {tests};
