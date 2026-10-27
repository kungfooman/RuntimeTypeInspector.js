import {validateUnion} from './validateUnion.js';
import {expandType} from '../src-transpiler/expandType.js';
const silent = () => undefined;
// We want: a dense number array to satisfy `Vec4 | number[]` through the
// array member, because the union tries every member and the array fits.
function testDenseArrayPasses() {
  const parsed = expandType('Vec4 | number[]');
  return validateUnion([0, 0, 1, 1], parsed, 'loc', 'anchor', true, silent, 0) === true;
}
// We want: a holey tail to fail the strict union, because `validateArray`
// reads every index including absent ones. Over-allocated buffers (grown
// `length`, never-written tail slots) are a host-side concern: callers
// that only consume a prefix can ignore this check via `ignoredChecks`,
// while the validator itself stays strict.
function testHoleyTailFailsStrict() {
  const parsed = expandType('Vec4 | number[]');
  const grown = [0, 0, 1, 1];
  grown.length = 8;
  return validateUnion(grown, parsed, 'loc', 'anchor', true, silent, 0) === false;
}
// We want: an explicit `undefined` tail to fail too, because present
// `undefined` is a wrong element, not an absent index.
function testUndefinedTailFailsStrict() {
  const parsed = expandType('Vec4 | number[]');
  return validateUnion([0, 0, 1, 1, undefined], parsed, 'loc', 'anchor', true, silent, 0) === false;
}
// We want: a wrong-typed element to fail even when dense, so the test
// pins that the hole failure above is about absence, not laxity.
function testWrongElementFails() {
  const parsed = expandType('Vec4 | number[]');
  return validateUnion([0, 0, 1, 'x'], parsed, 'loc', 'anchor', true, silent, 0) === false;
}
const tests = [
  testDenseArrayPasses,
  testHoleyTailFailsStrict,
  testUndefinedTailFailsStrict,
  testWrongElementFails,
];
export {tests};
