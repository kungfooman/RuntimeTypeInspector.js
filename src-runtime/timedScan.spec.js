import './validateType.js';
import {timedScan} from './timedScan.js';
import {freshWindow} from './freshWindow.js';
import {options} from './options.js';
import {getCheckStats, resetCheckStats} from './checkStats.js';
const virginWindowedChecks = options.windowedChecks;
const virginCheckStats = options.checkStats;
function testScanAccumulatesSpendAndVerdict() {
  // The verdict passes through from the scan, and the wall time lands
  // on the record's running spend even with stats off (the ride gate
  // reads the total, not the ledger).
  options.windowedChecks = true;
  options.checkStats = false;
  resetCheckStats();
  try {
    const record = freshWindow();
    const good = timedScan(new Map([[1, 'a']]), record, 'number', 'string', 'T#x', 'm', true, () => {}, 0);
    // Spend only grows by accumulation: seeding a known total and
    // demanding strict growth pins the helper's own addition instead of
    // asserting a clock delta, which a coarse or fake clock could report
    // as zero.
    const seeded = record.spentMs;
    record.spentMs = 40;
    timedScan(new Map([[1, 'a']]), record, 'number', 'string', 'T#x', 'm', true, () => {}, 0);
    return good === true && seeded >= 0 && record.spentMs > 40 && getCheckStats().length === 0;
  } finally {
    options.windowedChecks = virginWindowedChecks;
    options.checkStats = virginCheckStats;
  }
}
function testStatsOnRecordsWalkRow() {
  // With stats on, the scan also records a walk row keyed by loc plus
  // argument name, so the panel can show which call sites pay.
  options.windowedChecks = false;
  options.checkStats = true;
  resetCheckStats();
  try {
    const record = freshWindow();
    timedScan(new Map([[1, 'a']]), record, 'number', 'string', 'T#x', 'paid', true, () => {}, 0);
    const rows = getCheckStats();
    return rows.length === 1 && rows[0].loc === 'T#x paid' && rows[0].scans === 1;
  } finally {
    options.windowedChecks = virginWindowedChecks;
    options.checkStats = virginCheckStats;
  }
}
const tests = [
  testScanAccumulatesSpendAndVerdict,
  testStatsOnRecordsWalkRow,
];
export {tests};
