import {substituteUnion} from './substituteUnion.js';
const noop = () => undefined;
// We want: union members substitute, because each member is a separate
// type position.
function testUnionMembers() {
  return JSON.stringify(substituteUnion({type: 'union', members: ['K', 'number']}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'union', members: ['"a"', 'number']});
}
// We want: a union with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testUnionUnchanged() {
  const input = {type: 'union', members: ['string', 'number']};
  return substituteUnion(input, 'K', '"a"', noop) === input;
}
// We want: nested union members substitute recursively, because a member
// may itself contain the search key at any depth.
function testUnionNested() {
  return JSON.stringify(substituteUnion({type: 'union', members: [{type: 'array', elementType: 'K'}, 'number']}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'union', members: [{type: 'array', elementType: '"a"'}, 'number']});
}
const tests = [
  testUnionMembers,
  testUnionUnchanged,
  testUnionNested,
];
export {tests};
