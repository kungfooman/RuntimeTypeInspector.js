import {runChecks} from './runChecks.js';

// A computed string-literal key keeps the static name: the emitter only
// captures dynamic keys, so the field stays plain and V8 infers the literal.
function testComputedStringLiteralKeepsName() {
  const src = `class Fields {
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    ['literal'] = (value) => typeof value === 'number' ? value : 0;
  }
  const fields = new Fields();
  fields.literal('bad');`;
  return runChecks(src, 'fields', (scope, {hits, posted}) => (
    scope.fields.literal.length === 1 &&
    scope.fields.literal.name === 'literal' &&
    hits.length === 1 &&
    posted[0].loc === 'Fields#\'literal\''
  ));
}

// A numeric key coerces through the object wrapper: the field reports the
// numeric name and validates, with the class-prefixed tuple loc.
function testComputedNumericKeyReportsTupleLoc() {
  const src = `class Fields {
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    [0] = (value) => typeof value === 'number' ? value : 0;
  }
  const fields = new Fields();
  fields[0]('bad');`;
  return runChecks(src, 'fields', (scope, {hits, posted}) => (
    scope.fields[0].length === 1 &&
    scope.fields[0].name === '0' &&
    hits.length === 1 &&
    posted[0].loc === 'Fields#0'
  ));
}

// A side-effecting key expression keeps evaluation order: the expression
// runs once per definition and per instance, and the captured key names
// the stored wrapper after its coerced value.
function testComputedCallKeyCoercesPerInstance() {
  const src = `let reads = 0;
  function key() {
    reads++;
    return 'callKey';
  }
  class Fields {
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    [key()] = (value) => typeof value === 'number' ? value : 0;
  }
  const before = reads;
  const fields = new Fields();
  fields.callKey('bad');`;
  return runChecks(src, 'fields, reads, before', (scope, {hits}) => (
    scope.before === 1 &&
    scope.reads === 3 &&
    scope.fields.callKey.name === 'callKey' &&
    scope.fields.callKey.length === 1 &&
    hits.length === 1
  ));
}

// A template-literal key names the wrapper after its cooked value while the
// violation loc still spells the raw key expression for debuggability.
function testComputedTemplateKeyKeepsCookedName() {
  const src = `class Fields {
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    [\`bent\${'Key'}\`] = (value) => typeof value === 'number' ? value : 0;
  }
  const fields = new Fields();
  fields.bentKey('bad');`;
  const marker = String.fromCharCode(36) + String.fromCharCode(123);
  const expectedLoc = 'Fields#`bent' + marker + "'Key'}`";
  return runChecks(src, 'fields', (scope, {hits, posted}) => (
    scope.fields.bentKey.name === 'bentKey' &&
    scope.fields.bentKey.length === 1 &&
    hits.length === 1 &&
    posted[0].loc === expectedLoc
  ));
}

// A member-expression key reads the property once per evaluation and still
// reports the resolved name on the stored wrapper.
function testComputedMemberKeyResolvesName() {
  const src = `const box = {prop: 'member'};
  class Fields {
    /** @overload @param {number} value @returns {number} */
    /** @param {number|string} value */
    [box.prop] = (value) => typeof value === 'number' ? value : 0;
  }
  const fields = new Fields();
  fields.member('bad');`;
  return runChecks(src, 'fields', (scope, {hits, posted}) => (
    scope.fields.member.name === 'member' &&
    scope.fields.member.length === 1 &&
    hits.length === 1 &&
    posted[0].loc === 'Fields#box.prop'
  ));
}

export const tests = [
  testComputedStringLiteralKeepsName,
  testComputedNumericKeyReportsTupleLoc,
  testComputedCallKeyCoercesPerInstance,
  testComputedTemplateKeyKeepsCookedName,
  testComputedMemberKeyResolvesName,
];
