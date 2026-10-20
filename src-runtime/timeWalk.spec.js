import {timeWalk} from './timeWalk.js';
import {recordArrayScan, recordCheck, getCheckStats, resetCheckStats} from './checkStats.js';
import {options} from './options.js';
const virginCheckStats = options.checkStats;
function testOffIsPassthrough() {
  // Stats off: one boolean read, no clock calls, verdict untouched, no
  // recorder invoked (a throwing recorder would surface here).
  options.checkStats = false;
  try {
    const done = timeWalk('T#x', 'items', () => {
      throw new Error('recorder must not run when stats are off');
    });
    return done(true) === true && done(false) === false;
  } finally {
    options.checkStats = virginCheckStats;
  }
}
function testOnRecordsWalkRow() {
  // Stats on: the verdict passes through, a walk row lands keyed by
  // loc plus argument name, and the walk time folds into the enclosing
  // check's own cost. A timer that recorded a constant (like zero)
  // instead of the measured delta still passes the walk counter but
  // fails the fold, so the mutation surfaces here instead of hiding.
  options.checkStats = true;
  resetCheckStats();
  try {
    const done = timeWalk('T#x', 'paid', recordArrayScan);
    const verdict = done(true);
    recordCheck('T#x', 'paid', 0);
    const rows = getCheckStats();
    const row = rows.length === 1 ? rows[0] : undefined;
    return verdict === true && row !== undefined && row.loc === 'T#x paid' && row.arrayWalks === 1 &&
      row.checkMs > 0;
  } finally {
    options.checkStats = virginCheckStats;
  }
}
const tests = [
  testOffIsPassthrough,
  testOnRecordsWalkRow,
];
export {tests};
