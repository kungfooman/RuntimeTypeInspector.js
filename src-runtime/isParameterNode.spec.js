import {isParameterNode} from './isParameterNode.js';
import {expandType} from '../src-transpiler/expandType.js';
// We want: a tagged parameter node to pass, because index-signature params
// print as `name: type` exactly when the discriminant says `parameter`.
function testParameterNodeTrue() {
  const parsed = expandType('{[k: string]: number}');
  const input = parsed.indexSignatures[0].indexParameters[0];
  return isParameterNode(input) === true;
}
// We want: an atom to fail, because atoms print through the atom branch,
// never as `name: type`.
function testParameterNodeAtomFalse() {
  const parsed = expandType('{a?: K}');
  const input = parsed.properties.a;
  return isParameterNode(input) === false;
}
// We want: bare strings to fail, because only tagged objects own the
// parameter shape.
function testParameterNodeBareFalse() {
  return isParameterNode('string') === false;
}
// We want: nullish inputs to fail, because corrupt index parameters must
// fall through to the generic path instead of throwing on property reads.
function testParameterNodeNullishFalse() {
  return isParameterNode(null) === false && isParameterNode(undefined) === false;
}
// We want: a mistagged object with a `name` key to fail, because the old
// structural probe misprinted any such object as `name: type` while the
// discriminant lets it fall through to the generic path.
function testParameterNodeMistaggedFalse() {
  return isParameterNode({type: 'string', name: 'k'}) === false;
}
const tests = [
  testParameterNodeTrue,
  testParameterNodeAtomFalse,
  testParameterNodeBareFalse,
  testParameterNodeNullishFalse,
  testParameterNodeMistaggedFalse,
];
export {tests};
