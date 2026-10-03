import {inspectType} from './inspectType.js';
import {breakpoints} from './inspectType.js';
import {reportedKeys} from './reportedKeys.js';
import {options} from './options.js';
import {expandType} from '../src-transpiler/expandType.js';
/**
 * Collects every RTI error message posted for the checks run inside.
 * @param {Function} fn - The checks to run.
 * @returns {object[]} The posted messages, in order.
 */
function capturePosts(fn) {
  const posted = [];
  const origParent = globalThis.parent;
  const origSelf = globalThis.self;
  globalThis.parent = undefined;
  globalThis.self = {addEventListener: () => {}, postMessage: (msg) => {
    posted.push(msg);
  }};
  try {
    fn();
    return posted;
  } finally {
    globalThis.parent = origParent;
    globalThis.self = origSelf;
  }
}
function testFirstFailurePostsFull() {
  // A first-seen key carries the whole diagnostic payload for the panel row.
  try {
    const posted = capturePosts(() => inspectType(['a'], expandType('Array<number>'), 'repeatA', 'x'));
    return posted.length === 1 && posted[0].key === 'repeatA-x' && posted[0].repeat !== true &&
      typeof posted[0].valueToString === 'string' && Array.isArray(posted[0].strings);
  } finally {
    reportedKeys.clear();
  }
}
function testRepeatPostsKeyOnly() {
  // A hot-loop repeat skips previews, clonability probes and the value post:
  // only the key travels, for the panel hits counter.
  try {
    const posted = capturePosts(() => {
      inspectType(['a'], expandType('Array<number>'), 'repeatB', 'x');
      inspectType(['b'], expandType('Array<number>'), 'repeatB', 'x');
    });
    if (posted.length !== 2) {
      return false;
    }
    const [, repeat] = posted;
    return repeat.repeat === true && repeat.key === 'repeatB-x' &&
      !('value' in repeat) && !('valueToString' in repeat) && !('strings' in repeat) &&
      !('extras' in repeat) && !('expect' in repeat);
  } finally {
    reportedKeys.clear();
  }
}
function testRepeatStillValidates() {
  // Dedup skips the report, never the validation: repeats still fail and a
  // fixed value still passes, while the totals counter keeps counting.
  try {
    const before = options.count;
    let first;
    let second;
    let third;
    const posted = capturePosts(() => {
      first = inspectType(['a'], expandType('Array<number>'), 'repeatC', 'x');
      second = inspectType(['b'], expandType('Array<number>'), 'repeatC', 'x');
      third = inspectType([1], expandType('Array<number>'), 'repeatC', 'x');
    });
    return first === false && second === false && third === true &&
      posted.length === 2 && options.count === before + 2;
  } finally {
    reportedKeys.clear();
  }
}
function testSpamSendsFullTwice() {
  // `spam` means every message: dedup stays off and both failures post full.
  const prevMode = options.mode;
  options.mode = 'spam';
  try {
    const posted = capturePosts(() => {
      inspectType(['a'], expandType('Array<number>'), 'repeatD', 'x');
      inspectType(['b'], expandType('Array<number>'), 'repeatD', 'x');
    });
    return posted.length === 2 && posted.every((_) => _.repeat !== true && typeof _.valueToString === 'string');
  } finally {
    options.mode = prevMode;
    reportedKeys.clear();
  }
}
function testNeverDedups() {
  // `never` only mutes the console; the panel table still dedups like `once`.
  const prevMode = options.mode;
  options.mode = 'never';
  try {
    const posted = capturePosts(() => {
      inspectType(['a'], expandType('Array<number>'), 'repeatE', 'x');
      inspectType(['b'], expandType('Array<number>'), 'repeatE', 'x');
    });
    return posted.length === 2 && posted[0].repeat !== true && posted[1].repeat === true;
  } finally {
    options.mode = prevMode;
    reportedKeys.clear();
  }
}
function testBreakpointFiresOnRepeat() {
  // Breakpoints are checked before the dedup gate: arming one after the
  // first report still traps the next failure instead of staying silent.
  try {
    const posted = capturePosts(() => {
      inspectType(['a'], expandType('Array<number>'), 'repeatF', 'x');
      breakpoints.add('repeatF-x');
      inspectType(['b'], expandType('Array<number>'), 'repeatF', 'x');
    });
    return posted.some((_) => _.action === 'deleteBreakpoint' && _.key === 'repeatF-x') &&
      !breakpoints.has('repeatF-x');
  } finally {
    breakpoints.delete('repeatF-x');
    reportedKeys.clear();
  }
}
function testDistinctArgsEachReportFull() {
  // Keys are per-argument: one argument failing (string for number) never
  // spends another argument's first report — each posts in full once.
  try {
    const posted = capturePosts(() => {
      inspectType('x', expandType('number'), 'takeTwo', 'first');
      inspectType('y', expandType('number'), 'takeTwo', 'second');
      inspectType('z', expandType('number'), 'takeTwo', 'first');
    });
    if (posted.length !== 3) {
      return false;
    }
    const [a, b, c] = posted;
    return a.repeat !== true && a.name === 'first' &&
      b.repeat !== true && b.name === 'second' &&
      c.repeat === true && c.key === 'takeTwo-first';
  } finally {
    reportedKeys.clear();
  }
}
function testModeChangeRepostsFull() {
  // Same key, new failure mode: a string, then an object, then a string
  // again each report in full, so the panel row follows the latest failure
  // instead of freezing on the first; only the same-shape repeat ticks.
  try {
    const posted = capturePosts(() => {
      inspectType('x', expandType('number'), 'takeModes', 'v');
      inspectType({a: 1}, expandType('number'), 'takeModes', 'v');
      inspectType('y', expandType('number'), 'takeModes', 'v');
      inspectType('z', expandType('number'), 'takeModes', 'v');
    });
    if (posted.length !== 4) {
      return false;
    }
    const [a, b, c, d] = posted;
    return a.repeat !== true && b.repeat !== true && c.repeat !== true &&
      d.repeat === true && d.key === 'takeModes-v';
  } finally {
    reportedKeys.clear();
  }
}
function testRepeatsStayCheap() {
  // Timing guard for the hot-loop path: N repeats must stay a small
  // fraction of N full reports for the same value. Same process back to
  // back, so the ratio survives slow machines where absolute budgets lie.
  const big = Array.from({length: 5000}, (_, i) => i);
  const expect = expandType('string');
  const calls = 50;
  const margin = 10;
  try {
    let fullMs = 0;
    let repeatMs = 0;
    capturePosts(() => {
      for (let i = 0; i < 5; i++) {
        inspectType(big, expect, `perfWarm${i}`, 'x');
      }
      let start = performance.now();
      for (let i = 0; i < calls; i++) {
        inspectType(big, expect, `perfFull${i}`, 'x');
      }
      fullMs = performance.now() - start;
      inspectType(big, expect, 'perfRepeat', 'x');
      start = performance.now();
      for (let i = 0; i < calls; i++) {
        inspectType(big, expect, 'perfRepeat', 'x');
      }
      repeatMs = performance.now() - start;
    });
    console.log(`perf: ${calls} full=${fullMs.toFixed(1)}ms repeats=${repeatMs.toFixed(1)}ms`);
    return repeatMs * margin < fullMs;
  } finally {
    reportedKeys.clear();
  }
}
const tests = [
  testFirstFailurePostsFull,
  testRepeatPostsKeyOnly,
  testRepeatStillValidates,
  testSpamSendsFullTwice,
  testNeverDedups,
  testBreakpointFiresOnRepeat,
  testDistinctArgsEachReportFull,
  testModeChangeRepostsFull,
  testRepeatsStayCheap,
];
export {tests};
