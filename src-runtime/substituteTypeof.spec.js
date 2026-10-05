import {substituteTypeof} from './substituteTypeof.js';
const noop = () => undefined;
// We want: a typeof type is returned unchanged, because `typeof X` names a
// value, not a type — a same-named template must not rewrite it.
function testTypeofUnchanged() {
  const input = {type: 'typeof', argument: 'X'};
  return substituteTypeof(input, 'X', 'number', noop) === input;
}
// We want: the handler is a no-op even when the argument matches the
// search, because typeof positions are never substituted.
function testTypeofNoMatch() {
  const input = {type: 'typeof', argument: 'X'};
  return substituteTypeof(input, 'X', 'X', noop) === input;
}
const tests = [
  testTypeofUnchanged,
  testTypeofNoMatch,
];
export {tests};
