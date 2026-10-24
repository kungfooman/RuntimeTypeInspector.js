import {expandType} from './expandType.js';
import {expandTypeBabelTS} from './expandTypeBabelTS.js';
import {expandTypeDepFree} from './expandTypeDepFree.js';
import {validateType} from '../src-runtime/validateType.js';
const warn = () => undefined;
function assertParity(type) {
  const fromTS = expandType(type);
  const fromBabel = expandTypeBabelTS(type);
  const fromDepFree = expandTypeDepFree(type);
  const jsonTS = JSON.stringify(fromTS);
  if (JSON.stringify(fromBabel) !== jsonTS || JSON.stringify(fromDepFree) !== jsonTS) {
    console.warn(`Parity mismatch for '${type}'`, {fromTS, fromBabel, fromDepFree});
    return false;
  }
  return true;
}
function assertTsBabelParity(type) {
  // Two-way parity for shapes expandTypeDepFree does not support (functions,
  // object flags, index signatures, named tuples, template literals): the
  // dep-free parser is a best-effort fallback, not the production path.
  const fromTS = expandType(type);
  const fromBabel = expandTypeBabelTS(type);
  if (JSON.stringify(fromBabel) !== JSON.stringify(fromTS)) {
    console.warn(`TS/Babel parity mismatch for '${type}'`, {fromTS, fromBabel});
    return false;
  }
  return true;
}
function testArrayLikeParity() {
  return assertParity('ArrayLike<number>');
}
function testArrayLikeStringParity() {
  return assertParity('ArrayLike<string>');
}
function testReadonlyArrayParity() {
  return assertParity('ReadonlyArray<number>');
}
function testConcatArrayParity() {
  return assertParity('ConcatArray<string>');
}
function testNodeListOfParity() {
  return assertParity('NodeListOf<number>');
}
function testCustomReferenceParity() {
  return assertParity('MyBox<T>');
}
function testNestedReferenceParity() {
  return assertParity('ArrayLike<ArrayLike<number>>');
}
function testExistingGenericsUnchanged() {
  // Array/Map/Set/Promise must keep their structured forms, not become references.
  for (const type of ['Array<number>', 'Map<string, any>', 'Set<number>', 'Promise<number>']) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testTupleLiteralParity() {
  // Numeric/boolean literals must be numbers/booleans (not strings) on all three parsers.
  for (const type of ['[1, 2, 3]', "['a', 'b']", '[true, false]', '123', 'true']) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testTSQualifiedNameParity() {
  // Qualified names on all three parsers.
  for (const type of ['some.name.space.Array', 'some.name.space.Array<number>', 'typeof some.name']) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testJSDocNullableParity() {
  // Nullable suffix/prefix on all three parsers.
  for (const type of ['number?', '?number', 'Array<number>?', 'string?', 'ArrayLike<number>?']) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testReadonlyUniqueParity() {
  // Stresstest: readonly/`unique` erased, no throws.
  for (const type of ['readonly number[]', 'readonly [1, 2]', 'unique symbol']) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testJSDocNullableValidates() {
  // End-to-end: Babel-parsed `number?` accepts numbers and null, rejects strings.
  const expect = expandTypeBabelTS('number?');
  if (!validateType(1, expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (!validateType(null, expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (validateType('1', expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  return true;
}
function testBabelReferenceValidates() {
  // End-to-end: Babel-parsed ArrayLike<number> must validate like the TS-parsed one.
  const expect = expandTypeBabelTS('ArrayLike<number>');
  if (!validateType([1, 2, 3], expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (validateType([1, 2, '3'], expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  return true;
}
function testMappedModifierParity() {
  // All `-?`/`+?`/`?`/`readonly` spellings must match the TS parser on all three parsers.
  for (const type of [
    '{[K in TaskType]: 123}',
    '{[K in "a"|"b"]: number}',
    '{[K in TaskType]?: 123}',
    '{[K in TaskType]+?: 123}',
    '{[K in TaskType]-?: 123}',
    '{readonly [K in TaskType]: 123}',
    '{-readonly [K in TaskType]: 123}',
    '{+readonly [K in TaskType]: 123}',
    '{readonly [K in TaskType]+?: 123}',
    '{-readonly [K in TaskType]-?: 123}',
  ]) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testMappedAsRemapParity() {
  // `as` key remaps via `nameType`: conditions and intrinsic references.
  for (const type of [
    '{[K in keyof T as K extends string ? K : never]: number}',
    '{[K in keyof T as Uppercase<K & string>]: number}',
    '{[K in keyof T]: number}',
  ]) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testMappedNestedParity() {
  // Dependencies of mapped shapes: conditions, keyof, intersections, indexed access.
  for (const type of [
    'K extends string ? K : never',
    'keyof T',
    'keyof typeof obj',
    'K & string',
    'string & number',
    'T[K]',
    'T["a"]',
  ]) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testFunctionNewParity() {
  // Function and constructor types: Babel builds `{type, name}` params
  // and rest-array wrapping exactly like the TS parser.
  for (const type of [
    '(a: number) => string',
    '(a: number, ...rest: string[]) => void',
    '() => void',
    'new (a: number) => any',
    'new (...args: any[]) => any',
  ]) {
    if (!assertTsBabelParity(type)) {
      return false;
    }
  }
  return true;
}
function testObjectFlagsParity() {
  // Optionality and readonly flags land on the property node, not the key.
  for (const type of [
    '{a?: string, readonly b: number}',
    '{a: string, b?: number}',
  ]) {
    if (!assertTsBabelParity(type)) {
      return false;
    }
  }
  return true;
}
function testIndexSignatureParity() {
  // Index parameters are `{type, name}` nodes, so the runtime can read
  // `params[0].type` for string/number matching.
  for (const type of [
    '{[n: number]: string}',
    '{[k: string]: number}',
  ]) {
    if (!assertTsBabelParity(type)) {
      return false;
    }
  }
  return true;
}
function testNamedTupleParity() {
  // Labels, optionality, and named rest become `tupleMember` nodes.
  for (const type of [
    '[a: string, b?: number]',
    '[first: string, ...rest: number[]]',
    '[...number[]]',
  ]) {
    if (!assertTsBabelParity(type)) {
      return false;
    }
  }
  return true;
}
function testTemplateLiteralParity() {
  // Babel `TemplateLiteral` quasis/expressions become the shared node shape.
  for (const type of [
    '`${A}_id`', // eslint-disable-line no-template-curly-in-string
    '`id`',
  ]) {
    if (!assertTsBabelParity(type)) {
      return false;
    }
  }
  return true;
}
function testJSDocAllParity() {
  // `*` has no Babel AST support; both keep the raw keyword.
  return assertParity('*');
}
function testBabelIndexSignatureValidates() {
  // End-to-end: Babel-parsed `{[n: number]: string}` validates canonical
  // numeric keys and rejects non-numeric ones, like the TS-parsed shape.
  const expect = expandTypeBabelTS('{[n: number]: string}');
  if (!validateType({0: 'a'}, expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (validateType({a: 'x'}, expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  return true;
}
function testBabelNamedTupleValidates() {
  // End-to-end: Babel-parsed `[first: string, ...rest: number[]]` accepts
  // the head plus any number tail, rejects mistyped elements.
  const expect = expandTypeBabelTS('[first: string, ...rest: number[]]');
  if (!validateType(['a', 1, 2], expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (!validateType(['a'], expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (validateType(['a', 'b'], expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  return true;
}
export const tests = [
  testArrayLikeParity,
  testArrayLikeStringParity,
  testReadonlyArrayParity,
  testConcatArrayParity,
  testNodeListOfParity,
  testCustomReferenceParity,
  testNestedReferenceParity,
  testExistingGenericsUnchanged,
  testTupleLiteralParity,
  testTSQualifiedNameParity,
  testJSDocNullableParity,
  testJSDocNullableValidates,
  testReadonlyUniqueParity,
  testBabelReferenceValidates,
  testMappedModifierParity,
  testMappedAsRemapParity,
  testMappedNestedParity,
  testFunctionNewParity,
  testObjectFlagsParity,
  testIndexSignatureParity,
  testNamedTupleParity,
  testTemplateLiteralParity,
  testJSDocAllParity,
  testBabelIndexSignatureValidates,
  testBabelNamedTupleValidates,
];
