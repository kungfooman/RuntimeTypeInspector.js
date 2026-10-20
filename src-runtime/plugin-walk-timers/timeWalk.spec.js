import {timeWalk} from './timeWalk.js';
import {recordArrayScan, recordCheck, getCheckStats, resetCheckStats} from '../checkStats.js';
import {options} from '../options.js';
const virginCheckStats = options.checkStats;
function testOffIsPassthrough() {
  // Stats off: one boolean read, no clock calls, verdict untouched, no
  // recorder invoked. The clock is hostile here (`performance.now`
  // throws), so any timing attempt fails the test: the recorder itself
  // early-returns when off, which would hide a missing gate behind an
  // empty stats table. Installed with `defineProperty` instead of a
  // plain assignment because `now` is a read-only prototype method on
  // some runtimes (Node 18): assignment throws there, while shadowing
  // the slot works everywhere and the captured descriptor restores it.
  options.checkStats = false;
  const virginNow = Object.getOwnPropertyDescriptor(performance, 'now');
  Object.defineProperty(performance, 'now', {
    value: () => {
      throw new Error('clock must not run when stats are off');
    },
    configurable: true,
    writable: true,
  });
  try {
    const done = timeWalk('T#x', 'items', () => {
      throw new Error('recorder must not run when stats are off');
    });
    return done(true) === true && done(false) === false;
  } finally {
    if (virginNow === undefined) {
      delete performance.now;
    } else {
      Object.defineProperty(performance, 'now', virginNow);
    }
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
