import {substituteArray} from './substituteArray.js';
const noop = () => undefined;
// We want: substituting the element type of an array node produces a new array
// node with the replacement, because the element type is the only type position.
function testArrayElementType() {
  const input = {
    type: 'array',
    elementType: 'K',
  };
  const actual = JSON.stringify(substituteArray(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'array',
    elementType: '"a"',
  });
  return actual === expected;
}
// We want: an array node whose element type does not match the search is
// returned by identity, so downstream memos keep hitting.
function testArrayUnchanged() {
  const input = {
    type: 'array',
    elementType: 'number',
  };
  return substituteArray(input, 'K', '"a"', noop) === input;
}
// We want: nested array nodes substitute recursively, because the element
// type itself may contain the search key at any depth.
function testArrayNested() {
  const input = {
    type: 'array',
    elementType: {
      type: 'array',
      elementType: 'K',
    },
  };
  const actual = JSON.stringify(substituteArray(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'array',
    elementType: {
      type: 'array',
      elementType: '"a"',
    },
  });
  return actual === expected;
}
const tests = [
  testArrayElementType,
  testArrayUnchanged,
  testArrayNested,
];
export {tests};
