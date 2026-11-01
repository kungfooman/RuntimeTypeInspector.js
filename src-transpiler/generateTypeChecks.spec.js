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

// Arrow overloads use actual call arguments while the body keeps lexical arguments.
function testOverloadedArrowLexicalArguments() {
  const src = `function outer(marker) {
    /**
     * @overload
     * @param {number} value
     * @returns {string}
     */
    /** @param {number} value */
    const arrow = (value = 1) => arguments[0] + value;
    arrow(2, 3);
    return arrow();
  }
  const result = outer('marker');`;
  return runChecks(src, 'result', (scope, {hits}) => (
    scope.result === 'marker1' && hits.length === 2
  ));
}

// Suppression names the implementation parameter even when overload names differ.
function testOverloadedScopedIgnoreUsesPosition() {
  const src = `/**
     * @overload
     * @param {number} renamed
     * @param {string} other
     * @returns {void}
     */
    /**
     * @param {number} value
     * @param {string} other
     * @ignoreRTI value
     */
    function takeIgnoredOverload(value, other) {}
    takeIgnoredOverload('ignored', 'ok');
    takeIgnoredOverload('ignored', 3);`;
  return runChecks(src, 'takeIgnoredOverload', (scope, {hits}) => hits.length === 1);
}

// A parameter named Array cannot shadow the argument-list conversion.
function testOverloadParameterNamedArray() {
  const src = `/**
     * @overload
     * @param {number} value
     * @returns {number}
     */
    /** @param {number} Array */
    function takeArrayNamedParam(Array) { return Array; }
    takeArrayNamedParam(1);
    takeArrayNamedParam('bad');`;
  return runChecks(src, 'takeArrayNamedParam', (scope, {hits}) => hits.length === 1);
}

// A named arrow keeps its length, inferred name, and actual argument list.
function testOverloadedArrowMetadata() {
  const src = `/**
     * @overload
     * @param {number} first
     * @param {number} [second]
     * @returns {number}
     */
    /** @param {number} first @param {number} [second] */
    const measured = (first, second = 1) => first + second;
    measured(2);
    measured(2, undefined);
    measured(2, 3, 4);`;
  return runChecks(src, 'measured', (scope, {hits, posted}) => (
    scope.measured.length === 1 &&
    scope.measured.name === 'measured' &&
    hits.length === 1 &&
    posted[0].value.length === 3
  ));
}

// An object property arrow retains its inferred property name and arity.
function testOverloadedPropertyArrowMetadata() {
  const src = `const container = {
    /** @overload @param {number} value @returns {number} */
    /** @param {number} value */
    action: (value) => value
  };
  container.action('bad');`;
  return runChecks(src, 'container', (scope, {hits}) => (
    scope.container.action.length === 1 &&
    scope.container.action.name === 'action' &&
    hits.length === 1
  ));
}

// An async arrow keeps its metadata even when the surrounding scope shadows Object.
function testOverloadedAsyncArrowMetadata() {
  const src = `const Object = null;
  /** @overload @param {number} value @returns {Promise<number>} */
  /** @param {number} value */
  const asyncAction = async (value) => value;`;
  return runChecks(src, 'asyncAction', (scope) => (
    scope.asyncAction.length === 1 &&
    scope.asyncAction.name === 'asyncAction' &&
    scope.asyncAction.constructor.name === 'AsyncFunction'
  ));
}

export const tests = [
  testMismatchedParamSkips,
  testOverloadDocblockMismatchSkips,
  testMatchingParamStillChecks,
  testRestBindingStillChecks,
  testOverloadedArrowLexicalArguments,
  testOverloadedScopedIgnoreUsesPosition,
  testOverloadParameterNamedArray,
  testOverloadedArrowMetadata,
  testOverloadedPropertyArrowMetadata,
  testOverloadedAsyncArrowMetadata,
];
