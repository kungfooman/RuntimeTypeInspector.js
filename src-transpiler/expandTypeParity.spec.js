import {expandType} from './expandType.js';
import {expandTypeBabelTS} from './expandTypeBabelTS.js';
import {expandTypeDepFree} from './expandTypeDepFree.js';
import {validateType} from '../src-runtime/validateType.js';
import {deepEqualType} from '../src-runtime/deepEqualType.js';
const warn = () => undefined;
function assertParity(type) {
  const fromTS = expandType(type);
  const fromBabel = expandTypeBabelTS(type);
  const fromDepFree = expandTypeDepFree(type);
  // Canonical comparison: key order, explicit undefined, and `false`
  // flags never count as differences.
  if (!deepEqualType(fromBabel, fromTS) || !deepEqualType(fromDepFree, fromTS)) {
    console.warn(`Parity mismatch for '${type}'`, {fromTS, fromBabel, fromDepFree});
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
    if (!assertParity(type)) {
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
    if (!assertParity(type)) {
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
    if (!assertParity(type)) {
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
    if (!assertParity(type)) {
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
    if (!assertParity(type)) {
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
function testUnnamedOptionalTupleParity() {
  // Unnamed `?` elements become optional members with an empty label on all
  // three parsers, matching tsc (`[string, (number | undefined)?]`).
  return assertParity('[string, number?]');
}
function testUnnamedOptionalTupleValidates() {
  // End-to-end: the optional member accepts missing tails, rejects bad types.
  const expect = expandTypeDepFree('[string, number?]');
  if (!validateType(['a', 1], expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (!validateType(['a'], expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (validateType(['a', 'b'], expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (validateType('a', expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  return true;
}
function testMissBecomesAnyParity() {
  // Unrepresentable innards default to `any`, matching tsc leniency
  // (`?` is `any` there too): no shape ever embeds undefined. Babel cannot
  // parse `?` at all (pre-existing babel/babel#16073), so this pins the two
  // parsers that can; tsc agreement for the same inputs lives in
  // test/parity/cases/unparseable-innards.mjs.
  const exact = {
    'Array<?>': {type: 'array', elementType: 'any'},
    'Map<?, number>': {type: 'map', key: 'any', val: 'number'},
    '{a: ?}': {type: 'object', properties: {a: 'any'}},
    '(a: ?) => string': {type: 'function', parameters: [{type: 'any', name: 'a'}]},
  };
  for (const [type, want] of Object.entries(exact)) {
    for (const got of [expandType(type), expandTypeDepFree(type)]) {
      if (!deepEqualType(got, want)) {
        console.warn(`Miss shape wrong for '${type}'`, {got, want});
        return false;
      }
    }
  }
  for (const type of [
    'Promise<?>',
    'Set<?>',
    'Record<?, number>',
  ]) {
    const fromTS = expandType(type);
    const fromDepFree = expandTypeDepFree(type);
    if (!deepEqualType(fromTS, fromDepFree)) {
      console.warn(`Parity mismatch for '${type}'`, {fromTS, fromDepFree});
      return false;
    }
  }
  // `string | ?` nests differently (TS binds the nullable to the `?`
  // operand, dep-free lifts it over the whole union) but both shapes
  // accept everything, so behavior agrees while structure does not.
  // The harness (case07) pins the behavioral agreement.
  for (const value of [1, 'a', null, undefined]) {
    const tsAccepts = validateType(value, expandType('string | ?'), 'test', 'a', true, warn, 0);
    const freeAccepts = validateType(value, expandTypeDepFree('string | ?'), 'test', 'a', true, warn, 0);
    if (tsAccepts !== freeAccepts || tsAccepts !== true) {
      console.warn(`Behavior mismatch for 'string | ?' on`, {value, tsAccepts, freeAccepts});
      return false;
    }
  }
  // `keyof ?` / `typeof ?` are file-level syntax errors under tsc, so no
  // oracle constrains them; the parsers read them differently (TS applies
  // the operator first, dep-free reads a nullable bare keyword) and both
  // stay crash-free. Documented, not asserted.
  return true;
}
function testBareUnknownParity() {
  // Lone `?` is `any` on the TS and dep-free parsers (Babel cannot parse it
  // at all, so it stays out of the three-way check); both must agree.
  const fromTS = expandType('?');
  const fromDepFree = expandTypeDepFree('?');
  if (!deepEqualType(fromTS, fromDepFree)) {
    console.warn(`Parity mismatch for '?'`, {fromTS, fromDepFree});
    return false;
  }
  return fromTS === 'any' && fromDepFree === 'any';
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
  testUnnamedOptionalTupleParity,
  testUnnamedOptionalTupleValidates,
  testMissBecomesAnyParity,
  testBareUnknownParity,
];
