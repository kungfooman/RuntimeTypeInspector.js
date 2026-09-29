import {parse} from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {Asserter} from './Asserter.js';
import {expandType} from './expandType.js';
import {parseJSDocTemplates} from './parseJSDocTemplates.js';
import {inspectTypeWithTemplates} from '../src-runtime/inspectTypeWithTemplates.js';
/**
 * @param {string} src - Source code with one class to convert.
 * @returns {string} Converted code.
 */
function convert(src) {
  const asserter = new Asserter({expandType, addHeader: false, filename: 'test.js'});
  return asserter.getHeader() + asserter.toSource(parse(src, parserOptions));
}
/**
 * Runs `fn` with `console.warn` stubbed, returning collected warnings.
 * @param {Function} fn - The function to run with warnings captured.
 * @returns {{ret: *, warnings: any[][]}} Return value plus captured warnings.
 */
function captureWarns(fn) {
  const warnings = [];
  const orig = console.warn;
  console.warn = (...args) => warnings.push(args);
  try {
    const ret = fn();
    return {ret, warnings};
  } finally {
    console.warn = orig;
  }
}
// `@template {Constraint} [K=Default]` keeps the constraint: the default
// only applies when nothing is inferred (issue #265 truncated this to
// undefined, so the whole class went unchecked).
function testConstrainedDefaultKeepsConstraint() {
  const templates = parseJSDocTemplates('@template {AssetType | (string & {})} [K=string]');
  if (!templates || typeof templates.K !== 'object' || templates.K.type !== 'union') {
    return false;
  }
  if (!templates.K.members.includes('AssetType')) {
    return false;
  }
  const bare = parseJSDocTemplates('@template {string} [K=string]');
  return bare?.K === 'string';
}
// The constructor inherits class templates: `@param {K}` emits joint
// inference instead of a bare `inspectType(v, "K")` (`unchecked`).
function testConstructorInheritsClassTemplates() {
  const out = convert('/** @template {string} K */ class A { /** @param {K} v */ constructor(v) { this.v = v; } }');
  if (!out.includes('"K": "string"') || !out.includes('inspectTypeWithTemplates(v, "K"')) {
    return false;
  }
  return !out.includes('!inspectType(v, "K"');
}
// The exact issue shape: `Asset` with `@template {AssetType | ...} [K=string]`
// checks both constructor params through the class constraint.
function testIssueAssetShape() {
  const src = '/** @template {AssetType | (string & {})} [K=string] */\n' +
    'class Asset { /** @param {string} name\n@param {K} type */ constructor(name, type) { this.type = type; } }';
  const out = convert(src);
  if (!out.includes('"AssetType"') || !out.includes('inspectTypeWithTemplates(name, "string"')) {
    return false;
  }
  return out.includes('inspectTypeWithTemplates(type, "K"');
}
// Non-constructor methods inherit too: `Box#set` validates against `K`.
function testMethodInheritsClassTemplates() {
  const out = convert('/** @template {string} K */ class Box { /** @param {K} v */ set(v) { this.v = v; } }');
  return out.includes('inspectTypeWithTemplates(v, "K"') && out.includes('"K": "string"');
}
// Method-local `@template` wins over the class one for its own keys.
function testMethodLocalWins() {
  const src = '/** @template {string} K */ class Pair { /** @template {number} T\n@param {T} x\n@param {K} y */ mixed(x, y) { return [x, y]; } }';
  const out = convert(src);
  return out.includes('"T": "number"') && out.includes('"K": "string"');
}
// Class templates survive `export` wrappers.
function testExportWrapper() {
  const out = convert('/** @template {string} K */ export class E { /** @param {K} x */ constructor(x) { this.x = x; } }');
  return out.includes('inspectTypeWithTemplates(x, "K"') && out.includes('"K": "string"');
}
// Runtime side of `new Box('a')` (ok) vs `new Box(1)` (warns): a fresh
// per-call `rtiTemplates` seeded with the class constraint.
function testRuntimeOkAndWarns() {
  const okTemplates = {K: 'string'};
  const ok = captureWarns(() => inspectTypeWithTemplates('a', 'K', 'Box#constructor', 'value', okTemplates));
  if (!ok.ret || ok.warnings.length || okTemplates.K !== '"a"') {
    return false;
  }
  const badTemplates = {K: 'string'};
  captureWarns(() => inspectTypeWithTemplates('a', 'K', 'Box#constructor', 'value', badTemplates));
  const bad = captureWarns(() => inspectTypeWithTemplates(1, 'K', 'Box#constructor', 'value', badTemplates));
  return bad.ret === false && bad.warnings.length === 0;
}
// Runtime joint inference across constructor params: `new Pair('a', 'b')`
// widens `K` to string (ok), `new Pair('a', 1)` warns like tsc.
function testRuntimeJointInference() {
  const wide = {K: 'string'};
  const first = captureWarns(() => inspectTypeWithTemplates('a', 'K', 'Pair#constructor', 'a', wide));
  const second = captureWarns(() => inspectTypeWithTemplates('b', 'K', 'Pair#constructor', 'b', wide));
  if (!first.ret || !second.ret || wide.K !== 'string') {
    return false;
  }
  const narrow = {K: 'string'};
  captureWarns(() => inspectTypeWithTemplates('a', 'K', 'Pair#constructor', 'a', narrow));
  const warns = captureWarns(() => inspectTypeWithTemplates(1, 'K', 'Pair#constructor', 'b', narrow));
  return warns.ret === false;
}
export const tests = [
  testConstrainedDefaultKeepsConstraint,
  testConstructorInheritsClassTemplates,
  testIssueAssetShape,
  testMethodInheritsClassTemplates,
  testMethodLocalWins,
  testExportWrapper,
  testRuntimeOkAndWarns,
  testRuntimeJointInference,
];
