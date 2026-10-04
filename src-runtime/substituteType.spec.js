import {substituteType} from './substituteType.js';
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
  const atom = substituteType({type: 'K', optional: true}, 'K', '"a"', () => {});
  return same(atom, {type: '"a"', optional: true});
}
function testObjects() {
  // Properties substitute per key; index signatures follow.
  const out = substituteType({type: 'object', properties: {a: 'K', b: 'number'}}, 'K', '"a"', () => {});
  if (!same(out, {type: 'object', properties: {a: '"a"', b: 'number'}})) {
    return false;
  }
  const sig = substituteType({type: 'indexSignature', indexType: 'K'}, 'K', '"a"', () => {});
  return same(sig, {type: 'indexSignature', indexType: '"a"'});
}
function testSequences() {
  // Tuples, arrays and rest annotations substitute element-wise.
  const tuple = substituteType({type: 'tuple', elements: ['K', 'number']}, 'K', '"a"', () => {});
  if (!same(tuple, {type: 'tuple', elements: ['"a"', 'number']})) {
    return false;
  }
  const array = substituteType({type: 'array', elementType: 'K'}, 'K', '"a"', () => {});
  if (!same(array, {type: 'array', elementType: '"a"'})) {
    return false;
  }
  const rest = substituteType({type: 'rest', annotation: 'K'}, 'K', '"a"', () => {});
  if (!same(rest, {type: 'rest', annotation: '"a"'})) {
    return false;
  }
  const literal = substituteType({type: 'templateLiteral', types: ['K', 'x']}, 'K', '"a"', () => {});
  return same(literal, {type: 'templateLiteral', types: ['"a"', 'x']});
}
function testReferencesUnionsIntersections() {
  // Reference args, union/intersection members and template literals.
  const ref = substituteType({type: 'reference', name: 'Box', args: ['K']}, 'K', '"a"', () => {});
  if (!same(ref, {type: 'reference', name: 'Box', args: ['"a"']})) {
    return false;
  }
  const union = substituteType({type: 'union', members: ['K', 'number']}, 'K', '"a"', () => {});
  if (!same(union, {type: 'union', members: ['"a"', 'number']})) {
    return false;
  }
  // The `'fixed' & K` case from the old todo: literal members stay put.
  const inter = substituteType({type: 'intersection', members: ["'fixed'", 'K']}, 'K', '"a"', () => {});
  return same(inter, {type: 'intersection', members: ["'fixed'", '"a"']});
}
function testMappingsRecords() {
  // Mapping substitutes iterable/result (never the bound element), records
  // substitute key and value.
  const shadowed = {type: 'mapping', element: 'K', iterable: 'K', result: 'K'};
  if (substituteType(shadowed, 'K', '"a"', () => {}) !== shadowed) {
    return false;
  }
  const mapped = substituteType({type: 'mapping', element: 'X', iterable: 'K', result: {type: 'array', elementType: 'K'}}, 'K', '"a"', () => {});
  if (!same(mapped, {type: 'mapping', element: 'X', iterable: '"a"', result: {type: 'array', elementType: '"a"'}})) {
    return false;
  }
  const record = substituteType({type: 'record', key: 'K', val: 'number'}, 'K', '"a"', () => {});
  if (!same(record, {type: 'record', key: '"a"', val: 'number'})) {
    return false;
  }
  const map = substituteType({type: 'map', key: 'string', val: 'K'}, 'K', '"a"', () => {});
  return same(map, {type: 'map', key: 'string', val: '"a"'});
}
function testConditionsIndexedKeyof() {
  // Conditions substitute all four branches; indexed access both sides.
  const cond = substituteType({type: 'condition', checkType: 'K', extendsType: 'string', trueType: 'K', falseType: 'never'}, 'K', '"a"', () => {});
  if (!same(cond, {type: 'condition', checkType: '"a"', extendsType: 'string', trueType: '"a"', falseType: 'never'})) {
    return false;
  }
  const indexed = substituteType({type: 'indexedAccess', object: 'K', index: '"a"'}, 'K', 'Box', () => {});
  if (!same(indexed, {type: 'indexedAccess', object: 'Box', index: '"a"'})) {
    return false;
  }
  const keyof = substituteType({type: 'keyof', argument: 'K'}, 'K', 'Box', () => {});
  if (!same(keyof, {type: 'keyof', argument: 'Box'})) {
    return false;
  }
  // `typeof X` names a value: never rewritten, silently.
  const ty = {type: 'typeof', argument: 'K'};
  return substituteType(ty, 'K', '"a"', () => {}) === ty;
}
function testFunctions() {
  // Only `.type` positions of descriptors and returns substitute.
  const fn = substituteType({type: 'function', parameters: [{type: 'K', name: 'a'}]}, 'K', '"a"', () => {});
  if (!same(fn, {type: 'function', parameters: [{type: '"a"', name: 'a'}]})) {
    return false;
  }
  const tupleMember = substituteType({type: 'tupleMember', elementType: 'K'}, 'K', '"a"', () => {});
  if (!same(tupleMember, {type: 'tupleMember', elementType: '"a"'})) {
    return false;
  }
  const cls = substituteType({type: 'class', elementType: 'K'}, 'K', '"a"', () => {});
  return same(cls, {type: 'class', elementType: '"a"'});
}
function testSharingAndDefault() {
  // Unchanged subtrees keep identity (the memoization contract); unknown
  // node kinds warn once and pass through untouched.
  const shared = {type: 'array', elementType: 'number'};
  const tree = {type: 'object', properties: {a: 'K', b: shared}};
  const out = substituteType(tree, 'K', '"a"', () => {});
  if (out === tree || out.properties.b !== shared || out.properties.a !== '"a"') {
    return false;
  }
  if (JSON.stringify(tree) !== JSON.stringify({type: 'object', properties: {a: 'K', b: shared}})) {
    return false;
  }
  let warned = 0;
  const unknown = {type: 'frobnicate', inner: 'K'};
  const kept = substituteType(unknown, 'K', '"a"', () => {
    warned++;
  });
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
