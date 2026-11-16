import {crossContextPostMessage} from './crossContextPostMessage.js';
/**
 * Coalesced same-shape repeat ticks, keyed by the bare `loc-name` the
 * checking side (`inspectType`) computes. A hot-loop failure would
 * otherwise post one key-only message per check: thousands of `postMessage`
 * clones plus one queued panel task each, and the panel rebuilds the stats
 * table per arrival (`addError` ends in `updateCheckStats`), so the main
 * thread can never drain between frames. Counting pendings here and
 * flushing one delta per task keeps the inbox at one message per key per
 * turn: the hit counts stay exact (every tick increments before the
 * flush), same as before, but the traffic and the rebuilds collapse from
 * per-check to per-key-per-turn.
 * @example
 * noteRepeat('takeFloat-data'); // 1
 * noteRepeat('takeFloat-data'); // 2
 * takeRepeats(); // Map { 'takeFloat-data' => 2 }
 */
const pendingRepeats = new Map();
/**
 * True while a repeat flush is scheduled but not yet run.
 * @type {boolean}
 */
let flushScheduled = false;
/**
 * Records one key-only repeat tick for later flushing. Never throws: the
 * reporting path must survive hostile keys without breaking the check.
 * @param {string} key - Bare `loc-name` of the repeated failure.
 * @returns {number} Pending ticks for this key after recording.
 */
function noteRepeat(key) {
  try {
    const next = (pendingRepeats.get(key) ?? 0) + 1;
    pendingRepeats.set(key, next);
    scheduleRepeatFlush();
    return next;
  } catch {
    return 0;
  }
}
/**
 * Drains the pending repeat ticks. Each entry carries its key plus how
 * many ticks accumulated since the last flush, so the panel bumps hits
 * and totals by the delta instead of by per-check arrivals.
 * @returns {Map<string, number>} Key to tick count, empty when nothing pends.
 */
function takeRepeats() {
  const out = new Map(pendingRepeats);
  pendingRepeats.clear();
  return out;
}
/**
 * Schedules the cross-context flush for the end of the current turn. One
 * scheduled flush covers every tick noted before it runs; ticks noted
 * while a flush is already scheduled simply join it.
 * @returns {void}
 */
function scheduleRepeatFlush() {
  if (pendingRepeats.size === 0) {
    return;
  }
  if (flushScheduled) {
    return;
  }
  flushScheduled = true;
  const run = () => {
    flushScheduled = false;
    flushRepeats();
  };
  try {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(run);
      return;
    }
  } catch {
    // Fall through to the timer below.
  }
  try {
    setTimeout(run, 0);
  } catch {
    flushScheduled = false;
  }
}
/**
 * Posts one coalesced repeat message per pending key: the panel bumps
 * hits and totals by the delta instead of by per-check arrivals. Pendings
 * were already drained by the caller, so a broken bus degrades into lost
 * hit counts, never an ever-growing backlog. Posted through the same
 * cross-context path as first reports, so worker, iframe and window
 * traffic keep their attribution.
 * @returns {void}
 */
function flushRepeats() {
  const pendings = takeRepeats();
  if (pendings.size === 0) {
    return;
  }
  for (const [key, ticks] of pendings) {
    try {
      crossContextPostMessage({
        type: 'rti',
        action: 'addError',
        destination: 'ui',
        key,
        repeat: true,
        ticks,
      });
    } catch {
      // A broken bus drops this key's delta; the loop still posts the rest.
    }
  }
}
export {pendingRepeats, noteRepeat, takeRepeats, flushRepeats};
