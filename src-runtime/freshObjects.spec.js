import {isFresh, isToleratedSpreadKey, markFresh, markFreshSpread} from './freshObjects.js';
// We want: spread-marked values to stay fresh, because the outer literal is
// still a fresh literal and only its spread keys are forgiven.
function testSpreadMarkKeepsFresh() {
  const value = markFreshSpread({
    a: 1,
    b: 2,
  }, ['a']);
  return isFresh(value) === true;
}
// We want: spread keys to tolerate validation, because tsc never
// excess-checks keys arriving through `...spread`.
function testSpreadKeyTolerated() {
  const value = markFreshSpread({
    a: 1,
    b: 2,
  }, ['a']);
  return isToleratedSpreadKey(value, 'b') === true && isToleratedSpreadKey(value, 'a') === false;
}
// We want: plain fresh marks to tolerate nothing, because every key on a
// spread-free literal was written literally and counts like tsc says.
function testPlainMarkToleratesNothing() {
  const value = markFresh({
    a: 1,
    b: 2,
  });
  return isToleratedSpreadKey(value, 'b') === false && isToleratedSpreadKey(value, 'zzz') === false;
}
// We want: stale values to tolerate nothing, because tolerance is a fresh
// literal refinement and stale values already pass structurally.
function testStaleToleratesNothing() {
  const value = {
    a: 1,
  };
  return isToleratedSpreadKey(value, 'a') === false && isToleratedSpreadKey(null, 'a') === false;
}
export const tests = [
  testSpreadMarkKeepsFresh,
  testSpreadKeyTolerated,
  testPlainMarkToleratesNothing,
  testStaleToleratesNothing,
];
