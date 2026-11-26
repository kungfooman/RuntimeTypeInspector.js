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
// We want: primitives to pass through the spread marker untouched, because
// only objects can carry excess keys and the wrapper must never change values.
function testSpreadMarkPassesPrimitivesThrough() {
  return markFreshSpread(1, ['a']) === 1 && markFreshSpread('s') === 's' && markFreshSpread(null) === null && markFreshSpread(undefined) === undefined;
}
// We want: garbage key lists to degrade to tolerating everything, because
// the written set derives from the transpiled shape and a missing array
// means no key was provably written.
function testSpreadMarkWithoutKeysToleratesAll() {
  const value = markFreshSpread({
    a: 1,
  });
  return isFresh(value) === true && isToleratedSpreadKey(value, 'a') === true && isToleratedSpreadKey(value, 'zzz') === true;
}
// We want: revoked proxies to read stale and tolerated-nothing, because
// every probe traps and fail-closed keeps validation narrowing, never widening.
function testRevokedProxyReadsStale() {
  const target = markFreshSpread({
    a: 1,
  }, ['a']);
  const {proxy, revoke} = Proxy.revocable(target, {});
  revoke();
  return isFresh(proxy) === false && isToleratedSpreadKey(proxy, 'b') === false;
}
// We want: double marking to keep the latest written set, because each
// literal marks at its own call site and re-marking replaces the record.
function testSpreadMarkOverwritesWrittenSet() {
  const value = {
    a: 1,
    b: 2,
  };
  markFreshSpread(value, ['a', 'b']);
  markFreshSpread(value, ['a']);
  return isToleratedSpreadKey(value, 'a') === false && isToleratedSpreadKey(value, 'b') === true;
}
export const tests = [
  testSpreadMarkKeepsFresh,
  testSpreadKeyTolerated,
  testPlainMarkToleratesNothing,
  testStaleToleratesNothing,
  testSpreadMarkPassesPrimitivesThrough,
  testSpreadMarkWithoutKeysToleratesAll,
  testRevokedProxyReadsStale,
  testSpreadMarkOverwritesWrittenSet,
];
