import {noneUnchecked} from './noneUnchecked.js';
function testCleanPasses() {
  // Messages naming real types pass.
  return noneUnchecked([{strings: ['Expected number']}]) === true;
}
function testUncheckedFails() {
  // A degraded `unchecked` detail fails, wherever it sits in the strings.
  return noneUnchecked([{strings: ['ok', 'unchecked type']}]) === false;
}
function testEmptyPasses() {
  // Nothing posted means nothing degraded.
  return noneUnchecked([]) === true;
}
function testMissingStringsPasses() {
  // Messages without string details cannot carry the marker.
  return noneUnchecked([{}]) === true;
}
export const tests = [
  testCleanPasses,
  testUncheckedFails,
  testEmptyPasses,
  testMissingStringsPasses,
];
