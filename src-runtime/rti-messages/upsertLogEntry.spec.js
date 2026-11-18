import {upsertLogEntry} from './upsertLogEntry.js';
function testNewKeyAppends() {
  // First report for a key lands at the end like a plain push.
  const log = [{
    key: 'a',
  }];
  const entry = {
    key: 'b',
  };
  return upsertLogEntry(log, entry, 1000) === entry && log.length === 2 && log[1] === entry;
}
function testSameKeyReplacesInPlace() {
  // A same-key ("samish") re-report folds into the stored slot: length and
  // position stay put while the content follows the latest failure.
  const log = [{
    key: 'a',
    value: 1,
  }, {
    key: 'b',
    value: 1,
  }];
  const entry = {
    key: 'a',
    value: 2,
  };
  const stored = upsertLogEntry(log, entry, 1000);
  return stored === entry && log.length === 2 && log[0] === entry && log[1].key === 'b';
}
function testCapDropsOldestOnNewKey() {
  // The cap still guards total size: a new key past the ceiling evicts the
  // oldest entry, mirroring the old push-then-splice behavior.
  const log = [{
    key: 'a',
  }, {
    key: 'b',
  }];
  const entry = {
    key: 'c',
  };
  upsertLogEntry(log, entry, 2);
  return log.length === 2 && log[0].key === 'b' && log[1] === entry;
}
function testCapSkipsEvictOnSameKey() {
  // A full log plus a same-key re-report replaces in place without
  // evicting: folding must never drop a neighbor to fit its own update.
  const log = [{
    key: 'a',
    value: 1,
  }, {
    key: 'b',
    value: 1,
  }];
  const entry = {
    key: 'a',
    value: 2,
  };
  upsertLogEntry(log, entry, 2);
  return log.length === 2 && log[0] === entry && log[1].key === 'b';
}
function testFoldInheritsStoredHits() {
  // Folding replaces content, never the count: a fresh entry without `hits`
  // keeps the accumulated firings of the slot it lands in.
  const log = [{
    key: 'a',
    valueToString: 'false',
    hits: 5,
  }];
  const entry = {
    key: 'a',
    valueToString: 'false',
  };
  const stored = upsertLogEntry(log, entry, 1000);
  return stored === entry && stored.hits === 5;
}
function testFreshHitsWinOverStored() {
  // An explicit count on the fresh entry stands: inheritance only fills a
  // missing count, it never overwrites one the caller set.
  const log = [{
    key: 'a',
    hits: 5,
  }];
  const entry = {
    key: 'a',
    hits: 7,
  };
  const stored = upsertLogEntry(log, entry, 1000);
  return stored === entry && stored.hits === 7;
}
function testVariantAppendsNewSlot() {
  // Same key, unseen value: the variant misses every fold and appends a
  // fresh slot, so one check keeps one entry per distinct value.
  const log = [{
    key: 'a',
    valueToString: 'false',
    hits: 2,
  }];
  const entry = {
    key: 'a',
    valueToString: 'undef',
  };
  const stored = upsertLogEntry(log, entry, 1000, 'undef');
  return stored === entry && log.length === 2 && log[1] === entry && log[0].hits === 2;
}
function testVariantFoldsSeenSlot() {
  // Same key, seen value: the re-report folds into its own variant slot
  // with content refreshed and the count inherited, leaving the sibling
  // value's slot untouched.
  const log = [{
    key: 'a',
    valueToString: 'false',
    hits: 2,
  }, {
    key: 'a',
    valueToString: 'undef',
    hits: 1,
  }];
  const entry = {
    key: 'a',
    valueToString: 'false',
  };
  const stored = upsertLogEntry(log, entry, 1000, 'false');
  return stored === entry && stored.hits === 2 && log.length === 2 && log[1].hits === 1;
}
export const tests = [
  testNewKeyAppends,
  testSameKeyReplacesInPlace,
  testCapDropsOldestOnNewKey,
  testCapSkipsEvictOnSameKey,
  testFoldInheritsStoredHits,
  testFreshHitsWinOverStored,
  testVariantAppendsNewSlot,
  testVariantFoldsSeenSlot,
];
