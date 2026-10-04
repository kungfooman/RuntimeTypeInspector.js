import {substituteFunction} from './substituteFunction.js';
const noop = () => undefined;
// We want: both parameters and return type substitute, because a template
// key may appear in any parameter or in the return type.
function testFunctionParamsAndRet() {
  const input = {type: 'function', parameters: [{type: 'K', name: 'x'}], ret: 'K'};
  return JSON.stringify(substituteFunction(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'function', parameters: [{type: '"a"', name: 'x'}], ret: '"a"'});
}
// We want: a function without a return type substitutes only parameters,
// because there is no ret field to touch.
function testFunctionNoRet() {
  const input = {type: 'function', parameters: [{type: 'K', name: 'x'}]};
  return JSON.stringify(substituteFunction(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'function', parameters: [{type: '"a"', name: 'x'}]});
}
// We want: a function with no matching key is returned by identity, so
// unchanged subtrees keep their identity for downstream memos.
function testFunctionUnchanged() {
  const input = {type: 'function', parameters: [{type: 'number', name: 'x'}], ret: 'boolean'};
  return substituteFunction(input, 'K', '"a"', noop) === input;
}
// We want: a new-type constructor substitutes like a function, because it
// has the same parameters-plus-return shape.
function testNewType() {
  const input = {type: 'new', parameters: [{type: 'K', name: 'x'}], ret: 'K'};
  return JSON.stringify(substituteFunction(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'new', parameters: [{type: '"a"', name: 'x'}], ret: '"a"'});
}
const tests = [
  testFunctionParamsAndRet,
  testFunctionNoRet,
  testFunctionUnchanged,
  testNewType,
];
export {tests};
