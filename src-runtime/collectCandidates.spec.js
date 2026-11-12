import {collectCandidates} from './collectCandidates.js';
import {expandType       } from '../src-transpiler/expandType.js';
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
  return (
    keysOf('x', 'T') === 'T="\\"x\\""' &&
    keysOf(1, 'T') === 'T=1' &&
    keysOf(true, 'T') === 'T=true'
  );
}
// Non-literals yield nothing.
function testNonLiteralsCollectNothing() {
  const fromObject = keysOf({
    a: 1,
  }, 'T');
  return (
    fromObject === '' &&
    keysOf(null, 'T') === '' &&
    keysOf(undefined, 'T') === ''
  );
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
  const parsed = expandType('{a?: T}');
  const input = parsed.properties.a;
  return keysOf('x', input) === 'T="\\"x\\""';
}
// Nested positions contribute: arrays, tuples, objects, index signatures.
function testNestedCollects() {
  const arrayExpect = {
    type: 'array',
    elementType: 'T',
  };
  if (keysOf(['a'], arrayExpect) !== 'T="\\"a\\""') {
    return false;
  }
  const tupleExpect = {
    type: 'tuple',
    elements: ['T', 'T'],
  };
  if (keysOf(['a', 1], tupleExpect) !== 'T="\\"a\\"",T=1') {
    return false;
  }
  const objectValue = {
    sub: 'b',
  };
  const objectExpect = {
    type: 'object',
    properties: {
      sub: 'K',
    },
  };
  if (keysOf(objectValue, objectExpect) !== 'K="\\"b\\""') {
    return false;
  }
  const indexed = {
    type: 'object',
    properties: {},
    indexSignatures: [{
      type: 'indexSignature',
      indexType: 'T',
      indexParameters: [],
    }],
  };
  const indexedValue = {
    a: 'x',
  };
  return keysOf(indexedValue, indexed) === 'T="\\"x\\""';
}
// Record/map values collect; keys never do.
function testRecordCollectsValuesOnly() {
  const recordValue = {
    a: 'x',
  };
  const recordExpect = {
    type: 'record',
    key: 'string',
    val: 'T',
  };
  return keysOf(recordValue, recordExpect) === 'T="\\"x\\""';
}
// Unions collect across constituents; references descend into arguments.
function testUnionAndReferenceCollect() {
  const unionExpect = {
    type: 'union',
    members: ['T', 'null'],
  };
  if (keysOf('x', unionExpect) !== 'T="\\"x\\""') {
    return false;
  }
  const boxExpect = {
    type: 'reference',
    name: 'Box',
    args: ['T'],
  };
  return keysOf('x', boxExpect) === 'T="\\"x\\""';
}
// `NoInfer<T>` blocks its whole subtree.
function testNoInferBlocks() {
  const noInfer = {
    type: 'reference',
    name: 'NoInfer',
    args: ['K'],
  };
  if (keysOf('b', noInfer) !== '') {
    return false;
  }
  const nestedValue = {
    sub: 'b',
  };
  const nestedExpect = {
    type: 'object',
    properties: {
      sub: noInfer,
    },
  };
  return keysOf(nestedValue, nestedExpect) === '';
}
// Deferred positions never infer: indexed access, mappings, conditions,
// keyof/typeof, template literals, functions.
function testDeferredNeverCollect() {
  /** @type {*[]} */
  const deferred = [
    {
      type: 'indexedAccess',
      index: 'K',
      object: 'T',
    },
    {
      type: 'mapping',
      iterable: 'T',
      element: 'J',
      result: 'number',
    },
    {
      type: 'condition',
      checkType: 'K',
      extendsType: 'string',
      trueType: 'K',
      falseType: 'never',
    },
    {
      type: 'keyof',
      argument: 'T',
    },
    {
      type: 'typeof',
      argument: 'T',
    },
    {
      type: 'templateLiteral',
      quasis: ['a', ''],
      types: ['T'],
    },
    {
      type: 'function',
      parameters: [{
        type: 'T',
        name: 'x',
      }],
    },
  ];
  const probe = {
    v: 1,
  };
  return deferred.every((expect) => keysOf('x', expect) === '' && keysOf(probe, expect) === '');
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
