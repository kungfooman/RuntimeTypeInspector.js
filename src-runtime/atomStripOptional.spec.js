import {atomStripOptional} from './atomStripOptional.js';
import {expandType} from '../src-transpiler/expandType.js';
// We want: an optional atom to come back with `optional: false`, because
// `NonNullable` must clear the occurrence flag while keeping the wrapper
// the `resolveObjectArgs` loop dispatches on.
function testStripOptionalAtomClearsFlag() {
  const parsed = expandType('{camera?: Camera}');
  const input = parsed.properties.camera;
  const stripped = atomStripOptional(input);
  return JSON.stringify(stripped) ===
    JSON.stringify({type: 'atom', atomType: 'Camera', optional: false});
}
// We want: stripping to be idempotent, because `resolveObjectArgs` may see
// an already-stripped wrapper on the next loop turn and `canonicalize`
// treats `false` and absent the same.
function testStripOptionalAtomAlreadyFalse() {
  const parsed = expandType('{camera?: Camera}');
  const input = parsed.properties.camera;
  const once = atomStripOptional(input);
  const twice = atomStripOptional(once);
  return JSON.stringify(twice) ===
    JSON.stringify({type: 'atom', atomType: 'Camera', optional: false});
}
// We want: a bare string to pass through by identity, because the caller's
// loop variable may hold any payload and only atoms need the flag cleared.
function testStripOptionalBarePassthrough() {
  return atomStripOptional('Camera') === 'Camera';
}
// We want: a non-atom object to pass through by identity, because only the
// tagged wrapper owns the occurrence flag this helper clears.
function testStripOptionalNonAtomPassthrough() {
  const input = {type: 'string', optional: true};
  return atomStripOptional(input) === input;
}
// We want: nullish inputs to pass through untouched, because the utility
// loop feeds `args[0]` straight in and must never invent a wrapper.
function testStripOptionalNullishPassthrough() {
  return atomStripOptional(null) === null && atomStripOptional(undefined) === undefined;
}
const tests = [
  testStripOptionalAtomClearsFlag,
  testStripOptionalAtomAlreadyFalse,
  testStripOptionalBarePassthrough,
  testStripOptionalNonAtomPassthrough,
  testStripOptionalNullishPassthrough,
];
export {tests};
