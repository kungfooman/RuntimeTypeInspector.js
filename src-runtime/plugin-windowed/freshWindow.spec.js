import {freshWindow} from './freshWindow.js';
function testFreshRecordShape() {
  // A fresh record forces the first check to scan (unset size sentinel
  // -1 never matches a real size) and locks out rides until real scan
  // time accumulates (spend starts at 0).
  const record = freshWindow();
  return record.sinceLast === 0 && record.window === 1 && record.lastSize === -1 && record.spentMs === 0;
}
function testFreshRecordsAreIndependent() {
  // Each call returns its own object: mutating one record must not leak
  // into the next map's history.
  const first = freshWindow();
  first.window = 99;
  return freshWindow().window === 1;
}
const tests = [
  testFreshRecordShape,
  testFreshRecordsAreIndependent,
];
export {tests};
