import {createTypeFromIndexedAccess} from './createTypeFromIndexedAccess.js';
import {deepEqualType} from './deepEqualType.js';
import {expandType} from '../src-transpiler/expandType.js';
const silent = () => undefined;
// We want: a single selected prop to come back directly with its flags,
// because wrapping it would hide source optionality behind a required node.
function testSinglePropDirect() {
  const parsed = expandType('{a?: K}["a"]');
  const created = createTypeFromIndexedAccess(parsed, silent);
  const expected = {type: 'atom', atomType: 'K', optional: true};
  return deepEqualType(created, expected);
}
// We want: several selected props to form a union, because `T[K1 | K2]`
// is the union of the selected members.
function testMultiPropUnion() {
  const parsed = expandType('{a: K, b: number}["a" | "b"]');
  const created = createTypeFromIndexedAccess(parsed, silent);
  const expected = {type: 'union', members: ['K', 'number'], optional: false};
  return deepEqualType(created, expected);
}
// We want: a missing prop to yield undefined, because an unresolvable
// selection fails closed instead of validating against nothing.
function testMissingPropYieldsUndefined() {
  const parsed = expandType('{a: K}["nope"]');
  return createTypeFromIndexedAccess(parsed, silent) === undefined;
}
// We want: an unresolvable object side to yield undefined, for the same
// fail-closed reason.
function testUnresolvableObjectYieldsUndefined() {
  const parsed = expandType('Missing["a"]');
  return createTypeFromIndexedAccess(parsed, silent) === undefined;
}
const tests = [
  testSinglePropDirect,
  testMultiPropUnion,
  testMissingPropYieldsUndefined,
  testUnresolvableObjectYieldsUndefined,
];
export {tests};
