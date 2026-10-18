import {isFailingNumberDisallowingInf} from './isFailingNumberDisallowingInf.js';
/**
 * Every test here states its expectation first, then checks it, so a
 * stubbed-out function is caught by the failing expectation instead of
 * passing silently.
 * @returns {boolean} True when every expectation in the tests holds.
 */
function testRejectsNonNumber() {
  // Non-number types must fail: the check mirrors validateNumber, which
  // rejects without coercion and therefore also rejects boxed numbers.
  // Non-number types must fail: the check mirrors validateNumber, which
  // rejects without coercion and therefore also rejects boxed numbers.
  return isFailingNumberDisallowingInf('1') && isFailingNumberDisallowingInf(null) &&
    isFailingNumberDisallowingInf(undefined) && isFailingNumberDisallowingInf(Object(1)) &&
    isFailingNumberDisallowingInf({}) === true;
}
function testRejectsNaN() {
  // NaN never passes the number check: it is the classic precursor bug.
  return isFailingNumberDisallowingInf(Number.NaN) === true;
}
function testRejectsInfinity() {
  // This variant is picked when infinities count as failing, so both
  // directions fail regardless of the option state.
  return isFailingNumberDisallowingInf(Infinity) === true && isFailingNumberDisallowingInf(-Infinity) === true;
}
function testAcceptsFinite() {
  // Ordinary finite numbers, including signed zero and big values, pass.
  return isFailingNumberDisallowingInf(0) === false && isFailingNumberDisallowingInf(-0) === false &&
    isFailingNumberDisallowingInf(Number.MAX_SAFE_INTEGER) === false &&
    isFailingNumberDisallowingInf(1.5) === false;
}
const tests = [
  testRejectsNonNumber,
  testRejectsNaN,
  testRejectsInfinity,
  testAcceptsFinite,
];
export {tests};
