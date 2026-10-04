import {substituteSet} from './substituteSet.js';
const noop = () => undefined;
// We want: a set's element type substitutes, because it is the only
// type position of the node.
function testSetElement() {
  return JSON.stringify(substituteSet({type: 'set', elementType: 'K'}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'set', elementType: '"a"'});
}
// We want: a set with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testSetUnchanged() {
  const input = {type: 'set', elementType: 'number'};
  return substituteSet(input, 'K', '"a"', noop) === input;
}
// We want: nested set element types substitute recursively, because
// the element type may itself contain the search key at any depth.
function testSetNested() {
  return JSON.stringify(substituteSet({type: 'set', elementType: {type: 'array', elementType: 'K'}}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'set', elementType: {type: 'array', elementType: '"a"'}});
}
const tests = [
  testSetElement,
  testSetUnchanged,
  testSetNested,
];
export {tests};
