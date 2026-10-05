import {substituteList} from './substituteList.js';
const noop = () => undefined;
// We want: every element of a list substitutes independently, because each
// element is a separate type position.
function testListMultiple() {
  return JSON.stringify(substituteList(['K', 'string', 'K'], 'K', '"a"', noop)) ===
    JSON.stringify(['"a"', 'string', '"a"']);
}
// We want: a list with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testListUnchanged() {
  const input = ['string', 'number'];
  return substituteList(input, 'K', '"a"', noop) === input;
}
// We want: nested lists substitute recursively, because an element may
// itself contain the search key at any depth.
function testListNested() {
  return JSON.stringify(substituteList([{type: 'array', elementType: 'K'}, 'number'], 'K', '"a"', noop)) ===
    JSON.stringify([{type: 'array', elementType: '"a"'}, 'number']);
}
// We want: an empty list returns an empty list, because there is nothing
// to substitute.
function testListEmpty() {
  return JSON.stringify(substituteList([], 'K', '"a"', noop)) === '[]';
}
// We want: a non-array input is returned as-is, because the handler only
// processes lists — callers must not pass single types.
function testListNotArray() {
  return substituteList(undefined, 'K', '"a"', noop) === undefined;
}
const tests = [
  testListMultiple,
  testListUnchanged,
  testListNested,
  testListEmpty,
  testListNotArray,
];
export {tests};
