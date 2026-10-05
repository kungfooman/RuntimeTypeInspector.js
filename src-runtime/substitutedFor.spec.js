import {substitutedFor} from './substitutedFor.js';
const noop = () => undefined;
// We want: nested bindings to resolve no matter the dict order, because
// source order may list `@template K` after `@template T`.
// depending on source order (`@template K` may come after `@template T`).
function testNestedOrderIndependent() {
  // `T` constrained to an array of `K`, called with a `K` binding: both
  // insertion orders must yield the fully resolved tree.
  const makeDict = (first) => {
    const dict = {};
    if (first === 'T') {
      dict.T = {type: 'array', elementType: 'K'};
      dict.K = '"a"';
    } else {
      dict.K = '"a"';
      dict.T = {type: 'array', elementType: 'K'};
    }
    return dict;
  };
  const fromTFirst = substitutedFor('T', 'order-t', 'x', makeDict('T'), noop);
  const fromKFirst = substitutedFor('T', 'order-k', 'x', makeDict('K'), noop);
  const want = JSON.stringify({type: 'array', elementType: '"a"'});
  return JSON.stringify(fromTFirst) === want && JSON.stringify(fromKFirst) === want;
}
// We want: a single binding to substitute in one pass like before, because
// nesting needs at least two names and the common case pays no extra walk.
function testSingleBinding() {
  return substitutedFor('K', 'order-single', 'x', {K: '"a"'}, noop) === '"a"';
}
// We want: an expect mentioning no binding to come back by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testUnrelatedSharedIdentity() {
  const expect = {type: 'array', elementType: 'number'};
  return substitutedFor(expect, 'order-ident', 'x', {K: '"a"'}, noop) === expect;
}
const tests = [
  testNestedOrderIndependent,
  testSingleBinding,
  testUnrelatedSharedIdentity,
];
export {tests};
