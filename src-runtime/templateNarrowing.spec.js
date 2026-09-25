import {inspectTypeWithTemplates} from './inspectTypeWithTemplates.js';
import {replaceType} from './replaceType.js';
const silent = () => undefined;
/**
 * Runs `fn` with `console.warn` stubbed, returning collected warnings.
 * `inspectTypeWithTemplates` wires `console.warn` into `replaceType`
 * internally, so silence can only be asserted by intercepting it.
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
// Optional bare template params instantiate: `@param {T} [a]` with a valid
// value must pass silently (used to warn `unchecked` + `@todo unhandled`).
function testOptionalBareInstantiates() {
  const templates = {T: 'any'};
  const {ret, warnings} = captureWarns(() => inspectTypeWithTemplates('x', {type: 'T', optional: true}, 'f', 'a', templates));
  return ret === true && warnings.length === 0 && templates.T === '"x"';
}
// Omitted optional bare params pass without poisoning the template.
function testOptionalBareOmitted() {
  const templates = {T: 'any'};
  const {ret, warnings} = captureWarns(() => inspectTypeWithTemplates(undefined, {type: 'T', optional: true}, 'f', 'a', templates));
  return ret === true && warnings.length === 0 && templates.T === 'any';
}
// Optional non-template params stay silent when an unrelated template exists.
function testOptionalUnrelatedSilent() {
  let warns = 0;
  const noisy = () => warns++;
  const out = replaceType({type: 'string', optional: true}, 'T', 'any', noisy);
  const out2 = replaceType({type: 'MyBox', optional: true}, 'T', 'any', noisy);
  return warns === 0 && out.type === 'string' && out2.type === 'MyBox';
}
// `typeof X` is a value position: never rewritten, never warns.
function testTypeofSilent() {
  let warns = 0;
  const noisy = () => warns++;
  const out = replaceType({type: 'typeof', argument: 'X'}, 'X', 'number', noisy);
  return warns === 0 && out.argument === 'X';
}
// Templates inside index signatures instantiate like properties.
function testIndexSignatureSubstitutes() {
  let warns = 0;
  const noisy = () => warns++;
  const type = {
    type: 'object',
    properties: {},
    indexSignatures: [{type: 'indexSignature', indexType: 'T', indexParameters: [{type: 'string', name: 'k'}]}],
  };
  const out = replaceType(type, 'T', 'number', noisy);
  return warns === 0 && out.indexSignatures[0].indexType === 'number';
}
// Joint inference across bare occurrences: `(a: T, b: T)` with `('x', 1)`
// widens toward the union TypeScript infers instead of warning on `b`.
function testJointInferenceWidens() {
  const templates = {T: 'any'};
  const first = captureWarns(() => inspectTypeWithTemplates('x', 'T', 'loc', 'a', templates));
  if (!first.ret || templates.T !== '"x"') {
    return false;
  }
  const second = captureWarns(() => inspectTypeWithTemplates(1, 'T', 'loc', 'b', templates));
  if (!second.ret || second.warnings.length) {
    return false;
  }
  if (JSON.stringify(templates.T) !== JSON.stringify({type: 'union', members: ['"x"', 1]})) {
    return false;
  }
  // A third literal keeps widening.
  const third = captureWarns(() => inspectTypeWithTemplates('y', 'T', 'loc', 'c', templates));
  return third.ret && templates.T.members.length === 3;
}
// Widening respects the declared constraint: with `@template {string} T`,
// `(a: T, b: T)` called with `('x', 1)` still warns on `b`, like TypeScript.
function testWidenRespectsConstraint() {
  const templates = {T: 'string'};
  const first = captureWarns(() => inspectTypeWithTemplates('x', 'T', 'loc', 'a', templates));
  if (!first.ret || templates.T !== '"x"') {
    return false;
  }
  const second = captureWarns(() => inspectTypeWithTemplates(1, 'T', 'loc', 'b', templates));
  return second.ret === false && templates.T === '"x"';
}
// Narrowed literals with dots stay values: no namespace-rewrite noise when a
// later occurrence reuses the binding.
function testDottedLiteralSilent() {
  const templates = {T: 'any'};
  const first = captureWarns(() => inspectTypeWithTemplates('a.b.c', 'T', 'loc', 'a', templates));
  if (!first.ret || templates.T !== '"a.b.c"') {
    return false;
  }
  const second = captureWarns(() => inspectTypeWithTemplates('a.b.c', 'T', 'loc', 'b', templates));
  return second.ret && second.warnings.length === 0;
}
// Precision is retained where it matters: pinning via a bare occurrence keeps
// later nested occurrences precise (the `addComponent` pattern).
function testNestedStaysPrecise() {
  const templates = {T: 'any'};
  const first = captureWarns(() => inspectTypeWithTemplates('camera', 'T', 'loc', 'name', templates));
  if (!first.ret || templates.T !== '"camera"') {
    return false;
  }
  const good = captureWarns(() => inspectTypeWithTemplates(['camera'], {type: 'array', elementType: 'T'}, 'loc', 'opts', templates));
  const bad = captureWarns(() => inspectTypeWithTemplates(['light'], {type: 'array', elementType: 'T'}, 'loc', 'opts', templates));
  return good.ret === true && bad.ret === false;
}
// Nested positions never narrow (known imprecision, fail-open): `(x: T[], y: T)`
// with `(['a'], 1)` passes while TypeScript would reject `y`.
function testNestedNeverNarrows() {
  const templates = {T: 'any'};
  const {ret} = captureWarns(() => inspectTypeWithTemplates(['a'], {type: 'array', elementType: 'T'}, 'loc', 'x', templates));
  if (!ret || templates.T !== 'any') {
    return false;
  }
  const second = captureWarns(() => inspectTypeWithTemplates(1, 'T', 'loc', 'y', templates));
  return second.ret === true && templates.T === 1;
}
export const tests = [
  testOptionalBareInstantiates,
  testOptionalBareOmitted,
  testOptionalUnrelatedSilent,
  testTypeofSilent,
  testIndexSignatureSubstitutes,
  testJointInferenceWidens,
  testWidenRespectsConstraint,
  testDottedLiteralSilent,
  testNestedStaysPrecise,
  testNestedNeverNarrows,
];
