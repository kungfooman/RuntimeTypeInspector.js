import {simplifyType} from './simplifyType.js';
import {simplifyTypeToSource} from './simplifyTypeToSource.js';

function assertSimplify(label, input, expected) {
  const actual = simplifyTypeToSource(input);
  const expectedJson = JSON.stringify(expected, null, 2);
  if (actual !== expectedJson) {
    console.warn(`${label} mismatch`, {actual, expectedJson});
    return false;
  }
  return true;
}

// Empty `properties` are preserved (not deleted): `{type: 'object',
// `properties: {}}` is the `object` keyword and must keep rejecting
// primitives, unlike the bare `{}` literal below.
function testUnionEmptyObjectMember() {
  const input = {
    type: 'union',
    members: ['1', {type: 'object', properties: {}}],
    optional: false
  };
  const expected = {
    type: 'union',
    members: ['1', {type: 'object', properties: {}}],
    optional: false
  };
  return assertSimplify('union empty object member', input, expected);
}

function testUnionOptionalEmptyObjectMember() {
  const input = {
    type: 'union',
    members: [{type: 'object', properties: {}, optional: true}, 'null'],
    optional: false
  };
  const expected = {
    type: 'union',
    members: [{type: 'object', properties: {}, optional: true}, 'null'],
    optional: false
  };
  return assertSimplify('union optional empty object', input, expected);
}

function testArrayEmptyObjectElementType() {
  const input = {
    type: 'array',
    elementType: {type: 'object', properties: {}},
    optional: false
  };
  const expected = {
    type: 'array',
    elementType: {type: 'object', properties: {}},
    optional: false
  };
  return assertSimplify('array empty object elementType', input, expected);
}

function testArrayNestedUnion() {
  const input = {
    type: 'array',
    elementType: {
      type: 'union',
      members: [{type: 'object', properties: {}}, 'null']
    },
    optional: false
  };
  const expected = {
    type: 'array',
    elementType: {
      type: 'union',
      members: [{type: 'object', properties: {}}, 'null']
    },
    optional: false
  };
  return assertSimplify('array nested union', input, expected);
}

function testTupleEmptyObjectElement() {
  const input = {
    type: 'tuple',
    elements: ['null', {type: 'object', properties: {}}],
    optional: false
  };
  const expected = {
    type: 'tuple',
    elements: ['null', {type: 'object', properties: {}}],
    optional: false
  };
  return assertSimplify('tuple empty object element', input, expected);
}

function testTupleMixedEmptyAndNonEmptyObject() {
  const input = {
    type: 'tuple',
    elements: [
      {type: 'object', properties: {}},
      {type: 'object', properties: {a: 'number'}}
    ],
    optional: false
  };
  const expected = {
    type: 'tuple',
    elements: [
      {type: 'object', properties: {}},
      {type: 'object', properties: {a: 'number'}}
    ],
    optional: false
  };
  return assertSimplify('tuple mixed object', input, expected);
}

function testPromiseEmptyObjectElementType() {
  const input = {
    type: 'promise',
    elementType: {type: 'object', properties: {}},
    optional: false
  };
  const expected = {
    type: 'promise',
    elementType: {type: 'object', properties: {}},
    optional: false
  };
  return assertSimplify('promise empty object elementType', input, expected);
}

function testPromiseNestedRecord() {
  const input = {
    type: 'promise',
    elementType: {
      type: 'record',
      key: 'string',
      val: {type: 'object', properties: {}}
    },
    optional: false
  };
  const expected = {
    type: 'promise',
    elementType: {
      type: 'record',
      key: 'string',
      val: {type: 'object', properties: {}}
    },
    optional: false
  };
  return assertSimplify('promise nested record', input, expected);
}

function testRecordEmptyObjectVal() {
  const input = {
    type: 'record',
    key: 'string',
    val: {type: 'object', properties: {}},
    optional: false
  };
  const expected = {
    type: 'record',
    key: 'string',
    val: {type: 'object', properties: {}},
    optional: false
  };
  return assertSimplify('record empty object val', input, expected);
}

function testRecordEmptyObjectKey() {
  const input = {
    type: 'record',
    key: {type: 'object', properties: {}},
    val: 'number',
    optional: false
  };
  const expected = {
    type: 'record',
    key: {type: 'object', properties: {}},
    val: 'number',
    optional: false
  };
  return assertSimplify('record empty object key', input, expected);
}

function testTypeofEmptyObjectArgument() {
  const input = {
    type: 'typeof',
    argument: {type: 'object', properties: {}},
    optional: false
  };
  const expected = {
    type: 'typeof',
    argument: {type: 'object', properties: {}},
    optional: false
  };
  return assertSimplify('typeof empty object argument', input, expected);
}

function testTypeofNestedUnion() {
  const input = {
    type: 'typeof',
    argument: {
      type: 'union',
      members: [{type: 'object', properties: {}}, 'string']
    },
    optional: false
  };
  const expected = {
    type: 'typeof',
    argument: {
      type: 'union',
      members: [{type: 'object', properties: {}}, 'string']
    },
    optional: false
  };
  return assertSimplify('typeof nested union', input, expected);
}

function testTopLevelEmptyObject() {
  const input = {
    type: 'object',
    properties: {},
    optional: false
  };
  const expected = {
    type: 'object',
    properties: {},
    optional: false
  };
  return assertSimplify('top level empty object', input, expected);
}

// The bare shape (no `properties` key) is the `{}` literal and must survive
// emission as a structured object: collapsing it to the `'object'` string
// would erase the distinction the runtime relies on (`{}` accepts every
// non-nullish value, `object` rejects primitives).
function testBareEmptyObjectPreserved() {
  const input = {
    type: 'object',
    optional: false
  };
  const expected = {
    type: 'object',
    optional: false
  };
  return assertSimplify('bare empty object preserved', input, expected);
}

function testTopLevelObjectWithProperties() {
  const input = {
    type: 'object',
    properties: {a: 'number'},
    optional: false
  };
  const expected = {
    type: 'object',
    properties: {a: 'number'},
    optional: false
  };
  return assertSimplify('top level object with properties', input, expected);
}

function testInputNotMutated() {
  const input = {
    type: 'union',
    members: [{type: 'object', properties: {}}],
    optional: false
  };
  const before = JSON.stringify(input);
  simplifyType(input);
  if (JSON.stringify(input) !== before) {
    console.warn('input was mutated');
    return false;
  }
  return true;
}

export const tests = [
  testUnionEmptyObjectMember,
  testUnionOptionalEmptyObjectMember,
  testArrayEmptyObjectElementType,
  testArrayNestedUnion,
  testTupleEmptyObjectElement,
  testTupleMixedEmptyAndNonEmptyObject,
  testPromiseEmptyObjectElementType,
  testPromiseNestedRecord,
  testRecordEmptyObjectVal,
  testRecordEmptyObjectKey,
  testTypeofEmptyObjectArgument,
  testTypeofNestedUnion,
  testTopLevelEmptyObject,
  testBareEmptyObjectPreserved,
  testTopLevelObjectWithProperties,
  testInputNotMutated,
];
