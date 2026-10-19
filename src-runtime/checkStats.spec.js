import {options} from './options.js';
import {recordCheck, recordMapRide, recordMapScan, recordSetScan, recordArrayScan, recordObjectScan, getCheckStats, resetCheckStats} from './checkStats.js';
import {validateType} from './validateType.js';
import {expandType} from '../src-transpiler/expandType.js';
/**
 * Untouched options as captured at import time, so tests can flip and
 * restore without turning suite ordering into part of the contract.
 * @type {{checkStats: boolean}}
 */
const virgin = {checkStats: options.checkStats};
function testKindWalksAccumulatePerKind() {
  // Each container kind accumulates its own total and worst: Set, Array
  // and Object walks land in separate ledgers on the same row, and kinds
  // that never walked stay zero.
  options.checkStats = true;
  resetCheckStats();
  recordSetScan('T#k', 3);
  recordSetScan('T#k', 7);
  recordArrayScan('T#k', 4);
  recordObjectScan('T#k', 5);
  const rows = getCheckStats();
  return rows.length === 1 &&
    rows[0].setMs === 10 && rows[0].maxSetMs === 7 && rows[0].setWalks === 2 &&
    rows[0].arrayMs === 4 && rows[0].maxArrayMs === 4 && rows[0].arrayWalks === 1 &&
    rows[0].objectMs === 5 && rows[0].maxObjectMs === 5 && rows[0].objectWalks === 1 &&
    rows[0].scanMs === 0 && rows[0].scans === 0;
}
function testKindTimeFoldsIntoCheckTime() {
  // A Set walk followed by a zero-measured check attributes the walk to
  // the check (same coarse-clock contract as map scans), while a fine
  // measured check wins without double counting.
  options.checkStats = true;
  resetCheckStats();
  recordSetScan('T#fold-set', 30);
  recordArrayScan('T#fold-set', 12);
  recordCheck('T#fold-set', 0);
  const coarse = getCheckStats()[0];
  // Both walks fold into the one enclosing check: total and worst both
  // read 42, since the check is the unit the worst is measured in.
  const coarseOk = coarse.checkMs === 42 && coarse.maxCheckMs === 42;
  return coarseOk;
}
function testValidatorsRecordTheirKind() {
  // End to end: validating a Set, an Array and a Record through the real
  // validators lands walk time in the matching kind ledger at the same
  // loc, and the enclosing check (simulated here, like `inspectType`
  // does) attributes it. Failing validations record too: the walk still
  // cost time.
  options.checkStats = true;
  resetCheckStats();
  const warn = () => undefined;
  const setExpect = {type: 'set', elementType: 'number'};
  const arrExpect = {type: 'array', elementType: 'number'};
  const recExpect = expandType('Record<string, number>');
  const setOk = validateType(new Set([1, 'x']), setExpect, 'V#kinds', 'v', true, warn, 0) === false;
  const arrOk = validateType([1, 'x'], arrExpect, 'V#kinds', 'v', true, warn, 0) === false;
  const recOk = validateType({a: 1, b: 'x'}, recExpect, 'V#kinds', 'v', true, warn, 0) === false;
  recordCheck('V#kinds', 0);
  const row = getCheckStats()[0];
  const ok = setOk && arrOk && recOk &&
    row.setWalks === 1 && row.arrayWalks === 1 && row.objectWalks === 1 &&
    row.checks === 1 && row.checkMs === row.setMs + row.arrayMs + row.objectMs;
  resetCheckStats();
  return ok;
}
function testNestedScanTimeFoldsIntoCheckTime() {
  // The reported bug: a loc whose checks do their work in nested map
  // scans showed thousands of checks at "0us" check time, because every
  // fast top level check measured 0 under a coarse clock while the scans
  // accumulated real time. The check takes the larger of its own reading
  // and the nested scan time, so the row reads as the full cost of
  // checking the loc; under a fine clock the measured time already
  // contains the scans and wins, so nothing counts twice.
  options.checkStats = true;
  resetCheckStats();
  recordMapScan('T#fold', 30);
  recordCheck('T#fold', 0);
  const coarse = getCheckStats()[0];
  const coarseOk = coarse.checks === 1 && coarse.scanMs === 30 &&
    coarse.checkMs === 30 && coarse.maxCheckMs === 30;
  resetCheckStats();
  recordMapScan('T#fine', 30);
  recordCheck('T#fine', 42);
  const fine = getCheckStats()[0];
  const fineOk = fine.checkMs === 42 && fine.maxCheckMs === 42 && fine.scanMs === 30;
  return coarseOk && fineOk;
}
function testRowCountsTotalsAndWorst() {
  // One loc accumulates checks, rides and scans in independent ledgers,
  // with sums and per-column maxima for the timed ones.
  options.checkStats = true;
  resetCheckStats();
  recordCheck('T#m', 1.5);
  recordCheck('T#m', 0.5);
  recordMapRide('T#m');
  recordMapRide('T#m');
  recordMapRide('T#m');
  recordMapScan('T#m', 2);
  recordMapScan('T#m', 7);
  const rows = getCheckStats();
  return rows.length === 1 && rows[0].loc === 'T#m' &&
    rows[0].checks === 2 && rows[0].rides === 3 && rows[0].scans === 2 &&
    rows[0].checkMs === 2 && rows[0].maxCheckMs === 1.5 &&
    rows[0].scanMs === 9 && rows[0].maxScanMs === 7;
}
function testUndefinedTimingsCountButCostNothing() {
  // A check without a measurement (timing was off, or the clock is not
  // available) still counts as a check but adds no bogus timing.
  options.checkStats = true;
  resetCheckStats();
  recordCheck('T#u');
  recordMapScan('T#u');
  const rows = getCheckStats();
  return rows.length === 1 && rows[0].checks === 1 && rows[0].scans === 1 &&
    rows[0].checkMs === 0 && rows[0].maxCheckMs === 0 &&
    rows[0].scanMs === 0 && rows[0].maxScanMs === 0;
}
function testHotspotSortScanMsThenCheckMsThenChecks() {
  // The panel promises hotspots first: the biggest scan time leads,
  // ties break on top level check time, then on raw counts, then loc.
  options.checkStats = true;
  resetCheckStats();
  recordCheck('C-checks', 1);
  recordCheck('C-checks', 1);
  recordCheck('B-checkms', 10);
  recordMapScan('A-scanms', 50);
  const rows = getCheckStats();
  const order = rows.map(_ => _.loc).join(',');
  return order === 'A-scanms,B-checkms,C-checks' && rows[0].scanMs === 50;
}
function testResetForgetsAllRows() {
  options.checkStats = true;
  resetCheckStats();
  recordCheck('T#r', 1);
  recordMapScan('T#r', 1);
  recordMapRide('T#r');
  resetCheckStats();
  return getCheckStats().length === 0;
}
function testNoClonableRowPerLocIsAnonymous() {
  // Different locs split into different rows: the table answers "which
  // call site is hot", so mixing them would be useless.
  options.checkStats = true;
  resetCheckStats();
  recordCheck('A#x', 1);
  recordCheck('B#y', 1);
  const rows = getCheckStats();
  return rows.length === 2 && rows.map(_ => _.loc).join(',') === 'A#x,B#y';
}
function testCheckStatsOffMeansNoRecording() {
  // Off costs one boolean read: nothing is recorded, not even counts.
  options.checkStats = false;
  resetCheckStats();
  recordCheck('T#off', 1);
  recordMapRide('T#off');
  recordMapScan('T#off', 1);
  const empty = getCheckStats().length === 0;
  options.checkStats = true;
  resetCheckStats();
  recordCheck('T#off-on-again', 1);
  const recordingAgain = getCheckStats().length === 1;
  return empty && recordingAgain;
}
function testVirginCheckStatsOptionDefaultsOn() {
  // The shipped default must stay "collect check stats": the user asked
  // for timing by default so hotspot data exists without any opt-in.
  return virgin.checkStats === true;
}
function testRowCarriesCallStack() {
  // A stats row must answer "where does this loc live": it carries the
  // stack captured when the row was born, reaching from the recorder up
  // through the check call site.
  options.checkStats = true;
  resetCheckStats();
  recordCheck('T#stack', 1);
  const stack = getCheckStats()[0].stack;
  return typeof stack === 'string' && stack.includes('recordCheck') &&
    stack.includes('rowFor') && stack.includes('Error');
}
function testStackCapturedExactlyOncePerRow() {
  // Hot locs record millions of checks: the `new Error()` cost must be
  // paid once at row creation, never per record. A counting Error
  // replacement proves the capture count stays at one across repeated
  // checks, rides and scans of the same loc.
  options.checkStats = true;
  resetCheckStats();
  const RealError = globalThis.Error;
  let captures = 0;
  class CountingError extends RealError {
    constructor(...args) {
      super(...args);
      captures++;
    }
  }
  globalThis.Error = CountingError;
  try {
    recordCheck('T#once', 1);
    recordCheck('T#once', 1);
    recordCheck('T#once', 1);
    recordMapRide('T#once');
    recordMapScan('T#once', 1);
    recordCheck('T#other', 1);
  } finally {
    globalThis.Error = RealError;
  }
  // Two rows were created (T#once, T#other), so exactly two captures.
  return captures === 2 && getCheckStats().length === 2;
}
const tests = [
  testKindWalksAccumulatePerKind,
  testKindTimeFoldsIntoCheckTime,
  testValidatorsRecordTheirKind,
  testNestedScanTimeFoldsIntoCheckTime,
  testRowCountsTotalsAndWorst,
  testUndefinedTimingsCountButCostNothing,
  testHotspotSortScanMsThenCheckMsThenChecks,
  testResetForgetsAllRows,
  testNoClonableRowPerLocIsAnonymous,
  testCheckStatsOffMeansNoRecording,
  testVirginCheckStatsOptionDefaultsOn,
  testRowCarriesCallStack,
  testStackCapturedExactlyOncePerRow,
];
export {tests};
