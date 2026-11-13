import {noneUnchecked} from './noneUnchecked.js';
function testCleanPasses() {
  // Messages naming real types pass.
  const clean = [{
    strings: ['Expected number'],
  }];
  return noneUnchecked(clean) === true;
}
function testUncheckedFails() {
  // A degraded `unchecked` detail fails, wherever it sits in the strings.
  const degraded = [{
    strings: ['ok', 'unchecked type'],
  }];
  return noneUnchecked(degraded) === false;
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
