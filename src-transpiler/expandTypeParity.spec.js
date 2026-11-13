import {expandType       } from './expandType.js';
import {expandTypeBabelTS} from './expandTypeBabelTS.js';
import {expandTypeDepFree} from './expandTypeDepFree.js';
import {validateType     } from '../src-runtime/validateType.js';
import {deepEqualType    } from '../src-runtime/deepEqualType.js';
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
  const generics = ['Array<number>', 'Map<string, any>', 'Set<number>', 'Promise<number>'];
  for (const type of generics) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testTupleLiteralParity() {
  // Numeric/boolean literals must be numbers/booleans (not strings) on all three parsers.
  const literals = ['[1, 2, 3]', "['a', 'b']", '[true, false]', '123', 'true'];
  for (const type of literals) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testTSQualifiedNameParity() {
  // Qualified names on all three parsers.
  const qualified = ['some.name.space.Array', 'some.name.space.Array<number>', 'typeof some.name'];
  for (const type of qualified) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testJSDocNullableParity() {
  // Nullable suffix/prefix on all three parsers.
  const nullables = ['number?', '?number', 'Array<number>?', 'string?', 'ArrayLike<number>?'];
  for (const type of nullables) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testReadonlyUniqueParity() {
  // Stresstest: readonly/`unique` erased, no throws.
  const erased = ['readonly number[]', 'readonly [1, 2]', 'unique symbol'];
  for (const type of erased) {
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
  const modifiers = [
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
  ];
  for (const type of modifiers) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testMappedAsRemapParity() {
  // `as` key remaps via `nameType`: conditions and intrinsic references.
  const remaps = [
    '{[K in keyof T as K extends string ? K : never]: number}',
    '{[K in keyof T as Uppercase<K & string>]: number}',
    '{[K in keyof T]: number}',
  ];
  for (const type of remaps) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testMappedNestedParity() {
  // Dependencies of mapped shapes: conditions, keyof, intersections, indexed access.
  const nested = [
    'K extends string ? K : never',
    'keyof T',
    'keyof typeof obj',
    'K & string',
    'string & number',
    'T[K]',
    'T["a"]',
  ];
  for (const type of nested) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testFunctionNewParity() {
  // Function and constructor types: Babel builds tagged parameter nodes
  // and rest-array wrapping exactly like the TS parser.
  const signatures = [
    '(a: number) => string',
    '(a: number, ...rest: string[]) => void',
    '() => void',
    'new (a: number) => any',
    'new (...args: any[]) => any',
  ];
  for (const type of signatures) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testObjectFlagsParity() {
  // Optionality and readonly flags land on the property node, not the key.
  const flagged = [
    '{a?: string, readonly b: number}',
    '{a: string, b?: number}',
  ];
  for (const type of flagged) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testIndexSignatureParity() {
  // Index parameters are tagged `parameter` nodes, so the runtime can read
  // `params[0].paramType` for string/number matching.
  const signatures = [
    '{[n: number]: string}',
    '{[k: string]: number}',
  ];
  for (const type of signatures) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testNamedTupleParity() {
  // Labels, optionality, and named rest become `tupleMember` nodes.
  const tuples = [
    '[a: string, b?: number]',
    '[first: string, ...rest: number[]]',
    '[...number[]]',
  ];
  for (const type of tuples) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testTemplateLiteralParity() {
  // Babel `TemplateLiteral` quasis/expressions become the shared node shape.
  const templates = [
    '`${A}_id`', // eslint-disable-line no-template-curly-in-string
    '`id`',
  ];
  for (const type of templates) {
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
  const rightEntry = {
    0: 'a',
  };
  const passesRight = validateType(rightEntry, expect, 'test', 'a', true, warn, 0);
  const wrongEntry = {
    a: 'x',
  };
  const acceptsWrong = validateType(wrongEntry, expect, 'test', 'a', true, warn, 0);
  if (passesRight === false || acceptsWrong) {
    return false;
  }
  return true;
}
function testBabelNamedTupleValidates() {
  // End-to-end: Babel-parsed `[first: string, ...rest: number[]]` accepts
  // the head plus any number tail, rejects mistyped elements.
  const expect = expandTypeBabelTS('[first: string, ...rest: number[]]');
  const passesFull = validateType(['a', 1, 2], expect, 'test', 'a', true, warn, 0);
  const passesHead = validateType(['a'], expect, 'test', 'a', true, warn, 0);
  const acceptsWrongTail = validateType(['a', 'b'], expect, 'test', 'a', true, warn, 0);
  if (passesFull === false || passesHead === false || acceptsWrongTail) {
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
  const passesPair = validateType(['a', 1], expect, 'test', 'a', true, warn, 0);
  const passesSingle = validateType(['a'], expect, 'test', 'a', true, warn, 0);
  const acceptsWrongTail = validateType(['a', 'b'], expect, 'test', 'a', true, warn, 0);
  const acceptsBare = validateType('a', expect, 'test', 'a', true, warn, 0);
  if (passesPair === false || passesSingle === false || acceptsWrongTail || acceptsBare) {
    return false;
  }
  return true;
}
function testMissBecomesAnyParity() {
  // Unrepresentable innards default to `any`, matching tsc leniency
  // (`?` is `any` there too): no shape ever embeds undefined. Babel cannot
  // parse `?` at all (pre-existing babel/babel#16073), so this pins the two
  // parsers that can; tsc agreement for the same inputs lives in
  // test/parity/cases/unparseable-innards.mjs. Bare `?` (missing or empty
  // operand) is `any` itself, not a null-union.
  const exact = {
    '?': 'any',
    'Array<?>': {
      type: 'array',
      elementType: 'any',
    },
    'Promise<?>': {
      type: 'promise',
      elementType: 'any',
    },
    'Set<?>': {
      type: 'set',
      elementType: 'any',
    },
    'Map<?, number>': {
      type: 'map',
      key: 'any',
      val: 'number',
    },
    'Record<?, number>': {
      type: 'record',
      key: 'any',
      val: 'number',
    },
    'keyof ?': {
      type: 'keyof',
      argument: 'any',
    },
    '{a: ?}': {
      type: 'object',
      properties: {
        a: 'any',
      },
    },
    'string | ?': {
      type: 'union',
      members: ['string', 'any'],
    },
    '(a: ?) => string': {
      type: 'function',
      parameters: [{
        type: 'parameter',
        paramType: 'any',
        name: 'a',
      }],
      ret: 'string',
    },
    'typeof ?': {
      type: 'union',
      members: [{
        type: 'typeof',
        argument: 'any',
      }, 'null'],
    },
  };
  for (const [type, want] of Object.entries(exact)) {
    for (const got of [expandType(type), expandTypeDepFree(type)]) {
      if (!deepEqualType(got, want)) {
        console.warn(`Miss shape wrong for '${type}'`, {got, want});
        return false;
      }
    }
  }
  return true;
}
function testBareUnknownParity() {
  // Covered by testMissBecomesAnyParity's exact shapes now; kept as a
  // behavioral pin: lone `?` must accept everything like tsc's `any`.
  for (const got of [expandType('?'), expandTypeDepFree('?')]) {
    for (const value of [1, 'a', null]) {
      if (validateType(value, got, 'test', 'a', true, warn, 0) !== true) {
        console.warn(`Bare-? rejects`, {value});
        return false;
      }
    }
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
  testUnnamedOptionalTupleParity,
  testUnnamedOptionalTupleValidates,
  testMissBecomesAnyParity,
  testBareUnknownParity,
];
