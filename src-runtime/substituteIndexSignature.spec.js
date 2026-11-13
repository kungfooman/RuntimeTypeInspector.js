import {substituteIndexSignature} from './substituteIndexSignature.js';
const noop = () => undefined;
// We want: the index type of an index signature substitutes, because it is
// the value type of the signature.
function testIndexSignatureType() {
  const input = {
    type: 'indexSignature',
    indexType: 'K',
  };
  const actual = JSON.stringify(substituteIndexSignature(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'indexSignature',
    indexType: '"a"',
  });
  return actual === expected;
}
// We want: the index parameters substitute, because they are descriptors
// with their own .type positions.
function testIndexSignatureParams() {
  const input = {
    type: 'indexSignature',
    indexType: 'string',
    indexParameters: [{
      type: 'parameter',
      paramType: 'K',
      name: 'k',
    }],
  };
  const actual = JSON.stringify(substituteIndexSignature(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'indexSignature',
    indexType: 'string',
    indexParameters: [{
      type: 'parameter',
      paramType: '"a"',
      name: 'k',
    }],
  });
  return actual === expected;
}
// We want: an index signature with no matching key is returned by identity,
// so unchanged subtrees keep their identity for downstream memos.
function testIndexSignatureUnchanged() {
  const input = {
    type: 'indexSignature',
    indexType: 'string',
  };
  return substituteIndexSignature(input, 'K', '"a"', noop) === input;
}
const tests = [
  testIndexSignatureType,
  testIndexSignatureParams,
  testIndexSignatureUnchanged,
];
export {tests};
