import {substitutePromise} from './substitutePromise.js';
const noop = () => undefined;
// We want: a promise's element type substitutes, because it is the only
// type position of the node.
function testPromiseElement() {
  return JSON.stringify(substitutePromise({type: 'promise', elementType: 'K'}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'promise', elementType: '"a"'});
}
// We want: a set's element type substitutes, because sets share the same
// single-element shape as promises.
function testSetElement() {
  return JSON.stringify(substitutePromise({type: 'set', elementType: 'K'}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'set', elementType: '"a"'});
}
// We want: a class's element type substitutes, because classes share the
// same single-element shape as promises.
function testClassElement() {
  return JSON.stringify(substitutePromise({type: 'class', elementType: 'K'}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'class', elementType: '"a"'});
}
// We want: a promise with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testPromiseUnchanged() {
  const input = {type: 'promise', elementType: 'number'};
  return substitutePromise(input, 'K', '"a"', noop) === input;
}
const tests = [
  testPromiseElement,
  testSetElement,
  testClassElement,
  testPromiseUnchanged,
];
export {tests};
