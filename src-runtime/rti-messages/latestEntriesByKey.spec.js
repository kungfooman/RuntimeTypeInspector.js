import {latestEntriesByKey} from './latestEntriesByKey.js';
function testNewestWinsPerKey() {
  // The map holds each key's latest entry: content comes from the newest.
  const first = {
    key: 'a',
    v: 1,
  };
  const second = {
    key: 'a',
    v: 2,
  };
  const latest = latestEntriesByKey([first, second]);
  return latest.size === 1 && latest.get('a') === second;
}
function testSkipsJunkEntries() {
  // Nulls, keyless shapes and non-string keys never make the map: only
  // real entries decide what the latest entry is.
  const good = {
    key: 'a',
  };
  const latest = latestEntriesByKey([null, good, {
    v: 1,
  }, {
    key: 7,
  }]);
  return latest.size === 1 && latest.get('a') === good;
}
function testHostileInputYieldsEmptyMap() {
  // A hostile log reads as no latest entries instead of breaking the call.
  const latest = latestEntriesByKey(null);
  return latest instanceof Map && latest.size === 0;
}
const tests = [
  testNewestWinsPerKey,
  testSkipsJunkEntries,
  testHostileInputYieldsEmptyMap,
];
export {tests};
