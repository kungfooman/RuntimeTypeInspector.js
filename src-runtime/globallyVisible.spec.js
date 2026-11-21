import {globallyVisible} from './globallyVisible.js';
// Platform constructors resolve on the real global scope in every
// environment the suite runs in, while user-land names never do.
function testPlatformNamesVisible() {
  return globallyVisible('Float32Array') === true &&
    globallyVisible('Array') === true;
}
function testUserNamesInvisible() {
  return globallyVisible('Equation') === false &&
    globallyVisible('NoSuchType') === false;
}
function testNonStringsFailClosed() {
  return globallyVisible(undefined) === false &&
    globallyVisible(42) === false;
}
const tests = [
  testPlatformNamesVisible,
  testUserNamesInvisible,
  testNonStringsFailClosed,
];
export {tests};
