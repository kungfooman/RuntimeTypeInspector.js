import {parse} from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {Asserter} from './Asserter.js';
import {expandType} from './expandType.js';
/**
 * @param {string} src - Source code with one function to convert.
 * @returns {{out: string, warnings: any[]}} Converted code and warnings.
 */
function checksFor(src) {
  const warnings = [];
  const origWarn = console.warn;
  console.warn = (...args) => warnings.push(args);
  const asserter = new Asserter({expandType, addHeader: false, filename: 'test.js'});
  const out = asserter.getHeader() + asserter.toSource(parse(src, parserOptions));
  console.warn = origWarn;
  return {out, warnings};
}
function testBareInlineNotOptional() {
  // Inline type without default: plain check, no optional flag.
  const {out, warnings} = checksFor('function add(/** @type {number} */ a) { return a; }');
  if (!out.includes('inspectType(a, "number"')) {
    return false;
  }
  if (out.includes('optional') || warnings.length) {
    return false;
  }
  return true;
}
function testInlineWithDefaultIsOptional() {
  // Inline type plus default: same type, optional flag added.
  const {out, warnings} = checksFor('function f(/** @type {number} */ b = 1) { return b; }');
  if (!out.includes('"type": "number"') || !out.includes('"optional": true')) {
    return false;
  }
  if (warnings.length) {
    return false;
  }
  return true;
}
function testJSDocBeatsInline() {
  // Documented param keeps JSDoc type even with conflicting inline comment.
  const src = '/** @param {string} a - Keeps. */\nfunction f(/** @type {number} */ a) { return a; }';
  const {out, warnings} = checksFor(src);
  if (!out.includes('inspectType(a, "string"')) {
    return false;
  }
  if (out.includes('"number"') || warnings.length) {
    return false;
  }
  return true;
}
function testInlineBeatsDefaultInference() {
  // Inline string wins over numeric default; default still marks optional.
  const {out, warnings} = checksFor('function f(/** @type {string} */ s = 0) { return s; }');
  if (!out.includes('"type": "string"') || !out.includes('"optional": true')) {
    return false;
  }
  if (out.includes('"number"') || warnings.length) {
    return false;
  }
  return true;
}
function testDefaultOnlyIsOptional() {
  // No inline type: widened default inference with optional flag.
  const {out, warnings} = checksFor('function f(x = 0) { return x; }');
  if (!out.includes('"type": "number"') || !out.includes('"optional": true')) {
    return false;
  }
  if (warnings.length) {
    return false;
  }
  return true;
}
function testNoCheckWithoutTypeOrDefault() {
  // Bare param: nothing emitted, nothing warned.
  const {out, warnings} = checksFor('function f(a) { return a; }');
  if (out.includes('inspectType') || warnings.length) {
    return false;
  }
  return true;
}
function testArrowWithDeclaratorChecked() {
  const {out, warnings} = checksFor('const make = (svc = new Service()) => svc;');
  if (!out.includes('"type": "Service"') || !out.includes('"optional": true')) {
    return false;
  }
  if (warnings.length) {
    return false;
  }
  return true;
}
function testBareCallbackSkipped() {
  // Bare callbacks stay silent (issue #11 guard), even with defaults.
  const {out, warnings} = checksFor('function f(cb) { cb.forEach((item = 0) => item); }');
  if (out.includes('inspectType') || warnings.length) {
    return false;
  }
  return true;
}
export const tests = [
  testBareInlineNotOptional,
  testInlineWithDefaultIsOptional,
  testJSDocBeatsInline,
  testInlineBeatsDefaultInference,
  testDefaultOnlyIsOptional,
  testNoCheckWithoutTypeOrDefault,
  testArrowWithDeclaratorChecked,
  testBareCallbackSkipped,
];
