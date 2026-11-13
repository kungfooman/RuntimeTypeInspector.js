import {substituteType} from './substituteType.js';
import {expandType    } from '../src-transpiler/expandType.js';
/**
 * Compares structurally (key order from construction is stable).
 * @param {*} actual - The substituted tree.
 * @param {*} expect - The expected tree.
 * @returns {boolean} Structural equality.
 */
function same(actual, expect) {
  return JSON.stringify(actual) === JSON.stringify(expect);
}
function testPrimitivesAndAtoms() {
  // Bare names substitute, everything else passes through untouched.
  const cases = [
    ['K', '"a"', '"a"'],
    ['number', '"a"', 'number'],
    [null, '"a"', null],
  ];
  for (const [type, replace, want] of cases) {
    if (substituteType(type, 'K', replace, () => {}) !== want) {
      return false;
    }
  }
  // Flag-only wrappers substitute inside `.type`.
  const parsed = expandType('{a?: K}');
  const input = parsed.properties.a;
  const atom = substituteType(input, 'K', '"a"', () => {});
  return same(atom, {
    type: 'atom',
    atomType: '"a"',
    optional: true,
  });
}
function testObjects() {
  // Properties substitute per key; index signatures follow.
  const objectInput = {
    type: 'object',
    properties: {
      a: 'K',
      b: 'number',
    },
  };
  const objectWarn = () => {};
  const out = substituteType(objectInput, 'K', '"a"', objectWarn);
  const objectWant = {
    type: 'object',
    properties: {
      a: '"a"',
      b: 'number',
    },
  };
  if (same(out, objectWant) === false) {
    return false;
  }
  const sig = substituteType({
    type: 'indexSignature',
    indexType: 'K',
  }, 'K', '"a"', () => {});
  return same(sig, {
    type: 'indexSignature',
    indexType: '"a"',
  });
}
function testSequences() {
  // Tuples, arrays and rest annotations substitute element-wise.
  const tupleInput = {
    type: 'tuple',
    elements: ['K', 'number'],
  };
  const seqWarn = () => {};
  const tuple = substituteType(tupleInput, 'K', '"a"', seqWarn);
  const tupleWant = {
    type: 'tuple',
    elements: ['"a"', 'number'],
  };
  if (same(tuple, tupleWant) === false) {
    return false;
  }
  const arrayInput = {
    type: 'array',
    elementType: 'K',
  };
  const array = substituteType(arrayInput, 'K', '"a"', seqWarn);
  const arrayWant = {
    type: 'array',
    elementType: '"a"',
  };
  if (same(array, arrayWant) === false) {
    return false;
  }
  const restInput = {
    type: 'rest',
    annotation: 'K',
  };
  const rest = substituteType(restInput, 'K', '"a"', seqWarn);
  const restWant = {
    type: 'rest',
    annotation: '"a"',
  };
  if (same(rest, restWant) === false) {
    return false;
  }
  const literalInput = {
    type: 'templateLiteral',
    types: ['K', 'x'],
  };
  const literal = substituteType(literalInput, 'K', '"a"', seqWarn);
  const literalWant = {
    type: 'templateLiteral',
    types: ['"a"', 'x'],
  };
  return same(literal, literalWant);
}
function testReferencesUnionsIntersections() {
  // Reference args, union/intersection members and template literals.
  const refWarn = () => {};
  const refInput = {
    type: 'reference',
    name: 'Box',
    args: ['K'],
  };
  const ref = substituteType(refInput, 'K', '"a"', refWarn);
  const refWant = {
    type: 'reference',
    name: 'Box',
    args: ['"a"'],
  };
  if (same(ref, refWant) === false) {
    return false;
  }
  const unionInput = {
    type: 'union',
    members: ['K', 'number'],
  };
  const union = substituteType(unionInput, 'K', '"a"', refWarn);
  const unionWant = {
    type: 'union',
    members: ['"a"', 'number'],
  };
  if (same(union, unionWant) === false) {
    return false;
  }
  // The `'fixed' & K` case from the old todo: literal members stay put.
  const interInput = {
    type: 'intersection',
    members: ["'fixed'", 'K'],
  };
  const inter = substituteType(interInput, 'K', '"a"', refWarn);
  const interWant = {
    type: 'intersection',
    members: ["'fixed'", '"a"'],
  };
  return same(inter, interWant);
}
function testMappingsRecords() {
  // Mapping substitutes iterable/result (never the bound element), records
  // substitute key and value.
  const shadowed = {
    type: 'mapping',
    element: 'K',
    iterable: 'K',
    result: 'K',
  };
  if (substituteType(shadowed, 'K', '"a"', () => {}) !== shadowed) {
    return false;
  }
  const mappingInput = {
    type: 'mapping',
    element: 'X',
    iterable: 'K',
    result: {
      type: 'array',
      elementType: 'K',
    },
  };
  const mappingWarn = () => {};
  const mapped = substituteType(mappingInput, 'K', '"a"', mappingWarn);
  const mappedWant = {
    type: 'mapping',
    element: 'X',
    iterable: '"a"',
    result: {
      type: 'array',
      elementType: '"a"',
    },
  };
  if (same(mapped, mappedWant) === false) {
    return false;
  }
  const recordInput = {
    type: 'record',
    key: 'K',
    val: 'number',
  };
  const record = substituteType(recordInput, 'K', '"a"', mappingWarn);
  const recordWant = {
    type: 'record',
    key: '"a"',
    val: 'number',
  };
  if (same(record, recordWant) === false) {
    return false;
  }
  const mapInput = {
    type: 'map',
    key: 'string',
    val: 'K',
  };
  const map = substituteType(mapInput, 'K', '"a"', mappingWarn);
  const mapWant = {
    type: 'map',
    key: 'string',
    val: '"a"',
  };
  return same(map, mapWant);
}
function testConditionsIndexedKeyof() {
  // Conditions substitute all four branches; indexed access both sides.
  const branchWarn = () => {};
  const condInput = {
    type: 'condition',
    checkType: 'K',
    extendsType: 'string',
    trueType: 'K',
    falseType: 'never',
  };
  const cond = substituteType(condInput, 'K', '"a"', branchWarn);
  const condWant = {
    type: 'condition',
    checkType: '"a"',
    extendsType: 'string',
    trueType: '"a"',
    falseType: 'never',
  };
  if (same(cond, condWant) === false) {
    return false;
  }
  const indexedInput = {
    type: 'indexedAccess',
    object: 'K',
    index: '"a"',
  };
  const indexed = substituteType(indexedInput, 'K', 'Box', branchWarn);
  const indexedWant = {
    type: 'indexedAccess',
    object: 'Box',
    index: '"a"',
  };
  if (same(indexed, indexedWant) === false) {
    return false;
  }
  const keyofInput = {
    type: 'keyof',
    argument: 'K',
  };
  const keyof = substituteType(keyofInput, 'K', 'Box', branchWarn);
  const keyofWant = {
    type: 'keyof',
    argument: 'Box',
  };
  if (same(keyof, keyofWant) === false) {
    return false;
  }
  // `typeof X` names a value: never rewritten, silently.
  const ty = {
    type: 'typeof',
    argument: 'K',
  };
  return substituteType(ty, 'K', '"a"', () => {}) === ty;
}
function testFunctions() {
  // Only `.type` positions of descriptors and returns substitute.
  const fnWarn = () => {};
  const fnInput = {
    type: 'function',
    parameters: [{
      type: 'parameter',
      paramType: 'K',
      name: 'a',
    }],
  };
  const fn = substituteType(fnInput, 'K', '"a"', fnWarn);
  const fnWant = {
    type: 'function',
    parameters: [{
      type: 'parameter',
      paramType: '"a"',
      name: 'a',
    }],
  };
  if (same(fn, fnWant) === false) {
    return false;
  }
  const memberInput = {
    type: 'tupleMember',
    elementType: 'K',
  };
  const tupleMember = substituteType(memberInput, 'K', '"a"', fnWarn);
  const memberWant = {
    type: 'tupleMember',
    elementType: '"a"',
  };
  if (same(tupleMember, memberWant) === false) {
    return false;
  }
  const clsInput = {
    type: 'class',
    elementType: 'K',
  };
  const cls = substituteType(clsInput, 'K', '"a"', fnWarn);
  const clsWant = {
    type: 'class',
    elementType: '"a"',
  };
  return same(cls, clsWant);
}
function testSharingAndDefault() {
  // Unchanged subtrees keep identity (the memoization contract); unknown
  // node kinds warn once and pass through untouched.
  const shared = {
    type: 'array',
    elementType: 'number',
  };
  const tree = {
    type: 'object',
    properties: {
      a: 'K',
      b: shared,
    },
  };
  const out = substituteType(tree, 'K', '"a"', () => {});
  if (out === tree || out.properties.b !== shared || out.properties.a !== '"a"') {
    return false;
  }
  const pristine = {
    type: 'object',
    properties: {
      a: 'K',
      b: shared,
    },
  };
  if (JSON.stringify(tree) !== JSON.stringify(pristine)) {
    return false;
  }
  let warned = 0;
  const warnUnknown = () => {
    warned++;
  };
  const unknown = {
    type: 'frobnicate',
    inner: 'K',
  };
  const kept = substituteType(unknown, 'K', '"a"', warnUnknown);
  return kept === unknown && warned === 1;
}
const tests = [
  testPrimitivesAndAtoms,
  testObjects,
  testSequences,
  testReferencesUnionsIntersections,
  testMappingsRecords,
  testConditionsIndexedKeyof,
  testFunctions,
  testSharingAndDefault,
];
export {tests};
