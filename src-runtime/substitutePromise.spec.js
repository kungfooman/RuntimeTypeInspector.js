import {substitutePromise} from './substitutePromise.js';
const noop = () => undefined;
// We want: a promise's element type substitutes, because it is the only
// type position of the node.
function testPromiseElement() {
  const input = {
    type: 'promise',
    elementType: 'K',
  };
  const actual = JSON.stringify(substitutePromise(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'promise',
    elementType: '"a"',
  });
  return actual === expected;
}
// We want: a promise with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testPromiseUnchanged() {
  const input = {
    type: 'promise',
    elementType: 'number',
  };
  return substitutePromise(input, 'K', '"a"', noop) === input;
}
// We want: nested promise element types substitute recursively, because
// the element type may itself contain the search key at any depth.
function testPromiseNested() {
  const input = {
    type: 'promise',
    elementType: {
      type: 'array',
      elementType: 'K',
    },
  };
  const actual = JSON.stringify(substitutePromise(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'promise',
    elementType: {
      type: 'array',
      elementType: '"a"',
    },
  });
  return actual === expected;
}
const tests = [
  testPromiseElement,
  testPromiseUnchanged,
  testPromiseNested,
];
export {tests};
