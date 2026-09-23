import {expandType} from './expandType.js';
import {expandTypeBabelTS} from './expandTypeBabelTS.js';
import {validateType} from '../src-runtime/validateType.js';
const warn = () => undefined;
function assertParity(type) {
  const fromTS = expandType(type);
  const fromBabel = expandTypeBabelTS(type);
  if (JSON.stringify(fromBabel) !== JSON.stringify(fromTS)) {
    console.warn(`Babel parity mismatch for '${type}'`, {fromTS, fromBabel});
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
  testBabelReferenceValidates,
];
