import {atomUnwrap} from './atomUnwrap.js';
import {deepEqualType} from './deepEqualType.js';
import {expandType} from '../src-transpiler/expandType.js';
// We want: a leaf atom plus an occurrence flag to unwrap to a flagged leaf,
// because `@param {T} [a]` must validate `T` while allowing omission.
function testUnwrapLeafKeepsFlag() {
  const parsed = expandType('{a?: K}');
  const input = parsed.properties.a;
  const unwrapped = atomUnwrap(input);
  const expected = {type: 'K', optional: true};
  return deepEqualType(unwrapped, expected);
}
// We want: a tree replacement to keep its own shape with the occurrence
// flags merged in, because a tree must never land in the leaf position the
// validators switch on.
function testUnwrapTreeMergesFlags() {
  const unwrapped = atomUnwrap({type: 'atom', atomType: {type: 'string'}, optional: true});
  const expected = {type: 'string', optional: true};
  return deepEqualType(unwrapped, expected);
}
// We want: an already-optional tree to stay optional without an atom flag,
// so inner optionality is never stripped by the unwrap.
function testUnwrapTreeKeepsInnerOptional() {
  const unwrapped = atomUnwrap({type: 'atom', atomType: {type: 'string', optional: true}});
  const expected = {type: 'string', optional: true};
  return deepEqualType(unwrapped, expected);
}
// We want: an unflagged atom to unwrap to the bare inner shape, because no
// occurrence flag means nothing to merge. No parser emits a flagless atom
// (a bare `{n: number}` needs no wrapper), so the input is hand-built from
// the required-atom shape the parsers do emit.
function testUnwrapBarePassthrough() {
  const parsed = expandType('{n?: number}');
  const flagged = parsed.properties.n;
  const {optional, ...bare} = flagged;
  const unwrapped = atomUnwrap(bare);
  const expected = {type: 'number'};
  return deepEqualType(unwrapped, expected);
}
// We want: the readonly flag to merge the same way as optional, because
// readonly template params instantiate just like optional ones.
function testUnwrapReadonlyMerges() {
  const parsed = expandType('{readonly a: K}');
  const input = parsed.properties.a;
  const unwrapped = atomUnwrap(input);
  const expected = {type: 'K', readonly: true};
  return deepEqualType(unwrapped, expected);
}
const tests = [
  testUnwrapLeafKeepsFlag,
  testUnwrapTreeMergesFlags,
  testUnwrapTreeKeepsInnerOptional,
  testUnwrapBarePassthrough,
  testUnwrapReadonlyMerges,
];
export {tests};
