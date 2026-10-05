import {parse} from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {Asserter} from './Asserter.js';
import {expandType} from './expandType.js';
import {expandTypeDepFree} from './expandTypeDepFree.js';
/**
 * Transpiles one snippet without the runtime header.
 * @param {string} src - Source code with one function to convert.
 * @param {object} [options] - Asserter options.
 * @returns {string} Converted code.
 */
function convert(src, options) {
  const asserter = new Asserter({expandType, addHeader: false, filename: 'test.js', ...options});
  return asserter.toSource(parse(src, parserOptions));
}
function testNewConstraintExpandsWithTsExpander() {
  // A construct-signature constraint reaches the emitted templates as a type
  // tree (not source text), so the runtime validates classes instead of
  // failing `unchecked`. Needs the TS expander, like the real pipeline uses.
  const out = convert('/** @template {new (...args: any[]) => any} T */\nclass Pool {\n /**\n  * @param {T} constructorFunc - The constructor.\n  * @param {number} size - The size.\n  */\n constructor(constructorFunc, size) {\n  this._c = constructorFunc;\n }\n}');
  return out.includes('"type": "new"') && !out.includes('"T": "new (...args: any[]) => any"');
}
function testUnionConstraintExpands() {
  // Same expansion for union constraints: members arrive parsed.
  const out = convert('/** @template {string | number} T */\nclass Box {\n /**\n  * @param {T} value - The value.\n  */\n constructor(value) {\n  this._v = value;\n }\n}');
  return out.includes('"type": "union"');
}
function testDepFreeKeepsPassthrough() {
  // The dependency-free expander cannot parse every shape: unparseable
  // constraints keep today's source-text behavior instead of failing.
  const out = convert('/** @template {new (...args: any[]) => any} T */\nclass Pool {\n /**\n  * @param {T} constructorFunc - The constructor.\n  */\n constructor(constructorFunc) {\n  this._c = constructorFunc;\n }\n}', {expandType: expandTypeDepFree});
  return out.includes('"T": "new (...args: any[]) => any"');
}
function testBareTemplateStaysAny() {
  // Unconstrained templates still stand in as `any`.
  const out = convert('/** @template K */\nclass Box {\n /**\n  * @param {K} value - The value.\n  */\n constructor(value) {\n  this._v = value;\n }\n}');
  return out.includes('"K": "any"');
}
function testDefaultConstraintExpands() {
  // `[K=string]` defaults expand like constraints do.
  const out = convert('/** @template [K=string] */\nclass Box {\n /**\n  * @param {K} value - The value.\n  */\n constructor(value) {\n  this._v = value;\n }\n}');
  return out.includes('"K": "string"');
}
export const tests = [
  testNewConstraintExpandsWithTsExpander,
  testUnionConstraintExpands,
  testDepFreeKeepsPassthrough,
  testBareTemplateStaysAny,
  testDefaultConstraintExpands,
];
