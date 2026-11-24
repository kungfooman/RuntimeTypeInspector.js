import {parse            } from '@babel/parser';
import {parserOptions    } from './parserOptions.js';
import {Stringifier      } from './Stringifier.js';
import {markFreshCallArgs} from './markFreshCallArgs.js';
/**
 * Applies the wrap to one snippet and returns the emitted source.
 * @param {string} src - Source code to wrap and emit.
 * @returns {string} Emitted source with fresh literals marked.
 */
function wrapped(src) {
  const ast = parse(src, parserOptions);
  markFreshCallArgs(ast);
  return new Stringifier().toSource(ast);
}
// Direct object arguments wrap: tsc excess-checks them.
function testDirectObjectWraps() {
  return wrapped('f({a: 1});').includes('f(markFresh({');
}
// Variables, calls, new and member access stay stale.
function testStaleFormsUntouched() {
  const out = wrapped('f(o, g(), new C(), a.b);');
  return !out.includes('markFresh');
}
// Nested literals wrap per node: outer and inner each mark.
function testNestedLiteralWraps() {
  const ast = parse('f({a: {b: 1}})', parserOptions);
  markFreshCallArgs(ast);
  const inner = ast.program.body[0].expression.arguments[0].arguments[0].properties[0].value;
  return inner.type === 'CallExpression' && inner.callee.name === 'markFresh';
}
// Array arguments wrap, with literal elements wrapped inside.
function testArrayArgumentWraps() {
  const ast = parse('f([{a: 1}, o])', parserOptions);
  markFreshCallArgs(ast);
  const array = ast.program.body[0].expression.arguments[0].arguments[0];
  return array.type === 'ArrayExpression' && array.elements[0].type === 'CallExpression' && array.elements[1].type === 'Identifier';
}
// Guards are not call arguments and stay untouched.
function testGuardsUntouched() {
  const out = wrapped('if (o) {\n  f(o);\n}');
  return !out.includes('markFresh');
}
// Spread literals read as fresh in tsc and wrap with spread tolerance:
// only the literally written keys count, spread keys are forgiven.
function testSpreadLiteralWraps() {
  const out = wrapped('f({...o});');
  return out.includes('f(markFreshSpread({') && out.includes('}, []');
}
// Conditional branches wrap independently.
function testConditionalBranchesWrap() {
  const out = wrapped('f(a ? {b: 1} : {c: 2});');
  return out.includes('? markFresh({') && out.includes(': markFresh({');
}
// Optional calls wrap the same way plain calls do.
function testOptionalCallWraps() {
  return wrapped('f?.({a: 1});').includes('f?.(markFresh({');
}
// New expressions take fresh arguments in tsc too.
function testNewExpressionWraps() {
  return wrapped('new C({a: 1});').includes('new C(markFresh({');
}
// Nested calls pass through: only their literal arguments wrap.
function testNestedCallPassthrough() {
  const out = wrapped('f(g(1), {a: 2});');
  return out.includes('g(1)') && out.includes('markFresh({');
}
// Calls nested inside function bodies wrap: each call site decides its
// own freshness, so a literal inside a body still marks.
function testNestedFunctionBodyWraps() {
  const out = wrapped('function outer() { f({a: 1}); }');
  return out.includes('f(markFresh({');
}
// Assignment expressions wrap their value: `f(v = ...)` is a call site.
function testAssignmentExpressionWraps() {
  const out = wrapped('f(v = {a: 1});');
  return out.includes('markFresh({');
}
// Probe metadata never wraps: it is compiler output, not a user argument.
function testProbeCallUntouched() {
  const out = wrapped("inspectType({a: 1}, 'o', 'l', 'n');");
  return !out.includes('markFresh');
}
// Arrow invocations keep their suffix: emission owns the closers.
function testArrowInvocationSurvives() {
  const out = wrapped('((value = 1) => value)(2);');
  return out.includes('(2);');
}
// Repeated calls stay linear: one visit per node, no rescanning.
function testRepeatedCallsScale() {
  const src = 'takeAwaited(Promise.resolve(1));\n'.repeat(200);
  const began = Date.now();
  const out = wrapped(src);
  return out === new Stringifier().toSource(parse(src, parserOptions)) && Date.now() - began < 5000;
}
export const tests = [
  testDirectObjectWraps,
  testStaleFormsUntouched,
  testNestedLiteralWraps,
  testArrayArgumentWraps,
  testGuardsUntouched,
  testSpreadLiteralWraps,
  testConditionalBranchesWrap,
  testOptionalCallWraps,
  testNewExpressionWraps,
  testNestedCallPassthrough,
  testNestedFunctionBodyWraps,
  testAssignmentExpressionWraps,
  testProbeCallUntouched,
  testArrowInvocationSurvives,
  testRepeatedCallsScale,
];
