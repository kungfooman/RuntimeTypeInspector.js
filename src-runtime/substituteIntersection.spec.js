import {substituteIntersection} from './substituteIntersection.js';
const noop = () => undefined;
// We want: intersection members substitute, because each member is a
// separate type position.
function testIntersectionMembers() {
  const input = {
    type: 'intersection',
    members: ['K', 'number'],
  };
  const actual = JSON.stringify(substituteIntersection(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'intersection',
    members: ['"a"', 'number'],
  });
  return actual === expected;
}
// We want: an intersection with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testIntersectionUnchanged() {
  const input = {
    type: 'intersection',
    members: ['string', 'number'],
  };
  return substituteIntersection(input, 'K', '"a"', noop) === input;
}
// We want: nested intersection members substitute recursively, because a
// member may itself contain the search key at any depth.
function testIntersectionNested() {
  const input = {
    type: 'intersection',
    members: [{
      type: 'array',
      elementType: 'K',
    }, 'number'],
  };
  const actual = JSON.stringify(substituteIntersection(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'intersection',
    members: [{
      type: 'array',
      elementType: '"a"',
    }, 'number'],
  });
  return actual === expected;
}
const tests = [
  testIntersectionMembers,
  testIntersectionUnchanged,
  testIntersectionNested,
];
export {tests};
