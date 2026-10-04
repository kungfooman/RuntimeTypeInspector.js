import {substituteCondition} from './substituteCondition.js';
const noop = () => undefined;
// We want: all four branches of a conditional type substitute, because a
// template key may appear in any of check/extends/true/false positions.
function testConditionAllBranches() {
  const input = {type: 'condition', checkType: 'K', extendsType: 'string', trueType: 'K', falseType: 'boolean'};
  return JSON.stringify(substituteCondition(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'condition', checkType: '"a"', extendsType: 'string', trueType: '"a"', falseType: 'boolean'});
}
// We want: a conditional type with no matching key is returned by identity,
// so unchanged subtrees keep their identity for downstream memos.
function testConditionUnchanged() {
  const input = {type: 'condition', checkType: 'number', extendsType: 'string', trueType: 'boolean', falseType: 'null'};
  return substituteCondition(input, 'K', '"a"', noop) === input;
}
// We want: nested conditional types substitute recursively, because a
// branch may itself contain the search key at any depth.
function testConditionNested() {
  const input = {type: 'condition', checkType: 'K', extendsType: 'string', trueType: {type: 'array', elementType: 'K'}, falseType: 'boolean'};
  return JSON.stringify(substituteCondition(input, 'K', '"a"', noop)) ===
    JSON.stringify({type: 'condition', checkType: '"a"', extendsType: 'string', trueType: {type: 'array', elementType: '"a"'}, falseType: 'boolean'});
}
const tests = [
  testConditionAllBranches,
  testConditionUnchanged,
  testConditionNested,
];
export {tests};
