import {substituteDescriptors} from './substituteDescriptors.js';
const noop = () => undefined;
// We want: a parameter descriptor substitutes its .paramType position, because
// that is the only type-bearing field of a descriptor.
function testDescriptorsType() {
  const input = [{
    type: 'parameter',
    paramType: 'K',
    name: 'x',
  }];
  const actual = JSON.stringify(substituteDescriptors(input, 'K', '"a"', noop));
  const expected = JSON.stringify([{
    type: 'parameter',
    paramType: '"a"',
    name: 'x',
  }]);
  return actual === expected;
}
// We want: a descriptor list with no matching key is returned by identity,
// so unchanged subtrees keep their identity for downstream memos.
function testDescriptorsUnchanged() {
  const input = [{
    type: 'parameter',
    paramType: 'number',
    name: 'x',
  }];
  return substituteDescriptors(input, 'K', '"a"', noop) === input;
}
// We want: multiple descriptors each substitute independently, because each
// parameter is a separate type position.
function testDescriptorsMultiple() {
  const input = [{
    type: 'parameter',
    paramType: 'K',
    name: 'a',
  }, {
    type: 'parameter',
    paramType: 'K',
    name: 'b',
  }];
  const actual = JSON.stringify(substituteDescriptors(input, 'K', '"a"', noop));
  const expected = JSON.stringify([{
    type: 'parameter',
    paramType: '"a"',
    name: 'a',
  }, {
    type: 'parameter',
    paramType: '"a"',
    name: 'b',
  }]);
  return actual === expected;
}
// We want: a descriptor without a .paramType field is left untouched, because
// there is no type position to substitute.
function testDescriptorsNoType() {
  const input = [{
    name: 'x',
  }];
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
