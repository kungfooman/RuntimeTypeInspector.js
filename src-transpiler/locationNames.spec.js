import {parse} from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {Asserter} from './Asserter.js';
import {expandType} from './expandType.js';
/**
 * @param {string} src - Source code with one documented function to convert.
 * @returns {string} Converted code.
 */
function convert(src) {
  const asserter = new Asserter({expandType, addHeader: false, filename: 'test.js'});
  return asserter.toSource(parse(src, parserOptions));
}
const doc2 = '/** @param {number} s - S. @param {number} v - V. */\n';
const doc1 = '/** @param {number} a - A. */\n';
function testObjectMethodOwner() {
  // Object-literal methods report their owner, not the bare method name.
  const out = convert(`const BitPacking = {\n${doc2}set(s, v) {\nreturn s;\n},\n};`);
  return out.includes(`'BitPacking.set', 's'`) && out.includes(`'BitPacking.set', 'v'`);
}
function testObjectPropertyFunctionOwner() {
  // Anonymous `name: function` values report the property plus the owner.
  const out = convert(`const o = {\n${doc1}fn: function (a) {\nreturn a;\n},\n};`);
  return out.includes(`'o.fn', 'a'`);
}
function testNestedObjectPath() {
  // Nested literals extend the path from the declared binding.
  const out = convert(`const o = {\nnested: {\n${doc1}deep(a) {\nreturn a;\n},\n},\n};`);
  return out.includes(`'o.nested.deep', 'a'`);
}
function testComputedKeyBrackets() {
  // Computed keys stay in brackets so the emitted call stays valid syntax.
  const out = convert(`const o = {\n${doc1}[k](a) {\nreturn a;\n},\n};`);
  return out.includes(`'o[k]', 'a'`);
}
function testExoticKeyQuoted() {
  // Exotic keys render bracket-quoted and keep the output valid syntax.
  const out = convert(`const o = {\n${doc1}'a-b'(a) {\nreturn a;\n},\n};`);
  return out.includes(`'o["a-b"]', 'a'`);
}
function testNumericKeyBrackets() {
  // Numeric keys render bracket-quoted too.
  const out = convert(`const o = {\n${doc1}0(a) {\nreturn a;\n},\n};`);
  return out.includes(`'o["0"]', 'a'`);
}
function testStaticMethodDot() {
  // Static members use a dot, mirroring how they are accessed.
  const out = convert(`class C {\n${doc1}static make(a) {\nreturn a;\n}\n}`);
  return out.includes(`'C.make', 'a'`);
}
function testInstanceMethodHash() {
  // Instance members keep the hash separator.
  const out = convert(`class C {\n${doc1}take(a) {\nreturn a;\n}\n}`);
  return out.includes(`'C#take', 'a'`);
}
function testStaticPrivateDot() {
  // Static private members join the class with a dot before the `#name`.
  const out = convert(`class C {\n${doc1}static #q(a) {\nreturn a;\n}\n}`);
  return out.includes(`'C.#q', 'a'`);
}
function testConstructorHash() {
  // Constructors are instance side and keep the hash.
  const out = convert(`class C {\n${doc1}constructor(a) {\nthis.a = a;\n}\n}`);
  return out.includes(`'C#constructor', 'a'`);
}
function testAnonymousClassDeclarator() {
  // Anonymous class expressions borrow the direct declarator binding.
  const out = convert(`const A = class {\n${doc1}test(a) {\nreturn a;\n}\n};`);
  return out.includes(`'A#test', 'a'`);
}
function testAnonymousClassBare() {
  // Without a direct binding there is no owner, so the bare name survives.
  const out = convert(`export default class {\n${doc1}test(a) {\nreturn a;\n}\n};`);
  return out.includes(`'test', 'a'`) && !out.includes('#test') && !out.includes('.test');
}
function testPrototypeAssignHash() {
  // `Object.assign(X.prototype, ...)` members are instance members of X.
  const out = convert(`Object.assign(P.prototype, {\n${doc1}resolve(a) {\nreturn a;\n},\n});`);
  return out.includes(`'P#resolve', 'a'`);
}
function testReturnedObjectBare() {
  // Returned literals have no owner: the method outlives any binding.
  const out = convert(`function f() {\nreturn {\n${doc1}m(a) {\nreturn a;\n},\n};\n}`);
  return out.includes(`'m', 'a'`) && !out.includes('.m');
}
function testPassedObjectBare() {
  // Passed literals have no owner either.
  const out = convert(`foo({\n${doc1}m(a) {\nreturn a;\n},\n});`);
  return out.includes(`'m', 'a'`) && !out.includes('.m');
}
function testArrowPropertyOwner() {
  // Arrow values report the property plus the owner, like functions do.
  const out = convert(`const o = {\n${doc1}arrow: (a) => a,\n};`);
  return out.includes(`'o.arrow', 'a'`);
}
function testDeepNesting() {
  // Three levels of nesting extend the path from the declared binding.
  const out = convert(`const api = { users: { admin: { ${doc1}fetch(a) { return a; } } } };`);
  return out.includes(`'api.users.admin.fetch', 'a'`);
}
function testExportConstOwner() {
  // `export const` still exposes the declarator binding as the owner.
  const out = convert(`export const o = { ${doc1}m(a) { return a; } };`);
  return out.includes(`'o.m', 'a'`);
}
function testPrototypeDirectHash() {
  // Direct `P.prototype = {...}` members are instance members of P.
  const out = convert(`function P() {} P.prototype = { ${doc1}m(a) { return a; } };`);
  return out.includes(`'P#m', 'a'`);
}
function testNamedNestedClass() {
  // A named class returned from a function keeps its own class name.
  const out = convert(`function f() { return class Inner { ${doc1}fresh(a) { return a; } }; }`);
  return out.includes(`'Inner#fresh', 'a'`);
}
function testThisAssignmentBare() {
  // `this.o = {...}` has no lexical owner, so the bare key survives.
  const out = convert(`class C { constructor() { this.o = { ${doc1}m(a) { return a; } }; } }`);
  return out.includes(`'m', 'a'`) && !out.includes('.m') && !out.includes('#m');
}
function testApostropheKeyQuoted() {
  // Keys with single quotes encode as unicode escapes, never raw.
  const out = convert(`const o = { ${doc1}"ap's"(a) { return a; } };`);
  return out.includes(`'o["ap\\u0027s"]', 'a'`);
}
function testUnicodeKeyQuoted() {
  // Non-ASCII keys render bracket-quoted and keep the output valid.
  const out = convert(`const o = { ${doc1}'caf\u00e9'(a) { return a; } };`);
  return out.includes(`'o["caf\u00e9"]', 'a'`);
}
function testMemberAssignmentTarget() {
  // `a.b = function` names the member path as written in the source.
  const out = convert(`/** @param {number} a - A. @returns {number} R. */\na.b = function (a) { return a; };`);
  return out.includes(`'a.b', 'a'`);
}
function testBareArrowFallback() {
  // Bare callbacks have no binding: the legacy fallback survives.
  const out = convert(`arr.map(${doc1}(a) => a);`);
  return out.includes(`'getName> missing parent for ArrowFunctionExpression', 'a'`);
}
function testPassedPropertyFunctionBare() {
  // Passed `name: function` values keep the bare property key.
  const out = convert(`foo({ ${doc1}m: function (a) { return a; } });`);
  return out.includes(`'m', 'a'`) && !out.includes('.m');
}
function testAssignmentBinding() {
  // `add = function` after a declaration names the assigned binding.
  const out = convert(`let add;\n${doc1}add = function (a) {\nreturn a;\n};`);
  return out.includes(`'add', 'a'`) && !out.includes('unnamed');
}
export const tests = [
  testObjectMethodOwner,
  testObjectPropertyFunctionOwner,
  testNestedObjectPath,
  testComputedKeyBrackets,
  testExoticKeyQuoted,
  testNumericKeyBrackets,
  testStaticMethodDot,
  testInstanceMethodHash,
  testStaticPrivateDot,
  testConstructorHash,
  testAnonymousClassDeclarator,
  testAnonymousClassBare,
  testPrototypeAssignHash,
  testReturnedObjectBare,
  testPassedObjectBare,
  testArrowPropertyOwner,
  testDeepNesting,
  testExportConstOwner,
  testPrototypeDirectHash,
  testNamedNestedClass,
  testThisAssignmentBare,
  testApostropheKeyQuoted,
  testUnicodeKeyQuoted,
  testMemberAssignmentTarget,
  testBareArrowFallback,
  testPassedPropertyFunctionBare,
  testAssignmentBinding,
];
