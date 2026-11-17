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
export const tests = [
  testNewKeyAppends,
  testSameKeyReplacesInPlace,
  testCapDropsOldestOnNewKey,
  testCapSkipsEvictOnSameKey,
];
