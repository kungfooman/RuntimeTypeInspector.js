import {substituteMapping} from './substituteMapping.js';
const noop = () => undefined;
// We want: the iterable and result of a mapping substitute, because both
// are type positions that may contain the search key.
function testMappingIterableResult() {
  const input = {type: 'mapping', iterable: 'T', element: 'k', result: 'K'};
  return JSON.stringify(substituteMapping(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'mapping', iterable: 'T', element: 'k', result: '"a"'});
}
// We want: the optional nameType substitutes when present, because it is
// a type position like any other.
function testMappingNameType() {
  const input = {type: 'mapping', iterable: 'T', element: 'k', result: 'v', nameType: 'K'};
  return JSON.stringify(substituteMapping(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'mapping', iterable: 'T', element: 'k', result: 'v', nameType: '"a"'});
}
// We want: the element binding is shadowed and never substituted, because
// it is the iteration variable — substituting it would produce nonsense.
function testMappingElementShadowed() {
  const input = {type: 'mapping', iterable: 'T', element: 'K', result: 'v'};
  return substituteMapping(input, 'K', '"a"', noop) === input;
}
// We want: a mapping with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testMappingUnchanged() {
  const input = {type: 'mapping', iterable: 'T', element: 'k', result: 'v'};
  return substituteMapping(input, 'K', '"a"', noop) === input;
}
const tests = [
  testMappingIterableResult,
  testMappingNameType,
  testMappingElementShadowed,
  testMappingUnchanged,
];
export {tests};
