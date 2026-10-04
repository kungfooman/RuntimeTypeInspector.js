import {substituteIndexSignature} from './substituteIndexSignature.js';
const noop = () => undefined;
// We want: the index type of an index signature substitutes, because it is
// the value type of the signature.
function testIndexSignatureType() {
  return JSON.stringify(substituteIndexSignature({type: 'indexSignature', indexType: 'K'}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'indexSignature', indexType: '"a"'});
}
// We want: the index parameters substitute, because they are descriptors
// with their own .type positions.
function testIndexSignatureParams() {
  const input = {type: 'indexSignature', indexType: 'string', indexParameters: [{type: 'K', name: 'k'}]};
  return JSON.stringify(substituteIndexSignature(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'indexSignature', indexType: 'string', indexParameters: [{type: '"a"', name: 'k'}]});
}
// We want: an index signature with no matching key is returned by identity,
// so unchanged subtrees keep their identity for downstream memos.
function testIndexSignatureUnchanged() {
  const input = {type: 'indexSignature', indexType: 'string'};
  return substituteIndexSignature(input, 'K', '"a"', noop) === input;
}
const tests = [
  testIndexSignatureType,
  testIndexSignatureParams,
  testIndexSignatureUnchanged,
];
export {tests};
