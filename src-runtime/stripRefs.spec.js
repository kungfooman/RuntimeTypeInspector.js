import {stripRefs} from './stripRefs.js';
function testLeavesPrimitivesUntouched() {
  return stripRefs('number') === 'number' && stripRefs(42) === 42 && stripRefs(null) === null;
}
function testStripsRefFromReferenceNode() {
  function Vec() {}
  const out = stripRefs({
    type: 'reference',
    name: 'Vec',
    args: [],
    ref: Vec,
  });
  return out.ref === undefined && out.name === 'Vec' && out.type === 'reference' &&
    Array.isArray(out.args) && typeof Vec === 'function';
}
function testStripsNestedRefs() {
  function Vec() {}
  const inner = {
    type: 'reference',
    name: 'Vec',
    args: [],
    ref: Vec,
  };
  const out = stripRefs({
    type: 'array',
    elementType: inner,
  });
  return out.elementType.ref === undefined && out.elementType.name === 'Vec';
}
function testReturnsInputWhenRefFree() {
  const tree = {
    type: 'reference',
    name: 'Vec',
    args: [],
  };
  return stripRefs(tree) === tree;
}
function testDoesNotMutateFrozenInput() {
  function Vec() {}
  const tree = Object.freeze({
    type: 'reference',
    name: 'Vec',
    args: Object.freeze([]),
    ref: Vec,
  });
  const out = stripRefs(tree);
  return out.ref === undefined && tree.ref === Vec;
}
const tests = [
  testLeavesPrimitivesUntouched,
  testStripsRefFromReferenceNode,
  testStripsNestedRefs,
  testReturnsInputWhenRefFree,
  testDoesNotMutateFrozenInput,
];
export {tests};
