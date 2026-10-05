import {runChecks} from './runChecks.js';
import {noneUnchecked} from './noneUnchecked.js';
// Plain function templates infer per call: `funPlain('a')` passes,
// `funPlain(1)` fails against the `string` constraint.
function testPlainFunction() {
  const src = '/** @template {string} K\n@param {K} v */\nfunction funPlain(v) { return v; }';
  return runChecks(src, 'funPlain', (scope, {hits, posted}) => {
    const before = hits.length;
    if (scope.funPlain('a') !== 'a' || hits.length !== before) {
      return false;
    }
    if (scope.funPlain(1) !== 1 || hits.length !== before + 1) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// Constrained defaults on functions keep the constraint.
function testConstrainedDefaultFunction() {
  const src = '/** @template {string} [K=string]\n@param {K} v */\nfunction funDefault(v) { return v; }';
  return runChecks(src, 'funDefault', (scope, {hits, posted}) => {
    const before = hits.length;
    if (scope.funDefault('a') !== 'a' || hits.length !== before) {
      return false;
    }
    if (scope.funDefault(1) !== 1 || hits.length !== before + 1) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// Templates survive `export` on functions.
function testExportedFunction() {
  const src = '/** @template {string} K\n@param {K} v */\nexport function funExported(v) { return v; }';
  return runChecks(src, 'funExported', (scope, {hits, posted}) => {
    const before = hits.length;
    if (scope.funExported('a') !== 'a' || hits.length !== before) {
      return false;
    }
    if (scope.funExported(1) !== 1 || hits.length !== before + 1) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// Arrow functions infer like named ones.
function testArrowFunction() {
  const src = '/** @template {string} K\n@param {K} v */\nconst funArrow = (v) => v;';
  return runChecks(src, 'funArrow', (scope, {hits, posted}) => {
    const before = hits.length;
    if (scope.funArrow('a') !== 'a' || hits.length !== before) {
      return false;
    }
    if (scope.funArrow(1) !== 1 || hits.length !== before + 1) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
// Multi-param functions infer jointly under one `rtiTemplates`.
function testJointAcrossParams() {
  const src = '/** @template {string} K\n@param {K} a\n@param {K} b */\nfunction funJoint(a, b) { return [a, b]; }';
  return runChecks(src, 'funJoint', (scope, {hits, posted}) => {
    const before = hits.length;
    const [a, b] = scope.funJoint('a', 'b'); // ok: widens to string
    if (a !== 'a' || b !== 'b' || hits.length !== before) {
      return false;
    }
    const [c, d] = scope.funJoint('a', 1); // warns
    if (c !== 'a' || d !== 1 || hits.length !== before + 1) {
      return false;
    }
    return noneUnchecked(posted);
  });
}
export const tests = [
  testPlainFunction,
  testConstrainedDefaultFunction,
  testExportedFunction,
  testArrowFunction,
  testJointAcrossParams,
];
