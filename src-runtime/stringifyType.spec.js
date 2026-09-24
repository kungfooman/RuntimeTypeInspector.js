import {stringifyType} from './stringifyType.js';
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
function testRestKept() {
  const str = stringifyType({type: 'tuple', elements: [1, {type: 'rest', annotation: {type: 'tuple', elements: [2, 3]}}]});
  if (str !== '[1, ...[2, 3]]') {
    console.warn('stringifyType rest mismatch', {str});
    return false;
  }
  return true;
}
function testMapping() {
  const str = stringifyType({type: 'mapping', iterable: 'ObjKeys', element: 'Key', result: 'Key'});
  if (str !== '{[Key in ObjKeys]: Key}') {
    console.warn('stringifyType mapping mismatch', {str});
    return false;
  }
  return true;
}
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
export const tests = [
  testIssue154,
  testIssue154PrettyNonNormalized,
  testRestKept,
  testMapping,
  testMappingModifiers,
];
