import {docReaderTS} from './docReaderTS.js';
import {canonicalize} from '../../src-runtime/canonicalize.js';
// A flat comment lowers to one params row with an empty return.
function testFlatCommentLowersRow() {
  const actual = docReaderTS('@param {number} x');
  return (
    actual.params.length === 1 &&
    actual.params[0].name === 'x' &&
    actual.params[0].type === 'number' &&
    actual.overloads.length === 0 &&
    actual.returns === ''
  );
}
// A `@type` comment folds into the return, matching the depfree setter view.
function testTypeCommentFoldsIntoReturn() {
  return docReaderTS('@type {number}').returns === 'number';
}
// An overload comment lowers its signature into the overload entry.
function testOverloadLowersSignature() {
  const actual = docReaderTS('@overload\n@param {string} text\n@returns {string}');
  return (
    actual.overloads.length === 1 &&
    actual.overloads[0].params[0].name === 'text' &&
    actual.overloads[0].returns === 'string'
  );
}
// The whole document is plain JSON data: the round trip is exact.
function testDocumentIsJsonData() {
  const actual = docReaderTS('@template K @param {K} x');
  const revived = JSON.parse(JSON.stringify(actual));
  return JSON.stringify(canonicalize(revived)) === JSON.stringify(canonicalize(actual));
}
export const tests = [testFlatCommentLowersRow, testTypeCommentFoldsIntoReturn, testOverloadLowersSignature, testDocumentIsJsonData];
