import {findLogEntry} from './findLogEntry.js';
function testFindsNewestMatch() {
  // Two folds share a key: the newest (last pushed) wins, so hit syncs
  // land on the live entry instead of a stale earlier fold.
  const older = {
    key: 'a',
    value: 1,
  };
  const newer = {
    key: 'a',
    value: 2,
  };
  return findLogEntry([older, newer], 'a') === newer;
}
function testMissingKeyYieldsUndefined() {
  // Unknown keys (panel reloaded after the report) have no row to bump and
  // no fold to sync: the lookup says so instead of throwing.
  const found = findLogEntry([{
    key: 'a',
  }], 'nope');
  return found === undefined;
}
function testHostileLogYieldsUndefined() {
  // A corrupted log must degrade into lost hit counts, never into a broken
  // checking side: the lookup reports no match instead of throwing.
  return findLogEntry(null, 'a') === undefined;
}
export const tests = [
  testFindsNewestMatch,
  testMissingKeyYieldsUndefined,
  testHostileLogYieldsUndefined,
];
