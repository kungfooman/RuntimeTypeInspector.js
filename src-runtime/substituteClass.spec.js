import {substituteClass} from './substituteClass.js';
const noop = () => undefined;
// We want: a class's element type substitutes, because it is the only
// type position of the node.
function testClassElement() {
  return JSON.stringify(substituteClass({type: 'class', elementType: 'K'}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'class', elementType: '"a"'});
}
// We want: a class with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testClassUnchanged() {
  const input = {type: 'class', elementType: 'number'};
  return substituteClass(input, 'K', '"a"', noop) === input;
}
// We want: nested class element types substitute recursively, because
// the element type may itself contain the search key at any depth.
function testClassNested() {
  return JSON.stringify(substituteClass({type: 'class', elementType: {type: 'array', elementType: 'K'}}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'class', elementType: {type: 'array', elementType: '"a"'}});
}
const tests = [
  testClassElement,
  testClassUnchanged,
  testClassNested,
];
export {tests};
