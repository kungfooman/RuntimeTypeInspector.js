import {substituteIntersection} from './substituteIntersection.js';
const noop = () => undefined;
// We want: intersection members substitute, because each member is a
// separate type position.
function testIntersectionMembers() {
  return JSON.stringify(substituteIntersection({type: 'intersection', members: ['K', 'number']}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'intersection', members: ['"a"', 'number']});
}
// We want: an intersection with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testIntersectionUnchanged() {
  const input = {type: 'intersection', members: ['string', 'number']};
  return substituteIntersection(input, 'K', '"a"', noop) === input;
}
// We want: nested intersection members substitute recursively, because a
// member may itself contain the search key at any depth.
function testIntersectionNested() {
  return JSON.stringify(substituteIntersection({type: 'intersection', members: [{type: 'array', elementType: 'K'}, 'number']}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'intersection', members: [{type: 'array', elementType: '"a"'}, 'number']});
}
const tests = [
  testIntersectionMembers,
  testIntersectionUnchanged,
  testIntersectionNested,
];
export {tests};
