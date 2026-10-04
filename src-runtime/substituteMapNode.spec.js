import {substituteMapNode} from './substituteMapNode.js';
const noop = () => undefined;
// We want: a map's key and value substitute, because both are type
// positions that may contain the search key.
function testMapNodeKeyVal() {
  return JSON.stringify(substituteMapNode({type: 'map', key: 'K', val: 'string'}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'map', key: '"a"', val: 'string'});
}
// We want: a map with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testMapNodeUnchanged() {
  const input = {type: 'map', key: 'string', val: 'number'};
  return substituteMapNode(input, 'K', '"a"', noop) === input;
}
// We want: nested map key/value substitute recursively, because
// either may itself contain the search key at any depth.
function testMapNodeNested() {
  return JSON.stringify(substituteMapNode({type: 'map', key: 'K', val: {type: 'array', elementType: 'K'}}, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'map', key: '"a"', val: {type: 'array', elementType: '"a"'}});
}
const tests = [
  testMapNodeKeyVal,
  testMapNodeUnchanged,
  testMapNodeNested,
];
export {tests};
