import {collectCandidates} from './collectCandidates.js';
/**
 * Collects keys in arrival order for compact assertions. The walker emits
 * every bare site (membership in `templates` is the caller's filter, applied
 * here for readability).
 * @param {*} value - The actual runtime value.
 * @param {*} expect - Unsubstituted expected type.
 * @returns {string} Comma-joined `key=literal` pairs for single-letter keys.
 */
function keysOf(value, expect) {
  return collectCandidates(value, expect)
    .filter((candidate) => /^[A-Z]$/u.test(candidate.key))
    .map((candidate) => `${candidate.key}=${JSON.stringify(candidate.literal)}`).join(',');
}
// Bare occurrences yield the value's literal.
function testBareCollects() {
  return keysOf('x', 'T') === 'T="\\"x\\""' && keysOf(1, 'T') === 'T=1' && keysOf(true, 'T') === 'T=true';
}
// Non-literals yield nothing.
function testNonLiteralsCollectNothing() {
  return keysOf({a: 1}, 'T') === '' && keysOf(null, 'T') === '' && keysOf(undefined, 'T') === '';
}
// Quoted literals and primitive expects are not inference sites; other bare
// names are emitted raw (membership in `templates` is the caller's filter).
function testLiteralsAreNotSites() {
  if (keysOf('x', '"a"') !== '' || keysOf(1, 1) !== '') {
    return false;
  }
  const raw = collectCandidates('x', 'string');
  return raw.length === 1 && raw[0].key === 'string';
}
// Annotated atoms (`@param {T} [a]`) collect through the wrapper.
function testAtomWrapperCollects() {
  return keysOf('x', {type: 'T', optional: true}) === 'T="\\"x\\""';
}
// Nested positions contribute: arrays, tuples, objects, index signatures.
function testNestedCollects() {
  if (keysOf(['a'], {type: 'array', elementType: 'T'}) !== 'T="\\"a\\""') {
    return false;
  }
  if (keysOf(['a', 1], {type: 'tuple', elements: ['T', 'T']}) !== 'T="\\"a\\"",T=1') {
    return false;
  }
  if (keysOf({sub: 'b'}, {type: 'object', properties: {sub: 'K'}}) !== 'K="\\"b\\""') {
    return false;
  }
  const indexed = {type: 'object', properties: {}, indexSignatures: [{type: 'indexSignature', indexType: 'T', indexParameters: []}]};
  return keysOf({a: 'x'}, indexed) === 'T="\\"x\\""';
}
// Record/map values collect; keys never do.
function testRecordCollectsValuesOnly() {
  return keysOf({a: 'x'}, {type: 'record', key: 'string', val: 'T'}) === 'T="\\"x\\""';
}
// Unions collect across constituents; references descend into arguments.
function testUnionAndReferenceCollect() {
  if (keysOf('x', {type: 'union', members: ['T', 'null']}) !== 'T="\\"x\\""') {
    return false;
  }
  return keysOf('x', {type: 'reference', name: 'Box', args: ['T']}) === 'T="\\"x\\""';
}
// `NoInfer<T>` blocks its whole subtree.
function testNoInferBlocks() {
  const noInfer = {type: 'reference', name: 'NoInfer', args: ['K']};
  if (keysOf('b', noInfer) !== '') {
    return false;
  }
  return keysOf({sub: 'b'}, {type: 'object', properties: {sub: noInfer}}) === '';
}
// Deferred positions never infer: indexed access, mappings, conditions,
// keyof/typeof, template literals, functions.
function testDeferredNeverCollect() {
  /** @type {*[]} */
  const deferred = [
    {type: 'indexedAccess', index: 'K', object: 'T'},
    {type: 'mapping', iterable: 'T', element: 'J', result: 'number'},
    {type: 'condition', checkType: 'K', extendsType: 'string', trueType: 'K', falseType: 'never'},
    {type: 'keyof', argument: 'T'},
    {type: 'typeof', argument: 'T'},
    {type: 'templateLiteral', quasis: ['a', ''], types: ['T']},
    {type: 'function', parameters: [{type: 'T', name: 'x'}]},
  ];
  return deferred.every((expect) => keysOf('x', expect) === '' && keysOf({v: 1}, expect) === '');
}
export const tests = [
  testBareCollects,
  testNonLiteralsCollectNothing,
  testLiteralsAreNotSites,
  testAtomWrapperCollects,
  testNestedCollects,
  testRecordCollectsValuesOnly,
  testUnionAndReferenceCollect,
  testNoInferBlocks,
  testDeferredNeverCollect,
];
