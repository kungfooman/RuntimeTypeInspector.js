import {substituteTuple} from './substituteTuple.js';
const noop = () => undefined;
// We want: tuple elements substitute, because each element is a separate
// type position.
function testTupleElements() {
  return JSON.stringify(substituteTuple({type: 'tuple', elements: ['K', 'number']}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'tuple', elements: ['"a"', 'number']});
}
// We want: a tuple with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testTupleUnchanged() {
  const input = {type: 'tuple', elements: ['string', 'number']};
  return substituteTuple(input, 'K', '"a"', noop) === input;
}
// We want: nested tuple elements substitute recursively, because an
// element may itself contain the search key at any depth.
function testTupleNested() {
  return JSON.stringify(substituteTuple({type: 'tuple', elements: [{type: 'array', elementType: 'K'}, 'number']}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'tuple', elements: [{type: 'array', elementType: '"a"'}, 'number']});
}
const tests = [
  testTupleElements,
  testTupleUnchanged,
  testTupleNested,
];
export {tests};
