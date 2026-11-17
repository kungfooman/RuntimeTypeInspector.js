import {stampSource} from './stampSource.js';
function testStampsUnstamped() {
  // Same evaluation traffic carries this runtime's id, so the panel can
  // tell its own rows from a worker's or iframe's. The stamp lands on a
  // copy, never on the caller's object: posting a frozen message works,
  // and reuse after posting stays safe.
  const message = {
    type: 'rti',
    action: 'addError',
  };
  const out = stampSource(message, 'abc');
  return (
    out !== message &&
    out.source === 'abc' &&
    message.source === undefined &&
    out.action === 'addError'
  );
}
function testFrozenStampsCleanly() {
  // A frozen envelope posts fine: the stamp needs no write access to
  // the caller's object because the copy carries it.
  const message = Object.freeze({
    type: 'rti',
    action: 'addError',
  });
  const out = stampSource(message, 'abc');
  return out !== message && out.source === 'abc';
}
function testCallerSourceWins() {
  // Forwarders and tests stamp their own source: the choke point never
  // overwrites an explicit attribution, and allocates no copy either.
  const message = {
    type: 'rti',
    action: 'addError',
    source: 'other-runtime',
  };
  const out = stampSource(message, 'abc');
  return out === message && message.source === 'other-runtime';
}
function testNonRtiUntouched() {
  // Non RTI traffic passes through untouched: no source key appears,
  // and no copy is allocated either. Same for arrays and null.
  const payload = {
    hello: 'world',
  };
  const boxed = [1, 2];
  const out = stampSource(payload, 'abc');
  return (
    out === payload &&
    out.source === undefined &&
    out.hello === 'world' &&
    stampSource(null, 'abc') === null &&
    stampSource(boxed, 'abc') === boxed
  );
}
export const tests = [
  testStampsUnstamped,
  testFrozenStampsCleanly,
  testCallerSourceWins,
  testNonRtiUntouched,
];
