import {firstBadIndex} from './firstBadIndex.js';
import {validateArray} from './validateArray.js';
import {validateArrayLike} from './validateArrayLike.js';
import {validateArrayLikeSparse} from './validateArrayLikeSparse.js';
import {validators} from './validators.js';
import {options} from './options.js';
const arrayOf = (elementType) => ({type: 'array', elementType});
const likeOf = (elementType) => ({type: 'reference', name: 'ArrayLike', args: [elementType]});
function testExamplesVerbatim() {
  // The documented examples hold exactly.
  return firstBadIndex([1, 'x', 3], 3, 'number') === 1 &&
    firstBadIndex([1, 2, 3], 3, 'number') === -1 &&
    firstBadIndex([1, 2, 3], 3, 'Date') === 0;
}
function testStringBoolean() {
  // `string`/`boolean` scan by `typeof` like their validators.
  return firstBadIndex(['a', 1, 'c'], 3, 'string') === 1 &&
    firstBadIndex([true, false], 2, 'boolean') === -1 &&
    firstBadIndex([true, 0], 2, 'boolean') === 1;
}
function testNaNInfinityHole() {
  // `NaN`, `Infinity` and holes are suspects, matching `validateNumber`
  // plus the hole-strict element read.
  const holey = [1, 2, 3];
  holey.length = 5;
  return firstBadIndex([1, NaN, 3], 3, 'number') === 1 &&
    firstBadIndex([1, 2, Infinity], 3, 'number') === 2 &&
    firstBadIndex(holey, 5, 'number') === 3 &&
    firstBadIndex([undefined], 1, 'number') === 0;
}
function testInfinityOptOut() {
  // `options.checkInfinity === false` clears `Infinity`, like the validator.
  const prev = options.checkInfinity;
  try {
    options.checkInfinity = false;
    return firstBadIndex([Infinity], 1, 'number') === -1;
  } finally {
    options.checkInfinity = prev;
  }
}
function testEmptyAndUnknown() {
  // Empty ranges are clean; non-primitives scan nothing (full loop runs).
  return firstBadIndex([], 0, 'number') === -1 &&
    firstBadIndex([1], 1, {type: 'object'}) === 0 &&
    firstBadIndex([1], 1, undefined) === 0 &&
    firstBadIndex([1], 1, '"a"') === 0;
}
function testValidArraysPassSilently() {
  // The fast path changes nothing observable: valid arrays pass with zero warns.
  let warns = 0;
  const warn = () => warns++;
  const big = new Array(5000);
  for (let i = 0; i < big.length; i++) {
    big[i] = i * 0.5;
  }
  const ok = validateArray(big, arrayOf('number'), 'loc', 'name', true, warn, 0) === true &&
    validateArrayLike(big, likeOf('number'), 'loc', 'name', true, warn, 0) === true &&
    validateArray(['a', 'b'], arrayOf('string'), 'loc', 'name', true, warn, 0) === true &&
    validateArrayLike([true], likeOf('boolean'), 'loc', 'name', true, warn, 0) === true;
  return ok && warns === 0;
}
function testHoleStillFails() {
  // A hole still fails through the standard loop: element warn plus index warn.
  const holey = [1, 2, 3];
  holey.length = 5;
  let warns = 0;
  const warn = () => warns++;
  const ret = validateArray(holey, arrayOf('number'), 'loc', 'name', true, warn, 0) === false &&
    validateArrayLike(holey, likeOf('number'), 'loc', 'name', true, warn, 0) === false;
  return ret && warns === 4;
}
function testOverrideDisablesFastPath() {
  // A userland `validateNumber` override keeps composing: the builtin
  // scan must not pass what the override rejects.
  const prev = validators.validateNumber;
  try {
    validators.validateNumber = () => false;
    return validateArray([1], arrayOf('number'), 'loc', 'name', true, () => undefined, 0) === false;
  } finally {
    validators.validateNumber = prev;
  }
}
function testNonPrimitiveDeepCheck() {
  // Unknown element types run the full loop from the start, nested included.
  const shape = {type: 'array', elementType: {type: 'object', properties: {a: 'number'}}};
  const warn = () => undefined;
  return validateArray([{a: 1}, {a: 2}], shape, 'loc', 'name', true, warn, 0) === true &&
    validateArray([{a: 1}, {a: 'x'}], shape, 'loc', 'name', true, warn, 0) === false;
}
function testSparseHolesPass() {
  // Sparse mode still skips holes: the scan suspects them, the `in` test clears them.
  const holey = [1, 2, 3];
  holey.length = 5;
  const warn = () => undefined;
  return validateArrayLikeSparse(holey, arrayOf('number'), 'loc', 'name', true, warn, 0) === true &&
    validateArrayLikeSparse([1, 'x'], likeOf('number'), 'loc', 'name', true, warn, 0) === false;
}
const tests = [
  testExamplesVerbatim,
  testStringBoolean,
  testNaNInfinityHole,
  testInfinityOptOut,
  testEmptyAndUnknown,
  testValidArraysPassSilently,
  testHoleStillFails,
  testOverrideDisablesFastPath,
  testNonPrimitiveDeepCheck,
  testSparseHolesPass,
];
export {tests};
