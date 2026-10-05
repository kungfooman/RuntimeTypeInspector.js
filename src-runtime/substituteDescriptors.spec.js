import {substituteDescriptors} from './substituteDescriptors.js';
const noop = () => undefined;
// We want: a parameter descriptor substitutes its .type position, because
// that is the only type-bearing field of a descriptor.
function testDescriptorsType() {
  return JSON.stringify(substituteDescriptors([{type: 'K', name: 'x'}], 'K', '"a"', noop)) ===
    JSON.stringify([{type: '"a"', name: 'x'}]);
}
// We want: a descriptor list with no matching key is returned by identity,
// so unchanged subtrees keep their identity for downstream memos.
function testDescriptorsUnchanged() {
  const input = [{type: 'number', name: 'x'}];
  return substituteDescriptors(input, 'K', '"a"', noop) === input;
}
// We want: multiple descriptors each substitute independently, because each
// parameter is a separate type position.
function testDescriptorsMultiple() {
  return JSON.stringify(substituteDescriptors([{type: 'K', name: 'a'}, {type: 'K', name: 'b'}], 'K', '"a"', noop)) ===
    JSON.stringify([{type: '"a"', name: 'a'}, {type: '"a"', name: 'b'}]);
}
// We want: a descriptor without a .type field is left untouched, because
// there is no type position to substitute.
function testDescriptorsNoType() {
  const input = [{name: 'x'}];
  return substituteDescriptors(input, 'K', '"a"', noop) === input;
}
// We want: a non-array input is returned as-is, because the handler only
// processes lists — callers must not pass single descriptors.
function testDescriptorsNotArray() {
  return substituteDescriptors(undefined, 'K', '"a"', noop) === undefined;
}
const tests = [
  testDescriptorsType,
  testDescriptorsUnchanged,
  testDescriptorsMultiple,
  testDescriptorsNoType,
  testDescriptorsNotArray,
];
export {tests};
