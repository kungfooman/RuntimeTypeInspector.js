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
  // Issue #12: qualified names on all three parsers.
  for (const type of ['some.name.space.Array', 'some.name.space.Array<number>', 'typeof some.name']) {
    if (!assertParity(type)) {
      return false;
    }
  }
  return true;
}
function testJSDocNullableParity() {
  // Issue #10: nullable suffix/prefix on all three parsers.
  for (const type of ['number?', '?number', 'Array<number>?', 'string?', 'ArrayLike<number>?']) {
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
  testBabelReferenceValidates,
];
