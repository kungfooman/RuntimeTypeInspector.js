import {substituteNew} from './substituteNew.js';
const noop = () => undefined;
// We want: a new-type constructor substitutes its parameters and return type,
// because both are type positions that may contain the search key.
function testNewParamsAndRet() {
  const input = {type: 'new', parameters: [{type: 'K', name: 'x'}], ret: 'K'};
  return JSON.stringify(substituteNew(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'new', parameters: [{type: '"a"', name: 'x'}], ret: '"a"'});
}
// We want: a new type with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testNewUnchanged() {
  const input = {type: 'new', parameters: [{type: 'number', name: 'x'}], ret: 'boolean'};
  return substituteNew(input, 'K', '"a"', noop) === input;
}
// We want: a new type without a return type substitutes only parameters,
// because there is no ret field to touch.
function testNewNoRet() {
  const input = {type: 'new', parameters: [{type: 'K', name: 'x'}]};
  return JSON.stringify(substituteNew(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'new', parameters: [{type: '"a"', name: 'x'}]});
}
const tests = [
  testNewParamsAndRet,
  testNewUnchanged,
  testNewNoRet,
];
export {tests};
