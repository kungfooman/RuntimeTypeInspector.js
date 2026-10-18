import {isFailingNumberAllowingInf} from './isFailingNumberAllowingInf.js';
/**
 * Every test here states its expectation first, then checks it, so a
 * stubbed-out function is caught by the failing expectation instead of
 * passing silently.
 * @returns {boolean} True when every expectation in the tests holds.
 */
function testAcceptsInfinity() {
  // This variant exists for the checkInfinity-off mode, where
  // infinities pass, so both directions must pass.
  return isFailingNumberAllowingInf(Infinity) === false &&
    isFailingNumberAllowingInf(-Infinity) === false;
}
function testRejectsNaN() {
  // Infinities pass, NaN still fails: the NaN rejection is never an
  // optional part of the number check.
  return isFailingNumberAllowingInf(Number.NaN) === true;
}
function testRejectsNonNumber() {
  // Non-number types fail without coercion, boxed numbers included,
  // mirroring validateNumber's strict typeof behavior.
  return isFailingNumberAllowingInf('1') === true &&
    isFailingNumberAllowingInf(Object(1)) === true &&
    isFailingNumberAllowingInf(null) === true;
}
function testAcceptsFinite() {
  // Ordinary finite numbers, including signed zero, pass.
  return isFailingNumberAllowingInf(0) === false &&
    isFailingNumberAllowingInf(-0) === false && isFailingNumberAllowingInf(1.5) === false;
}
const tests = [
  testAcceptsInfinity,
  testRejectsNaN,
  testRejectsNonNumber,
  testAcceptsFinite,
];
export {tests};
