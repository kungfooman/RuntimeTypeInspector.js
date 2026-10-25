import {canonicalize} from './canonicalize.js';
import {deepEqualType} from './deepEqualType.js';
import {expandType} from '../src-transpiler/expandType.js';
// We want: keys sorted and `false` flags plus explicit `undefined`
// normalized away, so the output is stable for JSON comparison.
function testSortsKeysAndDropsNoise() {
  const inp = {...expandType('{b: string, a: string}'), optional: false, c: undefined};
  return (
    deepEqualType(canonicalize(inp), expandType('{a: string, b: string}')) === true
  );
}
// We want: `readonly: false` dropped like `optional: false`, since
// both mean the same in RTI semantics.
function testReadonlyFalseDropped() {
  const inp = {...expandType('{a: string}'), readonly: false};
  return (
    deepEqualType(canonicalize(inp), expandType('{a: string}')) === true
  );
}
// We want: `true` flags kept, so `optional: true` survives canonicalization.
function testTrueFlagsKept() {
  const inp = expandType('{a?: string}');
  return (
    deepEqualType(canonicalize(inp), expandType('{a?: string}')) === true
  );
}
// We want: arrays mapped element-wise with order preserved, so tuple
// element order survives canonicalization.
function testArraysMapInOrder() {
  const left = expandType('[string, {b: string, a: number}]');
  const right = expandType('[string, {a: number, b: string}]');
  return (
    deepEqualType(canonicalize(left), canonicalize(right)) === true
  );
}
// We want: primitives passed through untouched, since only objects
// need canonical form.
function testPrimitivesPassThrough() {
  return (
    canonicalize(expandType('string')) === 'string' &&
    canonicalize(expandType('123')) === 123 &&
    canonicalize(null) === null &&
    canonicalize(undefined) === undefined
  );
}
const tests = [
  testSortsKeysAndDropsNoise,
  testReadonlyFalseDropped,
  testTrueFlagsKept,
  testArraysMapInOrder,
  testPrimitivesPassThrough,
];
export {tests};
