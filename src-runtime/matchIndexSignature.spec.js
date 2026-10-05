import {matchIndexSignature} from './matchIndexSignature.js';
function testStringMatchesAll() {
  // String parameters cover every key, like TypeScript's string index.
  const expect = {type: 'object', indexSignatures: [{type: 'indexSignature', indexType: 'number', indexParameters: [{type: 'string', name: 'k'}]}]};
  return matchIndexSignature(expect, 'a') !== undefined && matchIndexSignature(expect, '0') !== undefined;
}
function testNumberMatchesNumericOnly() {
  // Number parameters cover canonical numeric keys and skip the rest.
  const expect = {type: 'object', indexSignatures: [{type: 'indexSignature', indexType: 'string', indexParameters: [{type: 'number', name: 'n'}]}]};
  if (!matchIndexSignature(expect, '0')) {
    return false;
  }
  if (!matchIndexSignature(expect, '-2')) {
    return false;
  }
  if (!matchIndexSignature(expect, '1.5')) {
    return false;
  }
  if (matchIndexSignature(expect, 'a') !== undefined) {
    return false;
  }
  if (matchIndexSignature(expect, '0x10') !== undefined) {
    return false;
  }
  if (matchIndexSignature(expect, '01') !== undefined) {
    return false;
  }
  return matchIndexSignature(expect, '') === undefined;
}
function testNumericPrefersNumber() {
  // Numeric keys pick the numeric signature when both kinds exist.
  const expect = {type: 'object', indexSignatures: [
    {type: 'indexSignature', indexType: 'number', indexParameters: [{type: 'string', name: 'k'}]},
    {type: 'indexSignature', indexType: 'string', indexParameters: [{type: 'number', name: 'n'}]}
  ]};
  const numeric = matchIndexSignature(expect, '0');
  if (!numeric || numeric.indexType !== 'string') {
    return false;
  }
  const named = matchIndexSignature(expect, 'a');
  return !!named && named.indexType === 'number';
}
function testUnknownShapes() {
  // Missing signatures, unknown nodes and exotic parameters never match, preserving today's path.
  if (matchIndexSignature({type: 'object', properties: {}}, 'a') !== undefined) {
    return false;
  }
  const exotic = {type: 'object', indexSignatures: [{type: 'indexSignature', indexType: 'number', indexParameters: []}]};
  if (matchIndexSignature(exotic, 'a') !== undefined) {
    return false;
  }
  return matchIndexSignature(null, 'a') === undefined;
}
const tests = [
  testStringMatchesAll,
  testNumberMatchesNumericOnly,
  testNumericPrefersNumber,
  testUnknownShapes
];
export {tests};
