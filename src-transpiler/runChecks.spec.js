import {runChecks} from './runChecks.js';
function testPassingCheck() {
  // A passing check returns the body value with no hits and no posts.
  return runChecks('/** @param {number} x - The value. */\nfunction takeRtiProbe(x) {\n return x;\n}\ntakeRtiProbe(1);', 'takeRtiProbe', (scope, {hits, posted}) => typeof scope.takeRtiProbe === 'function' && hits.length === 0 && posted.length === 0);
}
function testFailingCheck() {
  // A failing check records one hit and one posted message.
  return runChecks('/** @param {number} x - The value. */\nfunction takeRtiProbeBad(x) {\n return x;\n}\ntakeRtiProbeBad("s");', 'takeRtiProbeBad', (scope, {hits, posted}) => hits.length === 1 && posted.length === 1);
}
export const tests = [
  testPassingCheck,
  testFailingCheck,
];
