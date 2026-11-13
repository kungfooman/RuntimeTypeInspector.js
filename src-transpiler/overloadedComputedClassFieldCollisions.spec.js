import {runChecks} from './runChecks.js';
// A field arrow colliding with the dummy head keeps its own binding: the
// generator renames carriers, so the parameter shadows nothing and the
// wrapper still reports length one with the coerced key name.
function testComputedFieldSurvivesParamCarrierCollision() {
  const src = `class Fields {
    /** @overload @param {number} rtiParam0 @returns {number} */
    /** @param {number|string} rtiParam0 */
    [String('param')] = (rtiParam0) => typeof rtiParam0 === 'number' ? rtiParam0 : 0;
  }
  const fields = new Fields();
  fields.param('bad');`;
  return runChecks(src, 'fields', (scope, {hits, posted}) => (
    scope.fields.param(1) === 1 &&
    scope.fields.param('bad') === 0 &&
    scope.fields.param.length === 1 &&
    scope.fields.param.name === 'param' &&
    hits.length === 2 &&
    posted[0].loc === 'Fields#String(\'param\')'
  ));
}
// A rest parameter colliding with the stored-call carrier still records
// every argument: the wrapper renames its own rest binding instead.
function testComputedFieldSurvivesRestCarrierCollision() {
  const src = `class Fields {
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    [String('rest')] = (...rtiOverloadRest) => rtiOverloadRest.length;
  }
  const fields = new Fields();
  fields.rest('bad');`;
  return runChecks(src, 'fields', (scope, {hits}) => (
    scope.fields.rest.length === 0 &&
    scope.fields.rest.name === 'rest' &&
    scope.fields.rest(1) === 1 &&
    hits.length === 1
  ));
}
// Outer bindings named like the carriers survive: the captured key is a
// parameter-local binding, so the module-level names are untouched and the
// field still checks and names itself after the outer key value.
function testComputedFieldSurvivesOuterCarrierCollision() {
  const src = `const rtiOverloadKey = 'outer-key';
  const rtiOverloadStore = 'outer-store';
  class Fields {
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    [rtiOverloadKey] = (value) => typeof value === 'number' ? value : 0;
  }
  const fields = new Fields();
  fields['outer-key']('bad');`;
  return runChecks(src, 'fields, rtiOverloadKey, rtiOverloadStore', (scope, {hits}) => (
    scope.fields['outer-key'].name === 'outer-key' &&
    scope.fields['outer-key'].length === 1 &&
    scope.rtiOverloadKey === 'outer-key' &&
    scope.rtiOverloadStore === 'outer-store' &&
    hits.length === 1
  ));
}
// Two computed fields in one class keep independent captures: each key
// feeds only its own wrapper, so both names, results, and locs stay split.
function testComputedFieldsKeepIndependentCaptures() {
  const src = `class Fields {
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    [String('one')] = (value) => 1;
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    [String('two')] = (value) => 2;
  }
  const fields = new Fields();
  fields.one('bad');
  fields.two('bad');`;
  return runChecks(src, 'fields', (scope, {hits, posted}) => (
    scope.fields.one.name === 'one' &&
    scope.fields.two.name === 'two' &&
    scope.fields.one(1) === 1 &&
    scope.fields.two(1) === 2 &&
    hits.length === 2 &&
    posted[0].loc === 'Fields#String(\'one\')' &&
    posted[1].loc === 'Fields#String(\'two\')'
  ));
}
// A shadowed carrier name in an unrelated scope stays put: the capture
// parameter is function-local, so reusing the spelled name elsewhere does
// not leak or rename anything observable.
function testComputedFieldCaptureStaysFunctionLocal() {
  const src = `const rtiOverloadKey_ = 'shadowed';
  class Fields {
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    [rtiOverloadKey_] = (value) => typeof value === 'number' ? value : 0;
  }
  const fields = new Fields();
  fields.shadowed('bad');`;
  return runChecks(src, 'fields, rtiOverloadKey_', (scope, {hits}) => (
    scope.fields.shadowed.name === 'shadowed' &&
    scope.fields.shadowed.length === 1 &&
    scope.rtiOverloadKey_ === 'shadowed' &&
    hits.length === 1
  ));
}
export const tests = [
  testComputedFieldSurvivesParamCarrierCollision,
  testComputedFieldSurvivesRestCarrierCollision,
  testComputedFieldSurvivesOuterCarrierCollision,
  testComputedFieldsKeepIndependentCaptures,
  testComputedFieldCaptureStaysFunctionLocal,
];
