import '../validateType.js';
import {options, setOptions} from '../options.js';
import {validateMap} from '../validateMap.js';
import {validators} from '../validators.js';
import {windowedValidateMap, mapCheckWindowRecord, resetMapCheckWindows} from './windowedValidateMap.js';
import {recordCheck, recordMapScan, getCheckStats, resetCheckStats} from '../checkStats.js';
/**
 * The options untouched by any test logic: every behavior test opts in
 * or out via `setOptions({windowedChecks})` explicitly after starting,
 * so the suite state cannot steer it, while these captures must stay
 * undisturbed.
 * @type {{windowedChecks: boolean, mapCheckWindowCap: number, mapCheckWindowMinTotalMs: number, checkStats: boolean}}
 */
const virginWindowedChecks = options.windowedChecks;
const virginMapCheckWindowCap = options.mapCheckWindowCap;
const virginMapCheckWindowMinTotalMs = options.mapCheckWindowMinTotalMs;
const virginCheckStats = options.checkStats;
/**
 * Runs a map validation with a warning recorder and returns the verdict
 * plus the recorded warning infos for structure assertions.
 * @param {Map} map - The map to validate.
 * @param {*} expect - The type information of the map check.
 * @param {number} depth - The depth for validator recursion.
 * @returns {{good: boolean, infos: any[], messages: string[]}} Verdict plus recorded warnings.
 */
function check(map, expect, depth = 0) {
  const infos = [];
  const messages = [];
  const good = windowedValidateMap(map, expect, 'TestSite#method', 'mapProperty', true, (msg, info) => {
    messages.push(msg);
    infos.push(info);
  }, depth);
  return {good, infos, messages};
}
/**
 * Runs a map validation through the pedantic core and returns the
 * verdict plus the recorded warning infos for structure assertions.
 * Windowed behavior tests must never call this: it always scans, so it
 * pins the default path the plugin replaces.
 * @param {Map} map - The map to validate.
 * @param {*} expect - The type information of the map check.
 * @returns {{good: boolean, infos: any[], messages: string[]}} Verdict plus recorded warnings.
 */
