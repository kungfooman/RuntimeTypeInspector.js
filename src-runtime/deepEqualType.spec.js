import {deepEqualType} from './deepEqualType.js';
import {expandType} from '../src-transpiler/expandType.js';
// We want: key order to never matter, so parser refactors that reorder
// node fields cannot produce false parity failures.
function testKeyOrderInsensitive() {
  return (
    deepEqualType({b: 1, a: 2}, {a: 2, b: 1}) === true &&
    deepEqualType({a: 2, b: 1}, {b: 1, a: 3}) === false
  );
}
// We want: Explicit undefined and `false` optionality/readonly flags to
// compare equal to absent, since both mean the same in RTI semantics.
function testUndefinedAndFalseFlagsDropped() {
  return (
    deepEqualType({a: 1, b: undefined}, {a: 1}) === true &&
    deepEqualType({type: 'atom', atomType: 'string', optional: false}, {type: 'atom', atomType: 'string'}) === true &&
    deepEqualType({type: 'atom', atomType: 'string', readonly: false}, {type: 'atom', atomType: 'string'}) === true &&
    deepEqualType({type: 'atom', atomType: 'string', optional: true}, {type: 'atom', atomType: 'string'}) === false
  );
}
// We want: nesting (arrays, nested nodes) to compare structurally, so
// whole expanded type trees compare, not just flat shapes.
function testNestedStructures() {
  const left = expandType('{b: {y: 1, x: 2}, a: string}');
  const right = expandType('{a: string, b: {x: 2, y: 1}}');
  const other = expandType('{a: string, b: {x: 2, y: 3}}');
  return (
    deepEqualType(left, right) === true &&
    deepEqualType(left, other) === false
  );
}
// We want: primitives and literals to compare by value, so the parity
// helper can mix node trees and bare type strings.
function testPrimitivesByValue() {
  return (
    deepEqualType('string', 'string') === true &&
    deepEqualType(1, 1) === true &&
    deepEqualType(true, true) === true &&
    deepEqualType('string', 'number') === false &&
    deepEqualType(1, 2) === false
  );
}
// We want: an explicit `true` flag to never equal an explicit `false`
// flag, so `optional: true` stays distinct from `optional: false`.
function testTrueFlagDistinctFromFalse() {
  return (
    deepEqualType({type: 'atom', atomType: 'string', optional: true}, {type: 'atom', atomType: 'string', optional: false}) === false &&
    deepEqualType({type: 'atom', atomType: 'string', readonly: true}, {type: 'atom', atomType: 'string', readonly: false}) === false
  );
}
// We want: arrays to compare positionally, so tuple element order is
// significant and a future sort-everything refactor cannot silently
// equate reordered members.
function testArrayOrderSignificant() {
  return (
    deepEqualType(['a', 'b'], ['b', 'a']) === false &&
    deepEqualType(['a', 'b'], ['a', 'b']) === true
  );
}
// We want: `null` to stay a real value while `undefined` drops, so a
// nullable union member never collapses into an absent key.
function testNullDistinctFromMissing() {
  return (
    deepEqualType({a: null}, {}) === false &&
    deepEqualType({a: null}, {a: null}) === true
  );
}
// We want: genuinely different node kinds to compare unequal, so the
// parity helper catches a parser emitting the wrong shape.
function testNodeKindsDistinct() {
  const array = expandType('string[]');
  const same = expandType('string[]');
  const set = expandType('Set<string>');
  return (
    deepEqualType(array, set) === false &&
    deepEqualType(array, same) === true
  );
}
const tests = [
  testKeyOrderInsensitive,
  testUndefinedAndFalseFlagsDropped,
  testNestedStructures,
  testPrimitivesByValue,
  testTrueFlagDistinctFromFalse,
  testArrayOrderSignificant,
  testNullDistinctFromMissing,
  testNodeKindsDistinct,
];
export {tests};
