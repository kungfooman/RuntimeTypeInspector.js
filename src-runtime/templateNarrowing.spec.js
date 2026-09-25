import {inspectTypeWithTemplates} from './inspectTypeWithTemplates.js';
import {replaceType} from './replaceType.js';
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
/**
 * Captures the RTI error message posted for a failing check.
 * @param {Function} fn - The failing check to run.
 * @returns {object|undefined} The posted message, if any.
 */
function captureMessage(fn) {
  let posted;
  const origSelf = globalThis.self;
  globalThis.self = {addEventListener: () => {}, postMessage: (msg) => {
    posted = msg;
  }};
  try {
    fn();
    return posted;
  } finally {
    globalThis.self = origSelf;
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
// First candidate wins, widened: `(a: T, b: T)` with `('x', 1)` pins the
// literal `"x"` from `a`, then widens the pin to `string` while warning on
// `b`, matching tsc (symmetric in argument order).
function testFirstPinWins() {
  const templates = {T: 'any'};
  const first = captureWarns(() => inspectTypeWithTemplates('x', 'T', 'loc', 'a', templates));
  if (!first.ret || templates.T !== '"x"') {
    return false;
  }
  const second = captureWarns(() => inspectTypeWithTemplates(1, 'T', 'loc', 'b', templates));
  if (second.ret || templates.T !== 'string') {
    return false;
  }
  const swapped = {T: 'any'};
  captureWarns(() => inspectTypeWithTemplates(1, 'T', 'loc', 'a', swapped));
  const secondSwapped = captureWarns(() => inspectTypeWithTemplates('x', 'T', 'loc', 'b', swapped));
  return swapped.T === 'number' && !secondSwapped.ret;
}
// Nested positions pin when first: `(xs: T[], y: T)` with `(['a'], 1)` pins
// `"a"` from the element, then widens to `string` while warning on `y`,
// matching tsc.
function testNestedFirstPins() {
  const templates = {T: 'any'};
  const first = captureWarns(() => inspectTypeWithTemplates(['a'], {type: 'array', elementType: 'T'}, 'loc', 'x', templates));
  if (!first.ret || templates.T !== '"a"') {
    return false;
  }
  const second = captureWarns(() => inspectTypeWithTemplates(1, 'T', 'loc', 'y', templates));
  return !second.ret && templates.T === 'string';
}
// Bare-then-nested with diverging literals passes when widened: `f('a',
// `{sub: 'b'})` pins `string`, matching tsc.
function testNestedAfterBareWidens() {
  const templates = {K: 'any'};
  const first = captureWarns(() => inspectTypeWithTemplates('a', 'K', 'loc', 'name', templates));
  if (!first.ret) {
    return false;
  }
  const second = captureWarns(() => inspectTypeWithTemplates({sub: 'b'}, {type: 'object', properties: {sub: 'K'}}, 'loc', 'opts', templates));
  return second.ret && second.warnings.length === 0 && templates.K === 'string';
}
// Literal-union constraints union instead of widening: `hD('a', 'b')` with
// `@template {"a"|"b"} K` pins `"a"|"b"`, matching tsc.
function testLiteralUnionConstraint() {
  const templates = {K: {type: 'union', members: ['"a"', '"b"']}};
  const first = captureWarns(() => inspectTypeWithTemplates('a', 'K', 'loc', 'a', templates));
  if (!first.ret || templates.K !== '"a"') {
    return false;
  }
  const second = captureWarns(() => inspectTypeWithTemplates('b', 'K', 'loc', 'b', templates));
  if (!second.ret) {
    return false;
  }
  return JSON.stringify(templates.K) === JSON.stringify({type: 'union', members: ['"a"', '"b"']});
}
// `NoInfer<K>` blocks inference AND keeps the literal: `h('a', {sub: 'b'})`
// with `@template {string} K` warns with `K` still `"a"`, matching tsc.
function testNoInferBlocksAndKeepsLiteral() {
  const noInfer = (arg) => ({type: 'reference', name: 'NoInfer', args: [arg]});
  const shape = () => ({type: 'object', properties: {sub: noInfer('K')}});
  const templates = {K: 'string'};
  const first = captureWarns(() => inspectTypeWithTemplates('a', 'K', 'loc', 'name', templates));
  if (!first.ret || templates.K !== '"a"') {
    return false;
  }
  const bad = captureWarns(() => inspectTypeWithTemplates({sub: 'b'}, shape(), 'loc', 'opts', templates));
  if (bad.ret || templates.K !== '"a"') {
    return false;
  }
  const goodTemplates = {K: 'string'};
  captureWarns(() => inspectTypeWithTemplates('a', 'K', 'loc', 'name', goodTemplates));
  const good = captureWarns(() => inspectTypeWithTemplates({sub: 'a'}, shape(), 'loc', 'opts', goodTemplates));
  if (!good.ret) {
    return false;
  }
  const numTemplates = {K: 'string'};
  captureWarns(() => inspectTypeWithTemplates('a', 'K', 'loc', 'name', numTemplates));
  const num = captureWarns(() => inspectTypeWithTemplates({sub: 1}, shape(), 'loc', 'opts', numTemplates));
  return !num.ret;
}
// Precision is retained where it matters: a pin from a bare occurrence keeps
// later nested occurrences precise (the `addComponent` pattern).
function testNestedStaysPrecise() {
  const templates = {T: '"camera"'};
  const good = captureWarns(() => inspectTypeWithTemplates(['camera'], {type: 'array', elementType: 'T'}, 'loc', 'opts', templates));
  const bad = captureWarns(() => inspectTypeWithTemplates(['light'], {type: 'array', elementType: 'T'}, 'loc', 'opts', templates));
  return good.ret === true && bad.ret === false;
}
// Failure messages are a superset of tsc's: they contain the actual type, the
// expected type and the argument, then keep RTI's deep detail after it.
function testMessageMatchesTscTriple() {
  const msg = captureMessage(() => {
    const templates = {T: 'any'};
    captureWarns(() => inspectTypeWithTemplates('x', 'T', 'loc', 'b', templates));
    inspectTypeWithTemplates(1, 'T', 'loc', 'b', templates);
  });
  if (!msg || !Array.isArray(msg.strings) || !msg.strings.length) {
    return false;
  }
  const summary = msg.strings[0];
  if (!/^Argument of type .* is not assignable to parameter of type .*$/u.test(summary)) {
    return false;
  }
  // tsc for this case reports expected `string`; our line must contain it...
  if (!summary.includes('"string"') && !summary.includes('string')) {
    return false;
  }
  // ...and the RTI deep detail is kept after the summary.
  return msg.strings.length > 1 && msg.name === 'b';
}
export const tests = [
  testOptionalBareInstantiates,
  testOptionalBareOmitted,
  testOptionalUnrelatedSilent,
  testTypeofSilent,
  testIndexSignatureSubstitutes,
  testFirstPinWins,
  testNestedFirstPins,
  testNestedAfterBareWidens,
  testLiteralUnionConstraint,
  testNoInferBlocksAndKeepsLiteral,
  testNestedStaysPrecise,
  testMessageMatchesTscTriple,
];
