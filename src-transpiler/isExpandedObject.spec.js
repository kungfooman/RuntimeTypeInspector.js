import {isExpandedObject} from './isExpandedObject.js';
import {expandType} from './expandType.js';
// We want: object nodes recognized, so flags can be written without casts.
function testObjectNodePasses() {
  return isExpandedObject(expandType('{a: string}')) === true;
}
// We want: bare atoms rejected, since flags on them need wrapping first.
function testBareStringFails() {
  return isExpandedObject(expandType('string')) === false;
}
// We want: undefined rejected, so callers can skip the undefined check.
function testUndefinedFails() {
  return isExpandedObject(undefined) === false;
}
// We want: literals rejected, since numbers and booleans carry no flags.
function testLiteralFails() {
  return (
    isExpandedObject(expandType('123')) === false &&
    isExpandedObject(expandType('true')) === false
  );
}
// We want: null rejected without throwing, since typeof null is object.
function testNullFails() {
  return isExpandedObject(null) === false;
}
const tests = [
  testObjectNodePasses,
  testBareStringFails,
  testUndefinedFails,
  testLiteralFails,
  testNullFails,
];
export {tests};
