import {bestEffort} from './bestEffort.js';
function testRunsAction() {
  // The happy path just runs: errors are the reporter's, not the check's.
  let ran = false;
  bestEffort(() => {
    ran = true;
  });
  return ran === true;
}
function testSwallowsThrow() {
  // A broken reporter degrades into silence, never into a broken check.
  bestEffort(() => {
    throw new Error('lost');
  });
  return true;
}
export const tests = [
  testRunsAction,
  testSwallowsThrow,
];
