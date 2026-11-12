import {substituteRest} from './substituteRest.js';
const noop = () => undefined;
// We want: the annotation of a rest type substitutes, because it is the
// only type position of the node.
function testRestAnnotation() {
  const input = {
    type: 'rest',
    annotation: 'K',
  };
  const actual = JSON.stringify(substituteRest(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'rest',
    annotation: '"a"',
  });
  return actual === expected;
}
// We want: a rest type with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testRestUnchanged() {
  const input = {
    type: 'rest',
    annotation: 'number',
  };
  return substituteRest(input, 'K', '"a"', noop) === input;
}
// We want: nested rest annotations substitute recursively, because the
// annotation may itself contain the search key at any depth.
function testRestNested() {
  const input = {
    type: 'rest',
    annotation: {
      type: 'array',
      elementType: 'K',
    },
  };
  const actual = JSON.stringify(substituteRest(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'rest',
    annotation: {
      type: 'array',
      elementType: '"a"',
    },
  });
  return actual === expected;
}
const tests = [
  testRestAnnotation,
  testRestUnchanged,
  testRestNested,
];
export {tests};
