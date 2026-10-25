import {isArrayNode} from './isArrayNode.js';
import {expandType} from './expandType.js';
// We want: array nodes recognized, so navigation needs no cast.
function testArrayPasses() {
  return isArrayNode(expandType('string[]')) === true;
}
// We want: union nodes rejected, since they navigate via members.
function testUnionFails() {
  return isArrayNode(expandType('string | number')) === false;
}
// We want: object nodes rejected, since they navigate via properties.
function testObjectFails() {
  return isArrayNode(expandType('{a: string}')) === false;
}
// We want: bare atoms rejected without throwing.
function testBareStringFails() {
  return isArrayNode(expandType('string')) === false;
}
// We want: undefined rejected, so callers can skip the undefined check.
function testUndefinedFails() {
  return isArrayNode(undefined) === false;
}
// We want: null rejected without throwing, since typeof null is object.
function testNullFails() {
  return isArrayNode(null) === false;
}
const tests = [
  testArrayPasses,
  testUnionFails,
  testObjectFails,
  testBareStringFails,
  testUndefinedFails,
  testNullFails,
];
export {tests};
