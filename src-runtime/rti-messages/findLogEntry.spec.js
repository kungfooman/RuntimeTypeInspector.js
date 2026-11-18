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
function testVariantMatchesKeyAndValue() {
  // A value discriminator narrows the fold: the same key with another value
  // is a different variant, so alternating failures keep one slot each.
  const falseFold = {
    key: 'a',
    valueToString: 'false',
  };
  const undefFold = {
    key: 'a',
    valueToString: 'undef',
  };
  const found = findLogEntry([falseFold, undefFold], 'a', 'false');
  return found === falseFold;
}
function testVariantMismatchYieldsUndefined() {
  // A unseen value for a known key is a new variant, not a match: the caller
  // appends a fresh slot instead of overwriting a sibling value.
  const found = findLogEntry([{
    key: 'a',
    valueToString: 'false',
  }], 'a', 'undef');
  return found === undefined;
}
function testAbsentVariantStaysKeyOnly() {
  // Without a discriminator the lookup keeps the old key-only behavior:
  // the newest fold wins no matter which value it holds.
  const older = {
    key: 'a',
    valueToString: 'false',
  };
  const newer = {
    key: 'a',
    valueToString: 'undef',
  };
  return findLogEntry([older, newer], 'a') === newer;
}
export const tests = [
  testFindsNewestMatch,
  testMissingKeyYieldsUndefined,
  testHostileLogYieldsUndefined,
  testVariantMatchesKeyAndValue,
  testVariantMismatchYieldsUndefined,
  testAbsentVariantStaysKeyOnly,
];
