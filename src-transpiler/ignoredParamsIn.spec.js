import {ignoredParamsIn} from './ignoredParamsIn.js';
function testBareIsAll() {
  // A lone tag skips the whole function.
  return ignoredParamsIn('@ignoreRTI') === 'all';
}
function testScopedIsSet() {
  // Listed names skip only those checks.
  const ignored = ignoredParamsIn('@ignoreRTI vertices');
  return ignored instanceof Set && ignored.has('vertices') && ignored.size === 1;
}
function testQuotedIsAll() {
  // Markdown quoting is formatting, not a parameter name.
  return ignoredParamsIn('`@ignoreRTI`') === 'all' && ignoredParamsIn('"@ignoreRTI"') === 'all';
}
function testAbsentIsNull() {
  // No tag means nothing ignored.
  return ignoredParamsIn('@param {number} x') === null;
}
function testSimilarTagIgnored() {
  // Longer tag names starting the same way do not trigger.
  return ignoredParamsIn('@ignoreRTIExtended') === null;
}
export const tests = [
  testBareIsAll,
  testScopedIsSet,
  testQuotedIsAll,
  testAbsentIsNull,
  testSimilarTagIgnored,
];
