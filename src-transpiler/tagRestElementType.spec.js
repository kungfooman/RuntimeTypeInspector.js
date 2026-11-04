import {tagRestElementType} from './tagRestElementType.js';
import {deepEqualType} from '../src-runtime/deepEqualType.js';

// The `...T[]` spelling turns variadic over the array's element type.
function testDocumentedRestUnwraps() {
  const actual = tagRestElementType({typeRaw: '...number[]', nameRaw: 'values', invalidRest: false, optional: false, name: 'values'}, {type: 'array', elementType: {type: 'array', elementType: 'number'}});
  return deepEqualType(actual, {elementType: {type: 'array', elementType: 'number'}, dotDot: true});
}

// The bare `...T` spelling turns variadic over the gathered element itself.
function testBareRestKeepsGathered() {
  const actual = tagRestElementType({typeRaw: '...number', nameRaw: 'values', invalidRest: false, optional: false, name: 'values'}, {type: 'array', elementType: 'number'});
  return deepEqualType(actual, {elementType: 'number', dotDot: true});
}

// Nested arrays survive: `...T[][]` varies over the written element type.
function testNestedRestVariesOuter() {
  const actual = tagRestElementType({typeRaw: '...number[][]', nameRaw: 'values', invalidRest: false, optional: false, name: 'values'}, {type: 'array', elementType: {type: 'array', elementType: {type: 'array', elementType: 'number'}}});
  return deepEqualType(actual, {elementType: {type: 'array', elementType: {type: 'array', elementType: 'number'}}, dotDot: true});
}

// Optional rest is the TS2370 error: the member becomes `never`.
function testOptionalRestRejects() {
  const actual = tagRestElementType({typeRaw: '...number[]', nameRaw: '[values]', invalidRest: false, optional: true, name: 'values'}, {type: 'array', elementType: {type: 'array', elementType: 'number'}, optional: false});
  return deepEqualType(actual, {elementType: 'never', dotDot: false});
}

// Without a rest marker the type passes through untouched.
function testPlainParamPassesThrough() {
  const actual = tagRestElementType({typeRaw: 'number[]', nameRaw: 'values', invalidRest: false, optional: false, name: 'values'}, {type: 'array', elementType: 'number'});
  return deepEqualType(actual, {elementType: {type: 'array', elementType: 'number'}, dotDot: false});
}

export const tests = [testDocumentedRestUnwraps, testBareRestKeepsGathered, testNestedRestVariesOuter, testOptionalRestRejects, testPlainParamPassesThrough];
