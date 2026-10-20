import {validators} from "./validators.js";
import {options} from "./options.js";
import {recordArrayScan, recordSetScan, recordObjectScan} from "./checkStats.js";
import {timeWalk} from "./timeWalk.js";
/**
 * Wraps one container validator with walk timing: the wrapper builds a
 * `done` closure via `timeWalk` and delegates the verdict to the kept
 * original, so the core validator stays free of stats concerns. The
 * wrapper reads the table at call time, so later overrides compose.
 * @param {string} key - The `validators` table entry to wrap, like `validateArray`.
 * @param {function(string, string, number): void} record - Kind recorder like `recordArrayScan`.
 * @example
 * wrapWithWalkTimer('validateArray', recordArrayScan);
 * validators.validateArray; // timed wrapper around the pure core
 */
function wrapWithWalkTimer(key, record) {
  const orig = validators[key];
  const timed = (value, expect, loc, name, critical, warn, depth) => {
    // Gated inside, never unwired: when stats are off this is one
    // boolean read and a direct delegate, so a disabled timer costs no
    // clock calls and no bookkeeping. Stacking stays correct because
    // each wrapper only reads its own flag.
    if (!options.checkStats) {
      return orig(value, expect, loc, name, critical, warn, depth);
    }
    const done = timeWalk(loc, name, record);
    return done(orig(value, expect, loc, name, critical, warn, depth));
  };
  timed.walkOrig = orig;
  timed.walkTimed = true;
  validators[key] = timed;
}
/**
 * Installs walk timing on the five container validators (array,
 * arrayLike, sparse, set, record): each table entry becomes a thin timed
 * wrapper around its pure core, so the hotspot table can split a loc's
 * cost by container. Cores stay importable direct for specs; the timed
 * path is whatever the dispatch table holds. Safe to call once at
 * startup: entries already wrapped are left alone.
 * @example
 * installWalkTimers();
 * validators.validateArray; // timed wrapper, core untouched
 */
function installWalkTimers() {
  const timed = [
    ['validateArray', recordArrayScan],
    ['validateArrayLike', recordArrayScan],
    ['validateArrayLikeSparse', recordArrayScan],
    ['validateSet', recordSetScan],
    ['validateRecord', recordObjectScan],
  ];
  for (const [key, record] of timed) {
    if (typeof validators[key] === 'function' && validators[key].walkTimed !== true) {
      wrapWithWalkTimer(key, record);
    }
  }
}
/**
 * Removes the walk timing wrappers installed by `installWalkTimers`,
 * restoring the pure cores underneath. Test-only teardown: production
 * never unwires, each wrapper gates on the flag at call time. Entries
 * wrapped by someone else after install are left alone.
 * @example
 * resetWalkTimers();
 * validators.validateArray.walkTimed; // undefined
 */
function resetWalkTimers() {
  for (const key of ['validateArray', 'validateArrayLike', 'validateArrayLikeSparse', 'validateSet', 'validateRecord']) {
    const timed = validators[key];
    if (typeof timed === 'function' && timed.walkTimed === true && typeof timed.walkOrig === 'function') {
      validators[key] = timed.walkOrig;
    }
  }
}
export {installWalkTimers, resetWalkTimers, wrapWithWalkTimer};
