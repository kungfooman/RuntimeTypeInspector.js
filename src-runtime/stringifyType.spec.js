import {stringifyType} from './stringifyType.js';
import {expandType} from '../src-transpiler/expandType.js';
// Objects with tuple props stringify in TS notation (issue 154).
function testIssue154() {
  const t2 = {
    type: 'object',
    properties: {
      aa: {type: 'tuple', elements: [1, 2, 3, "'aa'", 1, 2, 3]},
      bb: {type: 'tuple', elements: [1, 2, 3, "'bb'", 1, 2, 3]},
      cc: {type: 'tuple', elements: [1, 2, 3, "'cc'", 1, 2, 3]},
    },
    optional: false,
  };
  const str = stringifyType(t2);
  const expected = "{aa: [1, 2, 3, 'aa', 1, 2, 3], bb: [1, 2, 3, 'bb', 1, 2, 3], cc: [1, 2, 3, 'cc', 1, 2, 3]}";
  if (str !== expected) {
    console.warn('stringifyType issue154 mismatch', {str, expected});
    return false;
  }
  return true;
}
// Pretty printing keeps exact whitespace like JSON.stringify with indent.
function testIssue154PrettyNonNormalized() {
  const t2 = {
    type: 'object',
    properties: {
      aa: {type: 'tuple', elements: [1, 2, 3, "'aa'", 1, 2, 3]},
      bb: {type: 'tuple', elements: [1, 2, 3, "'bb'", 1, 2, 3]},
      cc: {type: 'tuple', elements: [1, 2, 3, "'cc'", 1, 2, 3]},
    },
    optional: false,
  };
  // Non-normalized: exact whitespace and newlines matter (like JSON.stringify(data, null, 2))
  const pretty = stringifyType(t2, null, 2);
  const pretty2 = stringifyType(t2, 2);
  const expected = [
    '{',
    '  aa: [',
    '    1,',
    '    2,',
    '    3,',
    "    'aa',",
    '    1,',
    '    2,',
    '    3',
    '  ],',
    '  bb: [',
    '    1,',
    '    2,',
    '    3,',
    "    'bb',",
    '    1,',
    '    2,',
    '    3',
    '  ],',
    '  cc: [',
    '    1,',
    '    2,',
    '    3,',
    "    'cc',",
    '    1,',
    '    2,',
    '    3',
    '  ]',
    '}',
  ].join('\n');
  if (pretty !== expected) {
    console.warn('stringifyType pretty mismatch (null,2)', {pretty, expected});
    return false;
  }
  if (pretty2 !== expected) {
    console.warn('stringifyType pretty mismatch (2)', {pretty2, expected});
    return false;
  }
  // Also verify single-line stays single-line
  const single = stringifyType(t2);
  if (single.includes('\n')) {
    console.warn('stringifyType single should not contain newline');
    return false;
  }
  return true;
}
// Rest annotations in tuples print with spread syntax.
function testRestKept() {
  const str = stringifyType({type: 'tuple', elements: [1, {type: 'rest', annotation: {type: 'tuple', elements: [2, 3]}}]});
  if (str !== '[1, ...[2, 3]]') {
    console.warn('stringifyType rest mismatch', {str});
    return false;
  }
  return true;
}
// Mappings print in mapped-type notation.
function testMapping() {
  const str = stringifyType({type: 'mapping', iterable: 'ObjKeys', element: 'Key', result: 'Key'});
  if (str !== '{[Key in ObjKeys]: Key}') {
    console.warn('stringifyType mapping mismatch', {str});
    return false;
  }
  return true;
}
// Mapping modifiers and as-remaps print in TS notation.
function testMappingModifiers() {
  const str = stringifyType({type: 'mapping', iterable: 'T', element: 'K', result: 'X', question: '-', readonly: '-'});
  if (str !== '{-readonly [K in T]-?: X}') {
    console.warn('stringifyType mapping modifiers mismatch', {str});
    return false;
  }
  const cond = stringifyType({type: 'mapping', iterable: 'T', element: 'K', result: 'X', nameType: {type: 'condition', checkType: 'K', extendsType: 'string', trueType: 'K', falseType: 'never'}});
  if (cond !== '{[K in T as K extends string?K:never]: X}') {
    console.warn('stringifyType mapping as mismatch', {cond});
    return false;
  }
  return true;
}
// Readonly props print with the readonly keyword.
function testReadonlyProps() {
  const str = stringifyType({type: 'object', properties: {id: {type: 'string', readonly: true}, x: 'number'}});
  if (str !== '{readonly id: string, x: number}') {
    console.warn('stringifyType readonly mismatch', {str});
    return false;
  }
  return true;
}
// Optional atoms print with `?:`, whether the payload is a name, a keyword,
// a tree, a union or a literal: the deleted fast path only handled 2-key
// shapes, so the generic path must carry every payload kind.
function testOptionalAtomPayloads() {
  const cases = [
    ['{camera?: Camera}', '{camera?: Camera}'],
    ['{camera?: string}', '{camera?: string}'],
    ['{opts?: {fov: number}}', '{opts?: {fov: number}}'],
    ['{v?: string | number}', '{v?: string | number}'],
    ['{v?: "a"}', '{v?: "a"}'],
    ['{n?: 42}', '{n?: 42}'],
  ];
  for (const [input, expected] of cases) {
    const str = stringifyType(expandType(input));
    if (str !== expected) {
      console.warn('stringifyType optional atom mismatch', {input, str, expected});
      return false;
    }
  }
  return true;
}
// Required props print with `:`, never `?`: the flag path must not leak.
function testRequiredPrintsBare() {
  const str = stringifyType(expandType('{camera: Camera}'));
  if (str !== '{camera: Camera}') {
    console.warn('stringifyType required mismatch', {str});
    return false;
  }
  return true;
}
// Readonly and optional compose: the prefix prints, then the `?:` marker.
function testReadonlyOptionalComposes() {
  const str = stringifyType(expandType('{readonly camera?: Camera}'));
  if (str !== '{readonly camera?: Camera}') {
    console.warn('stringifyType readonly-optional mismatch', {str});
    return false;
  }
  return true;
}
// Index-signature parameters print as `name: type` from the tagged node.
function testIndexSignatureParams() {
  const str = stringifyType(expandType('{[k: string]: number}'));
  if (str !== '{[k: string]: number}') {
    console.warn('stringifyType index signature mismatch', {str});
    return false;
  }
  const mixed = stringifyType(expandType('{[k: string]: number, len: number}'));
  if (mixed !== '{len: number, [k: string]: number}') {
    console.warn('stringifyType mixed index mismatch', {mixed});
    return false;
  }
  return true;
}
// A non-parameter index entry falls through to the generic path instead of
// printing as `name: type`: the discriminant rejects what the old
// `_.name !== undefined` probe misprinted.
function testIndexSignatureFallback() {
  const str = stringifyType({type: 'indexSignature', indexType: 'number', indexParameters: ['string']});
  if (str !== '[string]: number') {
    console.warn('stringifyType index fallback mismatch', {str});
    return false;
  }
  return true;
}
// Function types print their declared return like constructor types do:
// the expansion carries `ret` since the return-type fix, so the display
// must not keep claiming `any`.
function testFunctionPrintsReturn() {
  const str = stringifyType(expandType('(a: number) => string'));
  if (str !== '(a: number)=>string') {
    console.warn('stringifyType function return mismatch', {str});
    return false;
  }
  const bare = stringifyType({type: 'function', parameters: []});
  if (bare !== '()=>any') {
    console.warn('stringifyType bare function mismatch', {bare});
    return false;
  }
  return true;
}
export const tests = [
  testIssue154,
  testIssue154PrettyNonNormalized,
  testRestKept,
  testMapping,
  testMappingModifiers,
  testReadonlyProps,
  testOptionalAtomPayloads,
  testRequiredPrintsBare,
  testReadonlyOptionalComposes,
  testIndexSignatureParams,
  testIndexSignatureFallback,
  testFunctionPrintsReturn,
];
