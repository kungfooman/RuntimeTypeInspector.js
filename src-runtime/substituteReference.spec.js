import {substituteReference} from './substituteReference.js';
const noop = () => undefined;
// We want: reference type arguments substitute, because each argument is
// a separate type position.
function testReferenceArgs() {
  return JSON.stringify(substituteReference({type: 'reference', name: 'Box', args: ['K']}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'reference', name: 'Box', args: ['"a"']});
}
// We want: a reference with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testReferenceUnchanged() {
  const input = {type: 'reference', name: 'Box', args: ['string']};
  return substituteReference(input, 'K', '"a"', noop) === input;
}
// We want: a reference without args is returned by identity, because there
// is no type position to substitute.
function testReferenceNoArgs() {
  const input = {type: 'reference', name: 'Box'};
  return substituteReference(input, 'K', '"a"', noop) === input;
}
// We want: nested reference arguments substitute recursively, because an
// argument may itself contain the search key at any depth.
function testReferenceNested() {
  return JSON.stringify(substituteReference({type: 'reference', name: 'Box', args: [{type: 'array', elementType: 'K'}]}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'reference', name: 'Box', args: [{type: 'array', elementType: '"a"'}]});
}
const tests = [
  testReferenceArgs,
  testReferenceUnchanged,
  testReferenceNoArgs,
  testReferenceNested,
];
export {tests};
