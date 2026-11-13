import {substituteKeyof} from './substituteKeyof.js';
const noop = () => undefined;
// We want: the argument of a keyof substitutes, because it is the type
// being queried for keys.
function testKeyofArgument() {
  const input = {
    type: 'keyof',
    argument: 'K',
  };
  const actual = JSON.stringify(substituteKeyof(input, 'K', '"a"', noop));
  const expected = JSON.stringify({
    type: 'keyof',
    argument: '"a"',
  });
  return actual === expected;
}
// We want: a keyof with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testKeyofUnchanged() {
  const input = {
    type: 'keyof',
    argument: 'string',
  };
  return substituteKeyof(input, 'K', '"a"', noop) === input;
}
const tests = [
  testKeyofArgument,
  testKeyofUnchanged,
];
export {tests};
