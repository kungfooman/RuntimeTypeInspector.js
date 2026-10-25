import {isIndexSignatureNode} from './isIndexSignatureNode.js';
import {expandType} from './expandType.js';
// We want: real signature nodes recognized, so pushes need no cast.
function testSignatureNodePasses() {
  return (
    isIndexSignatureNode({type: 'indexSignature', indexType: 'string', indexParameters: []}) === true
  );
}
// We want: the containing object rejected, since it is not itself a signature.
function testObjectNodeFails() {
  return isIndexSignatureNode(expandType('{[n: number]: string}')) === false;
}
// We want: bare atoms rejected without throwing.
function testBareStringFails() {
  return isIndexSignatureNode(expandType('string')) === false;
}
// We want: undefined rejected, so callers can skip the undefined check.
function testUndefinedFails() {
  return isIndexSignatureNode(undefined) === false;
}
// We want: null rejected without throwing, since typeof null is object.
function testNullFails() {
  return isIndexSignatureNode(null) === false;
}
// We want: other nodes rejected even though they share the object shape.
function testArrayNodeFails() {
  return isIndexSignatureNode(expandType('string[]')) === false;
}
const tests = [
  testSignatureNodePasses,
  testObjectNodeFails,
  testBareStringFails,
  testUndefinedFails,
  testNullFails,
  testArrayNodeFails,
];
export {tests};
