import {noteRepeat, takeRepeats, pendingRepeats, flushRepeats} from './pendingRepeats.js';
/**
 * Records ticks without flushing, so specs observe the batching that the
 * live flush would post as one delta message per key.
 * @returns {number[]} Pending tick counts per key, in insertion order.
 */
function pendingCounts() {
  return [...takeRepeats().values()];
}
function testNotesAccumulatePerKey() {
  // Hot-loop ticks for one key accumulate: the flush posts one message
  // carrying the delta, not one message per tick.
  try {
    noteRepeat('hotA-x');
    noteRepeat('hotA-x');
    noteRepeat('hotB-y');
    const drained = takeRepeats();
    return (
      drained.get('hotA-x') === 2 &&
      drained.get('hotB-y') === 1 &&
      pendingRepeats.size === 0
    );
  } finally {
    takeRepeats();
  }
}
function testTakeDrains() {
  // Draining empties the pendings: a second take sees nothing, so a flush
  // never double-posts the same ticks.
  try {
    noteRepeat('drainA-x');
    const first = pendingCounts();
    const second = pendingCounts();
    return first.length === 1 && first[0] === 1 && second.length === 0;
  } finally {
    takeRepeats();
  }
}
function testFlushPostsOneDeltaPerKey() {
  // The flush posts one coalesced message per key carrying the tick count:
  // the panel bumps hits by the delta exactly once per flush per key.
  const posted = [];
  const origParent = globalThis.parent;
  const origSelf = globalThis.self;
  globalThis.parent = undefined;
  globalThis.self = {
    addEventListener: () => {},
    postMessage: (msg) => {
      posted.push(msg);
    },
  };
  try {
    takeRepeats();
    noteRepeat('flushA-x');
    noteRepeat('flushA-x');
    noteRepeat('flushB-y');
    flushRepeats();
    if (posted.length !== 2) {
      return false;
    }
    const byKey = new Map(posted.map((msg) => [msg.key, msg]));
    const first = byKey.get('flushA-x');
    const second = byKey.get('flushB-y');
    return (
      first.repeat === true &&
      first.ticks === 2 &&
      second.repeat === true &&
      second.ticks === 1 &&
      first.destination === 'ui' &&
      first.type === 'rti' &&
      first.action === 'addError'
    );
  } finally {
    globalThis.parent = origParent;
    globalThis.self = origSelf;
    takeRepeats();
  }
}
function testFlushEmptyPostsNothing() {
  // An empty flush posts nothing: idle turns stay silent on the bus.
  const posted = [];
  const origParent = globalThis.parent;
  const origSelf = globalThis.self;
  globalThis.parent = undefined;
  globalThis.self = {
    addEventListener: () => {},
    postMessage: (msg) => {
      posted.push(msg);
    },
  };
  try {
    takeRepeats();
    flushRepeats();
    return posted.length === 0;
  } finally {
    globalThis.parent = origParent;
    globalThis.self = origSelf;
    takeRepeats();
  }
}
const tests = [
  testNotesAccumulatePerKey,
  testTakeDrains,
  testFlushPostsOneDeltaPerKey,
  testFlushEmptyPostsNothing,
];
export {tests};
