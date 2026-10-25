import {isObjectNode} from './isObjectNode.js';
import {expandType} from './expandType.js';
// We want: object nodes recognized, so navigation needs no cast.
function testObjectPasses() {
  return isObjectNode(expandType('{a: string}')) === true;
}
// We want: array nodes rejected, since they navigate via elementType.
function testArrayFails() {
  return isObjectNode(expandType('string[]')) === false;
}
// We want: union nodes rejected, since they navigate via members.
function testUnionFails() {
  return isObjectNode(expandType('string | number')) === false;
}
// We want: bare atoms rejected without throwing.
function testBareStringFails() {
  return isObjectNode(expandType('string')) === false;
}
// We want: undefined rejected, so callers can skip the undefined check.
function testUndefinedFails() {
  return isObjectNode(undefined) === false;
}
// We want: null rejected without throwing, since typeof null is object.
function testNullFails() {
  return isObjectNode(null) === false;
}
const tests = [
  testObjectPasses,
  testArrayFails,
  testUnionFails,
  testBareStringFails,
  testUndefinedFails,
  testNullFails,
];
export {tests};
