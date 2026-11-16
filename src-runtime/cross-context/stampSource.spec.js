import {stampSource} from './stampSource.js';
function testStampsUnstamped() {
  // Same evaluation traffic carries this runtime's id, so the panel can
  // tell its own rows from a worker's or iframe's.
  const message = {
    type: 'rti',
    action: 'addError',
  };
  const out = stampSource(message, 'abc');
  return out === message && out.source === 'abc';
}
function testCallerSourceWins() {
  // Forwarders and tests stamp their own source: the choke point never
  // overwrites an explicit attribution.
  const message = {
    type: 'rti',
    action: 'addError',
    source: 'other-runtime',
  };
  stampSource(message, 'abc');
  return message.source === 'other-runtime';
}
function testNonRtiUntouched() {
  // Non RTI traffic passes through untouched: no source key appears.
  const payload = {
    hello: 'world',
  };
  const out = stampSource(payload, 'abc');
  return (
    out === payload &&
    out.source === undefined &&
    out.hello === 'world' &&
    stampSource(null, 'abc') === null
  );
}
export const tests = [
  testStampsUnstamped,
  testCallerSourceWins,
  testNonRtiUntouched,
];