function checkPedantic(map, expect) {
  const infos = [];
  const messages = [];
  const good = validateMap(map, expect, 'TestSite#method', 'mapProperty', true, (msg, info) => {
    messages.push(msg);
    infos.push(info);
  }, 0);
  return {good, infos, messages};
}
function testFirstCheckScansAndDoubles() {
  setOptions({windowedChecks: true});
  resetMapCheckWindows();
  // The first clean check is a full scan and seeds the doubling: the
  // window becomes 2 right away, so the next check may skip.
  const map = new Map([[1, 'a'], [2, 'b']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  if (!check(map, expect).good) {
    return false;
  }
  return mapCheckWindowRecord(map).window === 2;
}
/**
 * Snapshot of a validation history record: the record object is live, so
 * assertions about a call's outcome need copies taken right after it.
 * @param {{sinceLast: number, window: number, lastSize: number}|undefined} record - The live record to copy.
 * @returns {{sinceLast: number, window: number, lastSize: number}|undefined} The snapshot.
 */
function snap(record) {
  if (record === undefined) {
    return undefined;
  }
  return {sinceLast: record.sinceLast, window: record.window, lastSize: record.lastSize};
}
function testRepeatsSkipUntilWindowHits() {
  setOptions({windowedChecks: true});
  // Budget 0: this test pins the window mechanics (when a due scan
  // lands), and the spend gate's own behavior is pinned by its dedicated
  // tests below, where the accumulated spend is fed deterministically.
  options.mapCheckWindowMinTotalMs = 0;
  resetMapCheckWindows();
  // Same call, unchanged map: checks inside the window take the O(1)
  // exit, every due check scans and doubles the window again.
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect); // scan 1: window 2, sinceLast 0
  const second = check(map, expect); // sinceLast 1 < 2: inside window, no scan
  const secondRecord = snap(mapCheckWindowRecord(map));
  const third = check(map, expect); // sinceLast 2 >= 2: due, scan 2: window 4
  const thirdRecord = snap(mapCheckWindowRecord(map));
  const fourth = check(map, expect); // sinceLast 1 < 4: inside window again
  return second.good === true && secondRecord.window === 2 && secondRecord.sinceLast === 1 &&
    third.good === true && thirdRecord.window === 4 && thirdRecord.sinceLast === 0 &&
    fourth.good === true && snap(mapCheckWindowRecord(map)).window === 4;
}
function testDoublingStaysBoundedByCap() {
  setOptions({windowedChecks: true});
  resetMapCheckWindows();
  // Doubling reaches the cap after 1+2+4+... Windows then hold at the
  // cap: the longest a persistent drift can hide is one cap.
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  for (let i = 0; i < 2100; i++) {
    check(map, expect);
  }
  const capped = snap(mapCheckWindowRecord(map));
  for (let i = 0; i < 5; i++) {
    check(map, expect);
  }
  const stillCapped = snap(mapCheckWindowRecord(map));
  return capped.window === 1024 && stillCapped.window === 1024 && capped.window === stillCapped.window;
}
function testSizeChangeRestartsWindow() {
  setOptions({windowedChecks: true});
  resetMapCheckWindows();
  // Adding entries drops the interval back to the start: the next check
  // scans the new content instead of riding an outdated window.
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect);
  map.set(2, 'b');
  const after = check(map, expect);
  if (!after.good || mapCheckWindowRecord(map).window !== 2) {
    return false;
  }
  // Growth with a wrong-shaped entry still reports after a restart.
  map.set(3, 42);
  const bad = check(map, expect);
  return bad.good === false &&
    bad.infos.some((info) => info && info.expect === 'string' && info.value === 42);
}
function testDirtyMapsRescanEveryTime() {
  setOptions({windowedChecks: true});
  resetMapCheckWindows();
  // A failing scan resets the interval: unchanged dirty data is reported
  // on every check, keeping persistent bugs loud instead of 1-of-N.
  const map = new Map([[1, 'a'], [2, 3]]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  const first = check(map, expect);
  const second = check(map, expect);
  return first.good === false && second.good === false &&
    first.infos.some((info) => info && info.expect === 'string' && info.value === 3) &&
    second.infos.some((info) => info && info.expect === 'string' && info.value === 3);
}
function testContentDriftCaughtWithinWindow() {
  setOptions({windowedChecks: true});
  options.mapCheckWindowMinTotalMs = 0; // window mechanics, see testRepeatsSkipUntilWindowHits
  resetMapCheckWindows();
  // Content mutation without size change may skip one check (documented
  // sampling), but the next window boundary scans and reports it.
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect);
  map.set(1, 42);
  const skipped = check(map, expect);
  const caught = check(map, expect);
  return skipped.good === true && caught.good === false;
}
function testRecordsArePerInstance() {
  setOptions({windowedChecks: true});
  // Budget 0: the window===2 asserts below say "the second check of a
  // map rode instead of scanning" (a rescan would double to 4), so the
  // spend gate has to be open for the mechanism this test isolates.
  options.mapCheckWindowMinTotalMs = 0;
  resetMapCheckWindows();
  // Two maps each carry their own history: one fresh map starts from
  // the scanning state again.
  const a = new Map([[1, 'a']]);
  const b = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(a, expect);
  check(a, expect);
  check(b, expect);
  return mapCheckWindowRecord(a).window === 2 &&
    mapCheckWindowRecord(b).window === 2;
}
function testUnknownMapHasNoRecord() {
  setOptions({windowedChecks: true});
  resetMapCheckWindows();
  // Asking before any check exists returns nothing.
  return mapCheckWindowRecord(new Map()) === undefined;
}
function testResetForgetsHistory() {
  setOptions({windowedChecks: true});
  resetMapCheckWindows();
  // Resetting makes the next check behave like the first one again.
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect);
  check(map, expect);
  setOptions({windowedChecks: true});
  resetMapCheckWindows();
  return mapCheckWindowRecord(map) === undefined && check(map, expect).good === true;
}
function testRecordTracksLastSize() {
  setOptions({windowedChecks: true});
  resetMapCheckWindows();
  // The record shares the scan result: fresh history keeps the size the
  // scan saw, enabling the size based restart.
  const map = new Map([[1, 'a'], [2, 'b']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect);
  return mapCheckWindowRecord(map).lastSize === map.size;
}
function testNumberEdgeKeysStayChecked() {
  setOptions({windowedChecks: true});
  resetMapCheckWindows();
  // Number keys with Infinity and NaN keep their verdicts under the
  // window scheme: failures reset the interval, so repeat checks of the
  // same dirty map keep reporting instead of riding a window.
  const map = new Map([[Infinity, 'x'], [Number.NaN, 'y']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  const first = check(map, expect, 0);
  const second = check(map, expect, 0);
  return first.good === false && second.good === false;
}
/**
 * Measures the ratio of the pedantic mode (every check scans the whole
 * map) against the windowed per check cost on one big clean map, and
 * demands an improvement inside a sane band so the whole point of the
 * windows stays measured, not just trusted. The assertion is a ratio
 * over per check cost, so it does not depend on the machine being fast
 * or slow; both sides scale together.
 * @returns {boolean} True when the windowed checks are faster than the demanded ratio.
 */
function testWindowsSpeedupRatio() {
  // The window scheme exists to make repeated checks of one unchanged
  // map cheap. Both sides run the identical work on one unchanged
  // 20000 entry map. The pedantic side calls the core directly, so
  // every check pays a full scan: main's map loop walks every entry
  // even when clean (no primitive fast path like arrays have), which
  // costs milliseconds at this map size. The windowed side turns the
  // option on and warms up to the steady state, where one of every
  // 1024 checks pays a scan and the rest only read the history record
  // at well under a microsecond each. The ratio therefore lands in the
  // thousands: far above the demanded floor, far below a ceiling that
  // would expose the actual check being timed away into nothing. The
  // ceiling documents main's real scan cost, not a regression: nothing
  // installs when windowing stays off, the pedantic side is main's
  // loop verbatim.
  setOptions({windowedChecks: false});
  resetMapCheckWindows();
  const entries = [];
  for (let i = 0; i < 20000; i++) {
    entries.push([i, i]);
  }
  const map = new Map(entries);
  const expect = {type: 'map', key: 'number', val: 'number'};
  const warn = () => undefined;
  const scanOnce = () => validateMap(map, expect, 'RatioTest#check', 'mapProperty', true, warn, 0);
  /**
   * Times the given round in microseconds per check, best of 2 rounds
   * with a warmup pass first so JIT tiering does not steer the verdict.
   * @param {() => void} round - The per check work to time.
   * @param {number} iters - Number of checks per timed round.
   * @returns {number} The best measured microseconds per check.
   */
  const perCheckUs = (round, iters) => {
    round();
    let best = Number.POSITIVE_INFINITY;
    for (let attempt = 0; attempt < 2; attempt++) {
      const start = performance.now();
      for (let i = 0; i < iters; i++) round();
      const perCheck = performance.now() - start;
      best = Math.min(best, perCheck / iters);
    }
    return best * 1000;
  };
  const forcedScanUs = perCheckUs(scanOnce, 30);
  setOptions({windowedChecks: true});
  // Budget 0: this pins the window mechanics (steady state amortization),
  // which must stay machine independent. The shipped 100ms budget would
  // force this map through ~100ms of scans before any ride unlocks, so
  // over 4096 checks the unlock phase would dominate and the ratio would
  // collapse on fast machines while passing on slow ones. That unlock
  // dynamic is pinned deterministically by the spend tests above (whose
  // poked totals never touch the wall clock) plus the #306 harness at
  // the shipped default.
  options.mapCheckWindowMinTotalMs = 0;
  resetMapCheckWindows();
  // Through the dispatch table: this pins that setOptions wiring really
  // installed the plugin, not that the plugin works when called direct.
  const rideOnce = () => validators.validateMap(map, expect, 'RatioTest#check', 'mapProperty', true, warn, 0);
  const windowedUs = perCheckUs(rideOnce, 4096);
  setOptions({windowedChecks: false});
  options.mapCheckWindowMinTotalMs = virginMapCheckWindowMinTotalMs;
  const demanded = 100;
  const sanity = 20000;
  const actual = Math.round(forcedScanUs / windowedUs);
  if (actual < demanded || actual > sanity) {
    console.error(`expected a speed increase between ${demanded}x and ${sanity}x but got ${actual}x (full scan ${forcedScanUs.toFixed(4)}us, windowed ${windowedUs.toFixed(4)}us per check, spend budget ${options.mapCheckWindowMinTotalMs}ms)`);
    return false;
  }
  return true;
}
function testDefaultChecksEverythingEveryCheck() {
  // The default is 100% pedantic (windowedChecks === false): a stored
  // value mutated between checks fails the very next check, because no
  // check ever skips via a window. This pins the shipped default as
  // captured at import time before any test logic runs, and the
  // loophole freedom it buys, with the user's concrete example (a
  // stored string turned into a number).
  if (virginWindowedChecks !== false) {
    return false;
  }
  setOptions({windowedChecks: false});
  resetMapCheckWindows();
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  if (!checkPedantic(map, expect).good) {
    return false;
  }
  map.set(1, 42); // same size, wrong stored value type
  const bad = checkPedantic(map, expect);
  return bad.good === false &&
    bad.infos.some((info) => info && info.expect === 'string' && info.value === 42);
}
function testWindowedChecksCanMissDriftAtTenthCheck() {
  resetMapCheckWindows();
  // The documented sampling tradeoff, demonstrated live: with
  // windowedChecks on, a stored value mutated between checks fails only
  // at the next due scan, so check 10 still passes (no scan is due at
  // 10: with windows 2/4/8 the due checks land at 1, 3, 7, 15...). The
  // catch at the next due check stays covered by
  // testContentDriftCaughtWithinWindow.
  setOptions({windowedChecks: true});
  options.mapCheckWindowMinTotalMs = 0; // window mechanics, see testRepeatsSkipUntilWindowHits
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  if (!check(map, expect).good) {
    return false;
  }
  for (let i = 0; i < 9; i++) {
    if (!check(map, expect).good) {
      return false;
    }
  }
  map.set(1, 42); // same size, wrong stored value type
  return check(map, expect).good === true;
}
function testSetOptionsPatchesAndRejectsUnknown() {
  // The consumer bootstrap API must patch the option and reject unknown
  // keys plus wrong value types, so typos cannot silently pretend
  // success. The numeric spend budget goes through the same door, type
  // checked against its number default.
  setOptions({windowedChecks: false});
  setOptions({windowedChecks: true});
  const patched = options.windowedChecks === true;
  setOptions({windowedChecks: false});
  const restored = options.windowedChecks === false;
  setOptions({mapCheckWindowMinTotalMs: 50});
  const patchedMin = options.mapCheckWindowMinTotalMs === 50;
  setOptions({mapCheckWindowMinTotalMs: virginMapCheckWindowMinTotalMs});
  const restoredMin = options.mapCheckWindowMinTotalMs === virginMapCheckWindowMinTotalMs;
  const minWrongTypeThrew = (() => {
    try {
      setOptions({mapCheckWindowMinTotalMs: 'slow'});
      return false;
    } catch (unused) {
      return true;
    }
  })();
  const unknownThrew = (() => {
    try {
      setOptions({windowedCheckz: true});
      return false;
    } catch (unused) {
      return true;
    }
  })();
  const wrongTypeThrew = (() => {
    try {
      setOptions({windowedChecks: 'yes'});
      return false;
    } catch (unused) {
      return true;
    }
  })();
  return patched && restored && patchedMin && restoredMin && minWrongTypeThrew && unknownThrew && wrongTypeThrew;
}
function testMapCheckWindowCapIsOptionAndLiveEditable() {
  // The doubling cap is not a magic constant: a small cap stops growth
  // at that interval (bounded detection latency), and lowering it
  // mid-flight applies at the next doubling without a reset or reload.
  setOptions({windowedChecks: true});
  options.mapCheckWindowCap = 2;
  resetMapCheckWindows();
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect);
  let record = mapCheckWindowRecord(map);
  let ok = record.window === 2;
  // More checks oscillate scan/ride but can never grow past the cap.
  for (let i = 0; i < 10; i++) {
    check(map, expect);
  }
  record = mapCheckWindowRecord(map);
  ok = ok && record.window === 2;
  // Widening mid-life also applies at the next doubling.
  options.mapCheckWindowCap = 32;
  for (let i = 0; i < 64; i++) {
    check(map, expect);
  }
  record = mapCheckWindowRecord(map);
  ok = ok && record.window === 32;
  options.mapCheckWindowCap = virginMapCheckWindowCap;
  setOptions({windowedChecks: false});
  return ok;
}
function testMapCheckCapFloorsAtOne() {
  // A cap below 1 (or fractional input from the panel) must not stall
  // the scheme: every check then checks per scan, which is the safest
  // misconfiguration.
  setOptions({windowedChecks: true});
  options.mapCheckWindowCap = 0.5;
  resetMapCheckWindows();
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect);
  let record = mapCheckWindowRecord(map);
  let ok = record.window === 1;
  for (let i = 0; i < 10; i++) {
    check(map, expect);
  }
  record = mapCheckWindowRecord(map);
  ok = ok && record.window === 1;
  options.mapCheckWindowCap = virginMapCheckWindowCap;
  setOptions({windowedChecks: false});
  return ok;
}
function testCheckStatsCountsRidesAndScans() {
  // The window scheme's cost is visible in the stats: rides for skipped
  // checks, scans for full scans, and the scan wall time lands on the
  // same loc row. Direct `validateMap` calls never touch `checks`;
  // that ledger belongs to top level `inspectType` entries.
  setOptions({windowedChecks: true});
  options.mapCheckWindowMinTotalMs = 0; // rides are the subject here, so the spend gate stays wide open
  options.checkStats = true;
  resetMapCheckWindows();
  resetCheckStats();
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  // Scans land at checks 1, 3, 7 (windows 1/2/4): rides at 2, 4, 5, 6.
  for (let i = 0; i < 7; i++) {
    check(map, expect);
  }
  const rows = getCheckStats();
  const row = rows.find(_ => _.loc === 'TestSite#method mapProperty');
  const ok = rows.length === 1 && row !== undefined &&
    row.checks === 0 && row.rides === 4 && row.scans === 3 &&
    row.scanMs >= 0;
  resetCheckStats();
  setOptions({windowedChecks: false});
  return ok;
}
function testCheckStatsOffMeansMapChecksCostOneBit() {
  // With stats off, map checks (here: full pedantic scans) record
  // nothing, so the recording can never become part of the cost users
  // did not ask for.
  setOptions({windowedChecks: false});
  options.checkStats = false;
  resetMapCheckWindows();
  resetCheckStats();
  check(new Map([[1, 'a']]), {type: 'map', key: 'number', val: 'string'});
  const empty = getCheckStats().length === 0;
  options.checkStats = virginCheckStats;
  resetCheckStats();
  return empty;
}
function testStatsScansRecordUnderPedanticToo() {
  // The pedantic default is the expensive mode: its scans must show up
  // in the stats, or the hotspot table would hide the very mode users
  // start from.
  setOptions({windowedChecks: false});
  options.checkStats = true;
  resetMapCheckWindows();
  resetCheckStats();
  check(new Map([[1, 'a']]), {type: 'map', key: 'number', val: 'string'});
  check(new Map([[1, 'a']]), {type: 'map', key: 'number', val: 'string'});
  const rows = getCheckStats();
  const row = rows.find(_ => _.loc === 'TestSite#method mapProperty');
  const ok = rows.length === 1 && row !== undefined &&
    row.rides === 0 && row.scans === 2 && row.checks === 0;
  resetCheckStats();
  return ok;
}
function testRecordCheckLedgerUsesScanLedgerSeparately() {
  // The map ledger (rides/scans, from `validateMap`) and the top level
  // ledger (checks, from `inspectType`) are independent columns on one
  // row, so scan cost never masquerades as check frequency.
  options.checkStats = true;
  resetCheckStats();
  recordCheck('Ledger#x', 'v', 2);
  recordMapScan('Ledger#x', 'v', 20);
  const row = getCheckStats().find(_ => _.loc === 'Ledger#x v');
  return row !== undefined && row.checks === 1 && row.scans === 1 && row.rides === 0;
}
function testSpendGateShipsAtHundredMs() {
  // The spend gate must be on out of the box: a shipped 0 would mean
  // every window always rides, and the whole complaint behind the gate
  // (real checks lost on maps nobody ever spent time scanning) would be
  // back by default. The value is pinned exactly so an accidental
  // default change is noticed, not discovered in production ride counts.
  return virginMapCheckWindowMinTotalMs === 100;
}
function testScanSpendAccumulatesInRecord() {
  // The gate decides from the record's accumulated scan spend, so every
  // windowed scan must add its wall time, even with stats off:
  // measurement belongs to the gate, the stats ledger only rides along.
  // Fresh spend is 0, so a fresh map can earn no ride before it has paid
  // real scan time.
  setOptions({windowedChecks: true});
  options.checkStats = false;
  options.mapCheckWindowMinTotalMs = 0;
  resetMapCheckWindows();
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect);
  const record = mapCheckWindowRecord(map);
  const accumulated = record.spentMs >= 0 && Number.isFinite(record.spentMs);
  options.checkStats = virginCheckStats;
  options.mapCheckWindowMinTotalMs = virginMapCheckWindowMinTotalMs;
  setOptions({windowedChecks: false});
  return accumulated;
}
function testUnearnedSpendForcesFullRescan() {
  // The gate's core promise, fed a deterministic spend: while the map's
  // accumulated scan time stays below the budget, the next check must
  // NOT ride, no matter how fast the real machine is. The spec pokes a
  // known cheap total into the record (machine speed would make a real
  // cost flaky) and then reads the observable outcome: a full rescan
  // happened (sinceLast reset, window doubled again) and the stats show
  // zero rides, so no real check was skipped before the map earned it.
  setOptions({windowedChecks: true});
  options.checkStats = true;
  options.mapCheckWindowMinTotalMs = 100;
  resetMapCheckWindows();
  resetCheckStats();
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect); // scan 1: window 2, some real spend accumulated
  mapCheckWindowRecord(map).spentMs = 0.001; // per spec: almost nothing spent yet
  const second = check(map, expect); // gate stays closed: full rescan
  const record = snap(mapCheckWindowRecord(map));
  const row = getCheckStats().find(_ => _.loc === 'TestSite#method mapProperty');
  const ok = second.good === true && record.sinceLast === 0 &&
    record.window === 4 && row !== undefined &&
    row.rides === 0 && row.scans === 2;
  resetCheckStats();
  options.checkStats = virginCheckStats;
  options.mapCheckWindowMinTotalMs = virginMapCheckWindowMinTotalMs;
  setOptions({windowedChecks: false});
  return ok;
}
function testEarnedSpendUnlocksRides() {
  // Mirror image of the unearned case: once the accumulated spend
  // reaches the budget, the check rides (sinceLast advances, window
  // unchanged) and the stats count one ride next to the single warmup
  // scan. Poked spend again, so the verdict depends on the gate, not on
  // the machine.
  setOptions({windowedChecks: true});
  options.checkStats = true;
  options.mapCheckWindowMinTotalMs = 100;
  resetMapCheckWindows();
  resetCheckStats();
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect); // scan 1: window 2
  mapCheckWindowRecord(map).spentMs = 150; // per spec: the budget is earned
  const second = check(map, expect); // gate open: ride
  const record = snap(mapCheckWindowRecord(map));
  const row = getCheckStats().find(_ => _.loc === 'TestSite#method mapProperty');
  const ok = second.good === true && record.sinceLast === 1 &&
    record.window === 2 && row !== undefined &&
    row.rides === 1 && row.scans === 1;
  resetCheckStats();
  options.checkStats = virginCheckStats;
  options.mapCheckWindowMinTotalMs = virginMapCheckWindowMinTotalMs;
  setOptions({windowedChecks: false});
  return ok;
}
function testSpendGrowsWithEveryScan() {
  // Every scan adds its wall time to the total: with a budget no real
  // spend reaches, repeated checks keep scanning and the total grows
  // monotonically. The comparison is relative (later total strictly
  // above the earlier one on a map big enough to measure), so no wall
  // clock threshold can flake it on fast or slow machines.
  setOptions({windowedChecks: true});
  options.checkStats = true;
  options.mapCheckWindowMinTotalMs = 1000000; // never unlocks here
  resetMapCheckWindows();
  resetCheckStats();
  const entries = [];
  for (let i = 0; i < 20000; i++) {
    entries.push([i, i]);
  }
  const map = new Map(entries);
  const expect = {type: 'map', key: 'number', val: 'number'};
  check(map, expect);
  const first = mapCheckWindowRecord(map).spentMs;
  for (let i = 0; i < 3; i++) {
    check(map, expect);
  }
  const later = mapCheckWindowRecord(map).spentMs;
  const row = getCheckStats().find(_ => _.loc === 'TestSite#method mapProperty');
  const ok = later > first && row !== undefined && row.scans === 4 && row.rides === 0;
  resetCheckStats();
  options.checkStats = virginCheckStats;
  options.mapCheckWindowMinTotalMs = virginMapCheckWindowMinTotalMs;
  setOptions({windowedChecks: false});
  return ok;
}
function testContentChangeBurnsAccumulatedSpend() {
  // The spend validated the old content, so new content must earn its
  // rides from scratch: a size change resets the total even on a map
  // that had already unlocked rides.
  setOptions({windowedChecks: true});
  options.checkStats = true;
  options.mapCheckWindowMinTotalMs = 100;
  resetMapCheckWindows();
  resetCheckStats();
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect); // scan 1: window 2
  mapCheckWindowRecord(map).spentMs = 150; // unlocked
  map.set(2, 'b'); // new content: spend must burn, window restarts
  const rescanned = check(map, expect); // full rescan, not a ride
  const record = mapCheckWindowRecord(map);
  const burned = record.spentMs < 100 && record.window === 2 && record.sinceLast === 0;
  const relocked = check(map, expect); // still locked: another full rescan
  const relockedRecord = snap(mapCheckWindowRecord(map));
  const ok = rescanned.good === true && burned &&
    relocked.good === true && relockedRecord.sinceLast === 0 && relockedRecord.window === 4;
  resetCheckStats();
  options.checkStats = virginCheckStats;
  options.mapCheckWindowMinTotalMs = virginMapCheckWindowMinTotalMs;
  setOptions({windowedChecks: false});
  return ok;
}
function testSpendBudgetIsLiveEditable() {
  // Retuning from the panel must apply at the very next check without a
  // reload: under a budget no real spend reaches, the eligible check
  // still scans; dropping the budget to 0 mid flight makes the very
  // next eligible check ride. Real (poked-free) spend is safe here
  // because both assertions compare budget extremes (a million vs zero).
  setOptions({windowedChecks: true});
  options.checkStats = true;
  options.mapCheckWindowMinTotalMs = 1000000; // nothing accumulates that much
  resetMapCheckWindows();
  resetCheckStats();
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect); // scan 1: window 2, real spend far below the budget
  const gated = check(map, expect); // gate closed: full rescan
  const gatedOk = snap(mapCheckWindowRecord(map)).sinceLast === 0 &&
    snap(mapCheckWindowRecord(map)).window === 4;
  options.mapCheckWindowMinTotalMs = 0; // ride always, again
  const riding = check(map, expect); // gate open: ride inside window 4
  const ridingRecord = snap(mapCheckWindowRecord(map));
  const row = getCheckStats().find(_ => _.loc === 'TestSite#method mapProperty');
  const ok = gatedOk && gated.good === true && riding.good === true &&
    ridingRecord.sinceLast === 1 && ridingRecord.window === 4 &&
    row !== undefined && row.rides === 1 && row.scans === 2;
  resetCheckStats();
  options.checkStats = virginCheckStats;
  options.mapCheckWindowMinTotalMs = virginMapCheckWindowMinTotalMs;
  setOptions({windowedChecks: false});
  return ok;
}
function testUnusableSpendBudgetStaysOpen() {
  // Garbage budgets (only reachable through direct `options` writes, the
  // panel and worker guards reject NaN and negatives) must fall back to
  // no budget instead of silently disabling windowing: windowedChecks
  // was asked for, so rides keep happening like before the option
  // existed. Both spellings of garbage are fed live between checks.
  setOptions({windowedChecks: true});
  options.checkStats = true;
  resetMapCheckWindows();
  resetCheckStats();
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  options.mapCheckWindowMinTotalMs = Number.NaN;
  check(map, expect); // scan 1: window 2
  const nanRide = check(map, expect); // fallback open: ride
  const nanRecord = snap(mapCheckWindowRecord(map));
  options.mapCheckWindowMinTotalMs = -5;
  const dueScan = check(map, expect); // window 2 exhausted: due rescan, window 4
  const negRide = check(map, expect); // fallback open: ride again
  const negRecord = snap(mapCheckWindowRecord(map));
  const row = getCheckStats().find(_ => _.loc === 'TestSite#method mapProperty');
  const ok = nanRide.good === true && nanRecord.sinceLast === 1 &&
    nanRecord.window === 2 && dueScan.good === true &&
    negRide.good === true && negRecord.sinceLast === 1 &&
    negRecord.window === 4 && row !== undefined &&
    row.rides === 2 && row.scans === 2;
  resetCheckStats();
  options.checkStats = virginCheckStats;
  options.mapCheckWindowMinTotalMs = virginMapCheckWindowMinTotalMs;
  setOptions({windowedChecks: false});
  return ok;
}
const tests = [
  testFirstCheckScansAndDoubles,
  testRepeatsSkipUntilWindowHits,
  testDoublingStaysBoundedByCap,
  testSizeChangeRestartsWindow,
  testDirtyMapsRescanEveryTime,
  testContentDriftCaughtWithinWindow,
  testRecordsArePerInstance,
  testUnknownMapHasNoRecord,
  testResetForgetsHistory,
  testRecordTracksLastSize,
  testNumberEdgeKeysStayChecked,
  testDefaultChecksEverythingEveryCheck,
  testWindowedChecksCanMissDriftAtTenthCheck,
  testSetOptionsPatchesAndRejectsUnknown,
  testMapCheckWindowCapIsOptionAndLiveEditable,
  testMapCheckCapFloorsAtOne,
  testCheckStatsCountsRidesAndScans,
  testCheckStatsOffMeansMapChecksCostOneBit,
  testStatsScansRecordUnderPedanticToo,
  testRecordCheckLedgerUsesScanLedgerSeparately,
  testSpendGateShipsAtHundredMs,
  testScanSpendAccumulatesInRecord,
  testSpendGrowsWithEveryScan,
  testUnearnedSpendForcesFullRescan,
  testEarnedSpendUnlocksRides,
  testContentChangeBurnsAccumulatedSpend,
  testSpendBudgetIsLiveEditable,
  testUnusableSpendBudgetStaysOpen,
  testWindowsSpeedupRatio,
];
export {tests};
