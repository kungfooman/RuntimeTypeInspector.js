import {substituteRecordNode} from './substituteRecordNode.js';
const noop = () => undefined;
// We want: a record's key and value substitute, because both are type
// positions that may contain the search key.
function testRecordNodeKeyVal() {
  const input = {
    type: 'record',
    key: 'K',
    val: 'string',
  };
  const actual = JSON.stringify(substituteRecordNode(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'record',
    key: '"a"',
    val: 'string',
  });
  return actual === expected;
}
// We want: a record with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testRecordNodeUnchanged() {
  const input = {
    type: 'record',
    key: 'string',
    val: 'number',
  };
  return substituteRecordNode(input, 'K', '"a"', noop) === input;
}
// We want: nested record key/value substitute recursively, because
// either may itself contain the search key at any depth.
function testRecordNodeNested() {
  const input = {
    type: 'record',
    key: 'K',
    val: {
      type: 'array',
      elementType: 'K',
    },
  };
  const actual = JSON.stringify(substituteRecordNode(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'record',
    key: '"a"',
    val: {
      type: 'array',
      elementType: '"a"',
    },
  });
  return actual === expected;
}
const tests = [
  testRecordNodeKeyVal,
  testRecordNodeUnchanged,
  testRecordNodeNested,
];
export {tests};
