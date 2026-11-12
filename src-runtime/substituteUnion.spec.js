import {substituteUnion} from './substituteUnion.js';
const noop = () => undefined;
// We want: union members substitute, because each member is a separate
// type position.
function testUnionMembers() {
  const input = {
    type: 'union',
    members: ['K', 'number'],
  };
  const actual = JSON.stringify(substituteUnion(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'union',
    members: ['"a"', 'number'],
  });
  return actual === expected;
}
// We want: a union with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testUnionUnchanged() {
  const input = {
    type: 'union',
    members: ['string', 'number'],
  };
  return substituteUnion(input, 'K', '"a"', noop) === input;
}
// We want: nested union members substitute recursively, because a member
// may itself contain the search key at any depth.
function testUnionNested() {
  const input = {
    type: 'union',
    members: [{
      type: 'array',
      elementType: 'K',
    }, 'number'],
  };
  const actual = JSON.stringify(substituteUnion(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'union',
    members: [{
      type: 'array',
      elementType: '"a"',
    }, 'number'],
  });
  return actual === expected;
}
const tests = [
  testUnionMembers,
  testUnionUnchanged,
  testUnionNested,
];
export {tests};
