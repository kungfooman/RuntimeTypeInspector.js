import {substituteIndexedAccess} from './substituteIndexedAccess.js';
const noop = () => undefined;
// We want: both the index and the object of an indexed access substitute,
// because a template key may appear in either position.
function testIndexedAccessBoth() {
  const input = {type: 'indexedAccess', object: 'T', index: 'K'};
  return JSON.stringify(substituteIndexedAccess(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'indexedAccess', object: 'T', index: '"a"'});
}
// We want: the object position substitutes when only it matches, because
// the object is a type position just like the index.
function testIndexedAccessObject() {
  const input = {type: 'indexedAccess', object: 'K', index: 'string'};
  return JSON.stringify(substituteIndexedAccess(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'indexedAccess', object: '"a"', index: 'string'});
}
// We want: an indexed access with no matching key is returned by identity,
// so unchanged subtrees keep their identity for downstream memos.
function testIndexedAccessUnchanged() {
  const input = {type: 'indexedAccess', object: 'T', index: 'string'};
  return substituteIndexedAccess(input, 'K', '"a"', noop) === input;
}
const tests = [
  testIndexedAccessBoth,
  testIndexedAccessObject,
  testIndexedAccessUnchanged,
];
export {tests};
