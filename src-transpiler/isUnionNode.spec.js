import {isUnionNode} from './isUnionNode.js';
import {expandType} from './expandType.js';
// We want: union nodes recognized, so navigation needs no cast.
function testUnionPasses() {
  return isUnionNode(expandType('string | number')) === true;
}
// We want: array nodes rejected, since they navigate via elementType.
function testArrayFails() {
  return isUnionNode(expandType('string[]')) === false;
}
// We want: object nodes rejected, since they navigate via properties.
function testObjectFails() {
  return isUnionNode(expandType('{a: string}')) === false;
}
// We want: bare atoms rejected without throwing.
function testBareStringFails() {
  return isUnionNode(expandType('string')) === false;
}
// We want: undefined rejected, so callers can skip the undefined check.
function testUndefinedFails() {
  return isUnionNode(undefined) === false;
}
// We want: null rejected without throwing, since typeof null is object.
function testNullFails() {
  return isUnionNode(null) === false;
}
const tests = [
  testUnionPasses,
  testArrayFails,
  testObjectFails,
  testBareStringFails,
  testUndefinedFails,
  testNullFails,
];
export {tests};
