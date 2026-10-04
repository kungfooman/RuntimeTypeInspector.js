import {substituteTupleMember} from './substituteTupleMember.js';
const noop = () => undefined;
// We want: the element type of a tuple member substitutes, because it is
// the only type position of the node.
function testTupleMemberElement() {
  return JSON.stringify(substituteTupleMember({type: 'tupleMember', elementType: 'K', name: 'x'}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'tupleMember', elementType: '"a"', name: 'x'});
}
// We want: a tuple member with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testTupleMemberUnchanged() {
  const input = {type: 'tupleMember', elementType: 'number', name: 'x'};
  return substituteTupleMember(input, 'K', '"a"', noop) === input;
}
// We want: nested tuple member elements substitute recursively, because
// the element type may itself contain the search key at any depth.
function testTupleMemberNested() {
  return JSON.stringify(substituteTupleMember({type: 'tupleMember', elementType: {type: 'array', elementType: 'K'}, name: 'x'}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'tupleMember', elementType: {type: 'array', elementType: '"a"'}, name: 'x'});
}
const tests = [
  testTupleMemberElement,
  testTupleMemberUnchanged,
  testTupleMemberNested,
];
export {tests};
