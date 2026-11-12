import {deepEqualType} from './deepEqualType.js';
import {expandType   } from '../src-transpiler/expandType.js';
// We want: key order to never matter, so parser refactors that reorder
// node fields cannot produce false parity failures.
function testKeyOrderInsensitive() {
  const first = {
    b: 1,
    a: 2,
  };
  const reordered = {
    a: 2,
    b: 1,
  };
  const changed = {
    a: 3,
    b: 1,
  };
  const same = {
    a: 2,
    b: 1,
  };
  const orderOk = deepEqualType(first, reordered) === true;
  const changeOk = deepEqualType(same, changed) === false;
  return orderOk && changeOk;
}
// We want: Explicit undefined and `false` optionality/readonly flags to
// compare equal to absent, since both mean the same in RTI semantics.
function testUndefinedAndFalseFlagsDropped() {
  const withUndefined = {
    a: 1,
    b: undefined,
  };
  const bare = {
    a: 1,
  };
  const undefOk = deepEqualType(withUndefined, bare) === true;
  const optionalFalse = {
    type: 'atom',
    atomType: 'string',
    optional: false,
  };
  const plain = {
    type: 'atom',
    atomType: 'string',
  };
  const falseOk = deepEqualType(optionalFalse, plain) === true;
  const readonlyFalse = {
    type: 'atom',
    atomType: 'string',
    readonly: false,
  };
  const readonlyOk = deepEqualType(readonlyFalse, plain) === true;
  const optionalTrue = {
    type: 'atom',
    atomType: 'string',
    optional: true,
  };
  const trueMiss = deepEqualType(optionalTrue, plain) === false;
  return undefOk && falseOk && readonlyOk && trueMiss;
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
  const optionalTrue = {
    type: 'atom',
    atomType: 'string',
    optional: true,
  };
  const optionalFalse = {
    type: 'atom',
    atomType: 'string',
    optional: false,
  };
  const optionalMiss = deepEqualType(optionalTrue, optionalFalse) === false;
  const readonlyTrue = {
    type: 'atom',
    atomType: 'string',
    readonly: true,
  };
  const readonlyFalse = {
    type: 'atom',
    atomType: 'string',
    readonly: false,
  };
  const readonlyMiss = deepEqualType(readonlyTrue, readonlyFalse) === false;
  return optionalMiss && readonlyMiss;
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
  const nulled = {
    a: null,
  };
  const bare = {};
  const missingMiss = deepEqualType(nulled, bare) === false;
  const twin = {
    a: null,
  };
  const sameOk = deepEqualType(nulled, twin) === true;
  return missingMiss && sameOk;
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
