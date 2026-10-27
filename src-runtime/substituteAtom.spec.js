import {substituteAtom} from './substituteAtom.js';
import {deepEqualType} from './deepEqualType.js';
import {expandType} from '../src-transpiler/expandType.js';
const noop = () => undefined;
// We want: an optional annotated atom substitutes its inner type, because
// optional template params must instantiate rather than warn unchecked.
function testAtomOptional() {
  const parsed = expandType('{a?: K}');
  const input = parsed.properties.a;
  const substituted = substituteAtom(input, 'K', '"a"', noop);
  const expected = {type: 'atom', atomType: '"a"', optional: true};
  return deepEqualType(substituted, expected);
}
// We want: a readonly annotated atom substitutes its inner type, because
// readonly template params must instantiate just like optional ones.
function testAtomReadonly() {
  const parsed = expandType('{readonly a: K}');
  const input = parsed.properties.a;
  const substituted = substituteAtom(input, 'K', '"a"', noop);
  const expected = {type: 'atom', atomType: '"a"', readonly: true};
  return deepEqualType(substituted, expected);
}
// We want: an atom whose inner type does not match the search is returned by
// identity, so unchanged subtrees keep their identity for downstream memos.
function testAtomUnchanged() {
  const parsed = expandType('{n?: number}');
  const input = parsed.properties.n;
  return substituteAtom(input, 'K', '"a"', noop) === input;
}
// We want: an atom with extra keys still substitutes its inner type, because
// the extra-keys guard lives in substituteType's dispatch, not in this
// low-level handler — the handler always rewrites .atomType. Key order is
// irrelevant: deepEqualType sorts before comparing.
function testAtomExtraKeys() {
  const parsed = expandType('{a?: K}');
  const base = parsed.properties.a;
  const input = {...base, extra: 1};
  const substituted = substituteAtom(input, 'K', '"a"', noop);
  const expected = {type: 'atom', atomType: '"a"', extra: 1, optional: true};
  return deepEqualType(substituted, expected);
}
// We want: a tree replacement keeps its own shape with the occurrence
// flags merged in, so `{atomType: T, optional}` with a tree `T` never nests
// a tree in the leaf `.atomType` position the validators switch on.
function testAtomTreeSplice() {
  const parsed = expandType('{a?: K}');
  const input = parsed.properties.a;
  const substituted = substituteAtom(input, 'K', {type: 'string'}, noop);
  const expected = {type: 'string', optional: true};
  return deepEqualType(substituted, expected);
}
// We want: the atom's readonly flag to survive a tree replacement, just like
// it survives a leaf replacement.
function testAtomTreeReadonly() {
  const parsed = expandType('{readonly a: K}');
  const input = parsed.properties.a;
  const substituted = substituteAtom(input, 'K', {type: 'string'}, noop);
  const expected = {type: 'string', readonly: true};
  return deepEqualType(substituted, expected);
}
// We want: an already-optional tree to stay optional without an atom flag,
// so inner optionality is never stripped by the splice. No parser emits a
// flagless atom (a bare `{a: K}` needs no wrapper), so the input is
// hand-built from an optional parser atom with its flag cleared.
function testAtomTreeKeepsInnerOptional() {
  const parsed = expandType('{a?: K}');
  const flagged = parsed.properties.a;
  const {optional, ...bare} = flagged;
  const substituted = substituteAtom(bare, 'K', {type: 'string', optional: true}, noop);
  const expected = {type: 'string', optional: true};
  return deepEqualType(substituted, expected);
}
const tests = [
  testAtomOptional,
  testAtomReadonly,
  testAtomUnchanged,
  testAtomExtraKeys,
  testAtomTreeSplice,
  testAtomTreeReadonly,
  testAtomTreeKeepsInnerOptional,
];
export {tests};
