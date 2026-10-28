import {validateType} from './validateType.js';
import {expandType} from '../src-transpiler/expandType.js';
const warn = () => undefined;
const numbers = () => expandType('Array<number>');
function testDensePasses() {
  // Dense valid arrays pass.
  return validateType([1, 2, 3], numbers(), 'loc', 'name', true, warn, 0) === true;
}
function testWrongElementFails() {
  // Present-but-wrong elements fail.
  return validateType([1, 'x', 3], numbers(), 'loc', 'name', true, warn, 0) === false;
}
function testLengthExtendedHolesFail() {
  // Length-extended tails are holes reading as `undefined`, not numbers:
  // the text-element shape that poisoned bounding boxes with `NaN`.
  const grown = [1];
  grown.length = 3;
  return validateType(grown, numbers(), 'loc', 'name', true, warn, 0) === false;
}
function testEmptySlotsFail() {
  // Preallocated slots are holes too.
  return validateType(new Array(3), numbers(), 'loc', 'name', true, warn, 0) === false;
}
function testExplicitUndefinedFails() {
  // Explicit `undefined` entries fail like holes do: the key is present
  // (`0 in [undefined]`), only absent indices are holes.
  return validateType([undefined], numbers(), 'loc', 'name', true, warn, 0) === false &&
    validateType([1, undefined, 2], numbers(), 'loc', 'name', true, warn, 0) === false;
}
function testFrozenPasses() {
  // Immutability is not shape: frozen arrays validate like dense ones.
  return validateType(Object.freeze([0, 0, 1, 1]), numbers(), 'loc', 'name', true, warn, 0) === true;
}
function testTypedArraysFail() {
  // Typed arrays are no `instanceof Array`, so they never satisfy
  // `number[]`, however numeric their contents read.
  return validateType(new Float32Array([0, 0, 1, 1]), numbers(), 'loc', 'name', true, warn, 0) === false &&
    validateType(new Uint8Array([1, 2]), numbers(), 'loc', 'name', true, warn, 0) === false;
}
function testExtraPropsPass() {
  // Named extras on an array are not elements: validation reads indices
  // only, so expando props never fail the check.
  const extra = [0, 0, 1, 1];
  extra.note = 'x';
  return validateType(extra, numbers(), 'loc', 'name', true, warn, 0) === true;
}
const tests = [
  testDensePasses,
  testWrongElementFails,
  testLengthExtendedHolesFail,
  testEmptySlotsFail,
  testExplicitUndefinedFails,
  testFrozenPasses,
  testTypedArraysFail,
  testExtraPropsPass,
];
export {tests};
