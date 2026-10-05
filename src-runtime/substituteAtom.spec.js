import {substituteAtom} from './substituteAtom.js';
const noop = () => undefined;
// We want: an optional annotated atom substitutes its inner type, because
// optional template params must instantiate rather than warn unchecked.
function testAtomOptional() {
  return JSON.stringify(substituteAtom({type: 'K', optional: true}, 'K', '"a"', noop)) ===
    JSON.stringify({type: '"a"', optional: true});
}
// We want: a readonly annotated atom substitutes its inner type, because
// readonly template params must instantiate just like optional ones.
function testAtomReadonly() {
  return JSON.stringify(substituteAtom({type: 'K', readonly: true}, 'K', '"a"', noop)) ===
    JSON.stringify({type: '"a"', readonly: true});
}
// We want: an atom whose inner type does not match the search is returned by
// identity, so unchanged subtrees keep their identity for downstream memos.
function testAtomUnchanged() {
  const input = {type: 'number', optional: true};
  return substituteAtom(input, 'K', '"a"', noop) === input;
}
// We want: an atom with extra keys still substitutes its inner type, because
// the extra-keys guard lives in substituteType's dispatch, not in this
// low-level handler — the handler always rewrites .type.
function testAtomExtraKeys() {
  return JSON.stringify(substituteAtom({type: 'K', extra: 1}, 'K', '"a"', noop)) ===
    JSON.stringify({type: '"a"', extra: 1});
}
// We want: a tree replacement keeps its own shape with the occurrence
// flags merged in, so `{T, optional}` with a tree `T` never nests a tree in
// the leaf `.type` position the validators switch on.
function testAtomTreeSplice() {
  return JSON.stringify(substituteAtom({type: 'K', optional: true}, 'K', {type: 'string'}, noop)) ===
    JSON.stringify({type: 'string', optional: true});
}
// We want: the atom's readonly flag to survive a tree replacement, just like
// it survives a leaf replacement.
function testAtomTreeReadonly() {
  return JSON.stringify(substituteAtom({type: 'K', readonly: true}, 'K', {type: 'string'}, noop)) ===
    JSON.stringify({type: 'string', readonly: true});
}
// We want: an already-optional tree to stay optional without an atom flag,
// so inner optionality is never stripped by the splice.
function testAtomTreeKeepsInnerOptional() {
  return JSON.stringify(substituteAtom({type: 'K'}, 'K', {type: 'string', optional: true}, noop)) ===
    JSON.stringify({type: 'string', optional: true});
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
