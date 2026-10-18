import './validateType.js';
import {options, setOptions} from './options.js';
import {validateMap} from './validateMap.js';
import {mapCheckWindowRecord, resetMapCheckWindows} from './validateMap.js';
/**
 * The option untouched by any test logic: every windowed behavior test
 * flips `options.windowedChecks` explicitly after starting, so the
 * suite state cannot steer it, while this capture must stay undisturbed.
 * @type {boolean}
 */
const virginWindowedChecks = options.windowedChecks;
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
  const good = validateMap(map, expect, 'TestSite#method', 'mapProperty', true, (msg, info) => {
    messages.push(msg);
    infos.push(info);
  }, depth);
  return {good, infos, messages};
}
function testFirstCheckScansAndDoubles() {
  options.windowedChecks = true;
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
  options.windowedChecks = true;
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
  options.windowedChecks = true;
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
  options.windowedChecks = true;
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
  options.windowedChecks = true;
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
  options.windowedChecks = true;
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
  options.windowedChecks = true;
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
  options.windowedChecks = true;
  resetMapCheckWindows();
  // Asking before any check exists returns nothing.
  return mapCheckWindowRecord(new Map()) === undefined;
}
function testResetForgetsHistory() {
  options.windowedChecks = true;
  resetMapCheckWindows();
  // Resetting makes the next check behave like the first one again.
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect);
  check(map, expect);
  options.windowedChecks = true;
  resetMapCheckWindows();
  return mapCheckWindowRecord(map) === undefined && check(map, expect).good === true;
}
function testRecordTracksLastSize() {
  options.windowedChecks = true;
  resetMapCheckWindows();
  // The record shares the scan result: fresh history keeps the size the
  // scan saw, enabling the size based restart.
  const map = new Map([[1, 'a'], [2, 'b']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  check(map, expect);
  return mapCheckWindowRecord(map).lastSize === map.size;
}
function testNumberEdgeKeysStayChecked() {
  options.windowedChecks = true;
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
  // map cheap. Both sides run the identical work: validateMap on one
  // unchanged 20000 entry map. The pedantic side keeps the option off,
  // so every check pays a full scan. The windowed side turns the option
  // on and warms up to the steady state, where one of every 1024 checks
  // pays a scan and the rest only read the history record. The numbers
  // to expect: a scan costs around 300us at this map size, a windowed
  // check costs well under a microsecond including its shares of the
  // amortized scans, so the ratio lands at a few hundred times,
  // far above the demanded floor and far below a ceiling that would
  // expose the actual check being timed away into nothing.
  options.windowedChecks = false;
  resetMapCheckWindows();
  const entries = [];
  for (let i = 0; i < 20000; i++) {
    entries.push([i, i]);
  }
  const map = new Map(entries);
  const expect = {type: 'map', key: 'number', val: 'number'};
  const warn = () => undefined;
  const checkOnce = () => validateMap(map, expect, 'RatioTest#check', 'mapProperty', true, warn, 0);
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
  const forcedScanUs = perCheckUs(checkOnce, 30);
  options.windowedChecks = true;
  resetMapCheckWindows();
  const windowedUs = perCheckUs(checkOnce, 4096);
  options.windowedChecks = false;
  const demanded = 100;
  const sanity = 5000;
  const actual = Math.round(forcedScanUs / windowedUs);
  if (actual < demanded || actual > sanity) {
    console.error(`expected a speed increase between ${demanded}x and ${sanity}x but got ${actual}x (full scan ${forcedScanUs.toFixed(4)}us, windowed ${windowedUs.toFixed(4)}us per check)`);
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
  options.windowedChecks = false;
  resetMapCheckWindows();
  const map = new Map([[1, 'a']]);
  const expect = {type: 'map', key: 'number', val: 'string'};
  if (!check(map, expect).good) {
    return false;
  }
  map.set(1, 42); // same size, wrong stored value type
  const bad = check(map, expect);
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
  options.windowedChecks = true;
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
  // success.
  setOptions({windowedChecks: false});
  setOptions({windowedChecks: true});
  const patched = options.windowedChecks === true;
  setOptions({windowedChecks: false});
  const restored = options.windowedChecks === false;
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
  return patched && restored && unknownThrew && wrongTypeThrew;
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
  testWindowsSpeedupRatio,
];
export {tests};
