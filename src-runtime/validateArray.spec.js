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
const tests = [
  testDensePasses,
  testWrongElementFails,
  testLengthExtendedHolesFail,
  testEmptySlotsFail,
  testExplicitUndefinedFails,
];
export {tests};
