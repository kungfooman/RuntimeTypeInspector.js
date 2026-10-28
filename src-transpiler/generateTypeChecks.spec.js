import {runChecks} from './runChecks.js';
function testMismatchedParamSkips() {
  // A JSDoc `@param` naming nothing declared must not emit a reference to
  // it: the generated code would throw ReferenceError at runtime. The
  // check is skipped with a warning instead (tsc reports these as TS8024).
  return runChecks('/** @param {string} name - Wrong name. */\nfunction takeMismatchParam(type) {\n return type;\n}\ntakeMismatchParam("x");', 'takeMismatchParam', (scope, {hits, posted}) => typeof scope.takeMismatchParam === 'function' && hits.length === 0 && posted.length === 0);
}
function testOverloadDocblockMismatchSkips() {
  // An `@overload` block whose `@param` names miss the implementation
  // parameters skips the same way: no crashing reference is emitted.
  return runChecks('/**\n * @overload\n * @param {string} name - The script name.\n */\nfunction takeOverloadMismatch(type) {\n return type;\n}\ntakeOverloadMismatch("x");', 'takeOverloadMismatch', (scope, {hits, posted}) => typeof scope.takeOverloadMismatch === 'function' && hits.length === 0 && posted.length === 0);
}
function testMatchingParamStillChecks() {
  // Control: a correctly named `@param` still validates and reports.
  return runChecks('/** @param {number} x - The value. */\nfunction takeMismatchControl(x) {\n return x;\n}\ntakeMismatchControl("s");', 'takeMismatchControl', (scope, {hits, posted}) => hits.length === 1 && posted.length === 1);
}
function testRestBindingStillChecks() {
  // `...rest` declares its binding: a matching JSDoc name emits the
  // check instead of skipping it as a mismatch.
  const passing = runChecks('/** @param {...any} rest - R. */\nfunction takeRestPass(...rest) {\n return rest;\n}\ntakeRestPass(1, 2);', 'takeRestPass', (scope, {hits, posted}) => typeof scope.takeRestPass === 'function' && hits.length === 0 && posted.length === 0);
  const failing = runChecks('/** @param {...number} rest - R. */\nfunction takeRestFail(...rest) {\n return rest;\n}\ntakeRestFail(1, "x");', 'takeRestFail', (scope, {hits, posted}) => hits.length === 1 && posted.length === 1);
  return passing && failing;
}
export const tests = [
  testMismatchedParamSkips,
  testOverloadDocblockMismatchSkips,
  testMatchingParamStillChecks,
  testRestBindingStillChecks,
];
