import '../validateType.js';
import {validators} from '../validators.js';
import {validateArray} from '../validateArray.js';
import {installWalkTimers, resetWalkTimers, wrapWithWalkTimer} from './installWalkTimers.js';
import {recordArrayScan, getCheckStats, resetCheckStats} from '../checkStats.js';
import {options, setOptions} from '../options.js';
const virginCheckStats = options.checkStats;
function testWrapDelegatesVerdict() {
  // The wrapper preserves the core verdict for good and bad input, and
  // forwards warnings: timing must never change validation.
  const messages = [];
  const warn = (msg) => messages.push(msg);
  const key = 'validateArrayWrapProbe';
  validators[key] = validateArray;
  wrapWithWalkTimer(key, recordArrayScan);
  try {
    const good = validators[key]([1, 2], {elementType: 'number'}, 'T#x', 'items', true, warn, 0);
    const bad = validators[key]([1, 'a'], {elementType: 'number'}, 'T#x', 'items', true, warn, 0);
    return good === true && bad === false && messages.some((_) => _.includes('wrong type'));
  } finally {
    delete validators[key];
  }
}
function testInstallTimesTableButNotDirectImport() {
  // The table entry records a walk row while the direct import stays
  // pure: specs keep testing cores, the pipeline gets timing, and
  // double install does not double wrap. `validateType.js` already
  // installed at import, so this pins the shipped wiring, not a manual
  // call.
  options.checkStats = true;
  resetCheckStats();
  installWalkTimers();
  try {
    const tabled = validators.validateArray([1, 'a'], {elementType: 'number'}, 'T#x', 'items', true, () => {}, 0);
    const rows = getCheckStats();
    const timed = rows.length === 1 && rows[0].loc === 'T#x items' && rows[0].arrayWalks === 1;
    resetCheckStats();
    const direct = validateArray([1, 'a'], {elementType: 'number'}, 'T#x', 'items', true, () => {}, 0);
    const pure = getCheckStats().length === 0;
    return tabled === false && direct === false && timed && pure;
  } finally {
    options.checkStats = virginCheckStats;
  }
}
function testDisabledTimerCostsOneBit() {
  // Gated inside, never unwired: with stats off the wrapper delegates
  // straight to the core without building a timer, so a disabled timer
  // costs one boolean read. The no-clock proof lives in
  // `timeWalk.spec.js` (`testOffIsPassthrough` runs with a hostile
  // clock and fails if the gate is removed there): this test pins the
  // wrapper's own contract instead, that a disabled table entry
  // validates exactly like its pure core and records nothing. A removed
  // wrapper gate still passes here only because `timeWalk` gates
  // inside, which is defense in depth, not the contract under test.
  // Reset plus a fresh wrap pins this spec's entry and not whatever
  // `validateType.js` installed at import.
  options.checkStats = false;
  resetCheckStats();
  const key = 'validateArray';
  resetWalkTimers();
  validators[key] = validateArray;
  wrapWithWalkTimer(key, recordArrayScan);
  try {
    const clean = validators[key]([1, 2], {elementType: 'number'}, 'T#x', 'items', true, () => {}, 0);
    const dirty = validators[key]([1, 'a'], {elementType: 'number'}, 'T#x', 'items', true, () => {}, 0);
    return clean === true && dirty === false && getCheckStats().length === 0;
  } finally {
    resetWalkTimers();
    installWalkTimers();
    options.checkStats = virginCheckStats;
  }
}
function testEnableAfterSkippedInstallWiresTable() {
  // The zero-cost path: when stats were off at import, the table holds
  // pure cores. Enabling via `setOptions` installs the timed wrappers,
  // and the table entry then records while the direct import stays
  // pure. The deferred install resolves before the next macrotask, so
  // the test polls a few ticks instead of assuming a timer phase.
  const key = 'validateArray';
  const core = validateArray;
  const wasTimed = validators[key].walkTimed === true;
  validators[key] = core;
  options.checkStats = false;
  resetCheckStats();
  setOptions({checkStats: true});
  const waits = [10, 20, 40, 80];
  const poll = () => {
    if (validators[key].walkTimed === true || waits.length === 0) {
      try {
        const tabled = validators[key]([1, 'a'], {elementType: 'number'}, 'T#x', 'items', true, () => {}, 0);
        const rows = getCheckStats();
        const timed = tabled === false && rows.length === 1 && rows[0].arrayWalks === 1;
        resetCheckStats();
        const direct = validateArray([1, 'a'], {elementType: 'number'}, 'T#x', 'items', true, () => {}, 0);
        return timed && direct === false && getCheckStats().length === 0;
      } finally {
        if (!wasTimed) {
          validators[key] = core;
        }
        options.checkStats = virginCheckStats;
      }
    }
    return new Promise((resolve) => {
      const wait = waits.shift();
      setTimeout(() => {
        resolve(poll());
      }, wait);
    });
  };
  return poll();
}
const tests = [
  testWrapDelegatesVerdict,
  testInstallTimesTableButNotDirectImport,
  testDisabledTimerCostsOneBit,
  testEnableAfterSkippedInstallWiresTable,
];
export {tests};
