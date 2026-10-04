import {substituteRecord} from './substituteRecord.js';
const noop = () => undefined;
// We want: every value of a record substitutes independently, because each
// value is a separate type position.
function testRecordValues() {
  return JSON.stringify(substituteRecord({a: 'K', b: 'number'}, 'K', '"a"', noop)) ===
    JSON.stringify({a: '"a"', b: 'number'});
}
// We want: a record with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testRecordUnchanged() {
  const input = {a: 'number', b: 'string'};
  return substituteRecord(input, 'K', '"a"', noop) === input;
}
// We want: nested record values substitute recursively, because a value
// may itself contain the search key at any depth.
function testRecordNested() {
  return JSON.stringify(substituteRecord({a: {type: 'array', elementType: 'K'}}, 'K', '"a"', noop)) ===
    JSON.stringify({a: {type: 'array', elementType: '"a"'}});
}
// We want: an empty record returns an empty record, because there is
// nothing to substitute.
function testRecordEmpty() {
  return JSON.stringify(substituteRecord({}, 'K', '"a"', noop)) === '{}';
}
// We want: a non-object input is returned as-is, because the handler only
// processes records — callers must not pass single types.
function testRecordNotObject() {
  return substituteRecord(undefined, 'K', '"a"', noop) === undefined;
}
const tests = [
  testRecordValues,
  testRecordUnchanged,
  testRecordNested,
  testRecordEmpty,
  testRecordNotObject,
];
export {tests};
