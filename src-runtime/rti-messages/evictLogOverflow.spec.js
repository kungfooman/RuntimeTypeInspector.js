import {evictLogOverflow} from './evictLogOverflow.js';
function testUnderCapKeepsOrder() {
  // Below the ceiling nothing moves: order and contents stay untouched.
  const log = [{
    key: 'a',
  }, {
    key: 'b',
  }];
  const out = evictLogOverflow(log, 2);
  return out === log && log.length === 2 && log[0].key === 'a' && log[1].key === 'b';
}
function testOverflowDropsOldestDuplicate() {
  // Over the ceiling the oldest entry with a later same-key twin goes
  // first: one distinct check outranks extra firings of a hot one.
  const log = [{
    key: 'a',
  }, {
    key: 'a',
  }, {
    key: 'b',
  }];
  evictLogOverflow(log, 2);
  return log.length === 2 && log[0].key === 'a' && log[1].key === 'b';
}
function testOverflowNeverDropsLatestEntry() {
  // Duplicates go before distinct keys: the quiet check survives while the
  // hot one's superseded firings cover the overflow.
  const log = [{
    key: 'quiet',
  }, {
    key: 'hot',
  }, {
    key: 'hot',
  }, {
    key: 'hot',
  }];
  evictLogOverflow(log, 2);
  return (
    log.length === 2 &&
    log[0].key === 'quiet' &&
    log[1].key === 'hot'
  );
}
function testOverflowDropsOldestKeysLast() {
  // The ceiling holds even when distinct keys outnumber it: with no
  // duplicates left, the oldest keys fall out and the newest survive.
  const log = [{
    key: 'a',
  }, {
    key: 'b',
  }, {
    key: 'c',
  }];
  evictLogOverflow(log, 2);
  return (
    log.length === 2 &&
    log[0].key === 'b' &&
    log[1].key === 'c'
  );
}
function testGuardedEntriesDropLast() {
  // Guarded entries (the caller's known latest per key) drop after every
  // unguarded one, so pinning biases survival without breaking the ceiling.
  const lone = {
    key: 'lone',
  };
  const log = [lone, {
    key: 'a',
  }, {
    key: 'b',
  }];
  evictLogOverflow(log, 2, new Set([lone]));
  return (
    log.length === 2 &&
    log.includes(lone) &&
    log[log.length - 1].key === 'b'
  );
}
function testGuardedEntriesDropWhenOnlyTheyRemain() {
  // Pinning is bias, not immunity: when only guarded entries remain and the
  // log is still over cap, the oldest guarded entry goes.
  const lone = {
    key: 'lone',
  };
  const other = {
    key: 'other',
  };
  const log = [lone, other];
  evictLogOverflow(log, 1, new Set([lone, other]));
  return log.length === 1 && log[0] === other;
}
function testHostileLogSurvives() {
  // Nulls, keyless shapes and throwing getters never break the report path:
  // junk entries without a later twin are kept as-is, the rest stays.
  const throwing = {};
  Object.defineProperty(throwing, 'key', {
    get() {
      throw new Error('revoked');
    },
  });
  const log = [null, {
    key: 'a',
  }, undefined, throwing, {
    key: 'a',
  }];
  evictLogOverflow(log, 3);
  return (
    log.length === 3 &&
    log[1] === throwing &&
    log[2].key === 'a'
  );
}
function testHostileInputReturnsAsIs() {
  // A non-array log is not ours to fix: hand it back instead of throwing.
  return evictLogOverflow(null, 2) === null;
}
const tests = [
  testUnderCapKeepsOrder,
  testOverflowDropsOldestDuplicate,
  testOverflowNeverDropsLatestEntry,
  testOverflowDropsOldestKeysLast,
  testGuardedEntriesDropLast,
  testGuardedEntriesDropWhenOnlyTheyRemain,
  testHostileLogSurvives,
  testHostileInputReturnsAsIs,
];
export {tests};
