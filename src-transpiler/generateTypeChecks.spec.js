import {runChecks} from './runChecks.js';
function testMismatchedParamSkips() {
  // A JSDoc `@param` naming nothing declared must not emit a reference to
  // it: the generated code would throw ReferenceError at runtime. The
  // check is skipped with a warning instead (tsc reports these as TS8024).
  const src = `/** @param {string} name - Wrong name. */
    function takeMismatchParam(type) {
      return type;
    }
    takeMismatchParam("x");`;
  return runChecks(src, 'takeMismatchParam', (scope, {hits, posted}) => typeof scope.takeMismatchParam === 'function' && hits.length === 0 && posted.length === 0);
}
function testOverloadDocblockMismatchSkips() {
  // An `@overload` block whose `@param` names miss the implementation
  // parameters skips the same way: no crashing reference is emitted.
  const src = `/**
     * @overload
     * @param {string} name - The script name.
     */
    function takeOverloadMismatch(type) {
      return type;
    }
    takeOverloadMismatch("x");`;
  return runChecks(src, 'takeOverloadMismatch', (scope, {hits, posted}) => typeof scope.takeOverloadMismatch === 'function' && hits.length === 0 && posted.length === 0);
}
function testMatchingParamStillChecks() {
  // Control: a correctly named `@param` still validates and reports.
  const src = `/** @param {number} x - The value. */
    function takeMismatchControl(x) {
      return x;
    }
    takeMismatchControl("s");`;
  return runChecks(src, 'takeMismatchControl', (scope, {hits, posted}) => hits.length === 1 && posted.length === 1);
}
function testRestBindingStillChecks() {
  // `...rest` declares its binding: a matching JSDoc name emits the
  // check instead of skipping it as a mismatch.
  const passingSrc = `/** @param {...any} rest - R. */
    function takeRestPass(...rest) {
      return rest;
    }
    takeRestPass(1, 2);`;
  const passing = runChecks(passingSrc, 'takeRestPass', (scope, {hits, posted}) => typeof scope.takeRestPass === 'function' && hits.length === 0 && posted.length === 0);
  const failingSrc = `/** @param {...number} rest - R. */
    function takeRestFail(...rest) {
      return rest;
    }
    takeRestFail(1, "x");`;
  const failing = runChecks(failingSrc, 'takeRestFail', (scope, {hits, posted}) => hits.length === 1 && posted.length === 1);
  return passing && failing;
}
export const tests = [
  testMismatchedParamSkips,
  testOverloadDocblockMismatchSkips,
  testMatchingParamStillChecks,
  testRestBindingStillChecks,
];
