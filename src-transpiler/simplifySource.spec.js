import {simplifySource} from './simplifySource.js';
function testUnionEmptyObjectMember() {
  const t = {type: 'union', members: ['1', {type: 'object', properties: {}}], optional: false};
  const out = simplifySource(t);
  const expected = {type: 'union', members: ['1', 'object'], optional: false};
  if (JSON.stringify(out) !== JSON.stringify(expected)) {
    console.warn('union empty object member mismatch', {out, expected});
    return false;
  }
  return true;
}
function testUnionOptionalEmptyObjectMember() {
  const t = {type: 'union', members: [{type: 'object', properties: {}, optional: true}, 'null'], optional: false};
  const out = simplifySource(t);
  const expected = {type: 'union', members: [{type: 'object', optional: true}, 'null'], optional: false};
  if (JSON.stringify(out) !== JSON.stringify(expected)) {
    console.warn('union optional empty object mismatch', {out, expected});
    return false;
  }
  return true;
}
function testArrayEmptyObjectElementType() {
  const t = {type: 'array', elementType: {type: 'object', properties: {}}, optional: false};
  const out = simplifySource(t);
  const expected = {type: 'array', elementType: 'object', optional: false};
  if (JSON.stringify(out) !== JSON.stringify(expected)) {
    console.warn('array empty object elementType mismatch', {out, expected});
    return false;
  }
  return true;
}
function testArrayNestedUnion() {
  const t = {type: 'array', elementType: {type: 'union', members: [{type: 'object', properties: {}}, 'null']}, optional: false};
  const out = simplifySource(t);
  const expected = {type: 'array', elementType: {type: 'union', members: ['object', 'null']}, optional: false};
  if (JSON.stringify(out) !== JSON.stringify(expected)) {
    console.warn('array nested union mismatch', {out, expected});
    return false;
  }
  return true;
}
function testTupleEmptyObjectElement() {
  const t = {type: 'tuple', elements: ['null', {type: 'object', properties: {}}], optional: false};
  const out = simplifySource(t);
  const expected = {type: 'tuple', elements: ['null', 'object'], optional: false};
  if (JSON.stringify(out) !== JSON.stringify(expected)) {
    console.warn('tuple empty object element mismatch', {out, expected});
    return false;
  }
  return true;
}
function testTupleMixedEmptyAndNonEmptyObject() {
  const t = {type: 'tuple', elements: [{type: 'object', properties: {}}, {type: 'object', properties: {a: 'number'}}], optional: false};
  const out = simplifySource(t);
  const expected = {type: 'tuple', elements: ['object', {type: 'object', properties: {a: 'number'}}], optional: false};
  if (JSON.stringify(out) !== JSON.stringify(expected)) {
    console.warn('tuple mixed object mismatch', {out, expected});
    return false;
  }
  return true;
}
function testPromiseEmptyObjectElementType() {
  const t = {type: 'promise', elementType: {type: 'object', properties: {}}, optional: false};
  const out = simplifySource(t);
  const expected = {type: 'promise', elementType: 'object', optional: false};
  if (JSON.stringify(out) !== JSON.stringify(expected)) {
    console.warn('promise empty object elementType mismatch', {out, expected});
    return false;
  }
  return true;
}
function testPromiseNestedRecord() {
  const t = {type: 'promise', elementType: {type: 'record', key: 'string', val: {type: 'object', properties: {}}}, optional: false};
  const out = simplifySource(t);
  const expected = {type: 'promise', elementType: {type: 'record', key: 'string', val: 'object'}, optional: false};
  if (JSON.stringify(out) !== JSON.stringify(expected)) {
    console.warn('promise nested record mismatch', {out, expected});
    return false;
  }
  return true;
}
function testRecordEmptyObjectVal() {
  const t = {type: 'record', key: 'string', val: {type: 'object', properties: {}}, optional: false};
  const out = simplifySource(t);
  const expected = {type: 'record', key: 'string', val: 'object', optional: false};
  if (JSON.stringify(out) !== JSON.stringify(expected)) {
    console.warn('record empty object val mismatch', {out, expected});
    return false;
  }
  return true;
}
function testRecordEmptyObjectKey() {
  const t = {type: 'record', key: {type: 'object', properties: {}}, val: 'number', optional: false};
  const out = simplifySource(t);
  const expected = {type: 'record', key: 'object', val: 'number', optional: false};
  if (JSON.stringify(out) !== JSON.stringify(expected)) {
    console.warn('record empty object key mismatch', {out, expected});
    return false;
  }
  return true;
}
function testTypeofEmptyObjectArgument() {
  const t = {type: 'typeof', argument: {type: 'object', properties: {}}, optional: false};
  const out = simplifySource(t);
  const expected = {type: 'typeof', argument: 'object', optional: false};
  if (JSON.stringify(out) !== JSON.stringify(expected)) {
    console.warn('typeof empty object argument mismatch', {out, expected});
    return false;
  }
  return true;
}
function testTypeofNestedUnion() {
  const t = {type: 'typeof', argument: {type: 'union', members: [{type: 'object', properties: {}}, 'string']}, optional: false};
  const out = simplifySource(t);
  const expected = {type: 'typeof', argument: {type: 'union', members: ['object', 'string']}, optional: false};
  if (JSON.stringify(out) !== JSON.stringify(expected)) {
    console.warn('typeof nested union mismatch', {out, expected});
    return false;
  }
  return true;
}
function testTopLevelEmptyObject() {
  const t = {type: 'object', properties: {}, optional: false};
  const out = simplifySource(t);
  const expected = 'object';
  if (out !== expected) {
    console.warn('top level empty object mismatch', {out, expected});
    return false;
  }
  return true;
}
function testTopLevelObjectWithProperties() {
  const t = {type: 'object', properties: {a: 'number'}, optional: false};
  const out = simplifySource(t);
  const expected = {type: 'object', properties: {a: 'number'}, optional: false};
  if (JSON.stringify(out) !== JSON.stringify(expected)) {
    console.warn('top level object with properties mismatch', {out, expected});
    return false;
  }
  return true;
}
function testInputNotMutated() {
  const t = {type: 'union', members: [{type: 'object', properties: {}}], optional: false};
  simplifySource(t);
  const expected = {type: 'union', members: [{type: 'object', properties: {}}], optional: false};
  if (JSON.stringify(t) !== JSON.stringify(expected)) {
    console.warn('input was mutated', {t, expected});
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
  testTopLevelObjectWithProperties,
  testInputNotMutated,
];
