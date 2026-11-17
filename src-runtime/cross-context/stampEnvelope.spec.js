import {stampEnvelope} from './stampEnvelope.js';
function testStampsUntaggedEnvelope() {
  // Same peer traffic carries its id, so the receiver can tell its
  // own rows from another context's.
  const message = {
    net: 'my-app',
    verb: 'ping',
  };
  const out = stampEnvelope(message, 'my-app', 'abc');
  return out === message && out.from === 'abc';
}
function testCustomSourceKey() {
  // Projects pick their own stamp field instead of inheriting ours.
  const message = {
    net: 'my-app',
  };
  stampEnvelope(message, 'my-app', 'abc', 'sender');
  return message.sender === 'abc' && message.from === undefined;
}
function testCallerStampWins() {
  // Forwarders keep their own stamp: the choke point never overwrites
  // an explicit attribution, and other nets pass through untouched.
  const message = {
    net: 'my-app',
    verb: 'ping',
    from: 'other',
  };
  stampEnvelope(message, 'my-app', 'abc');
  const otherNetMessage = {
    net: 'other',
  };
  const otherNet = stampEnvelope(otherNetMessage, 'my-app', 'abc');
  return (
    message.from === 'other' &&
    otherNet.from === undefined &&
    stampEnvelope(null, 'my-app', 'abc') === null
  );
}
export const tests = [
  testStampsUntaggedEnvelope,
  testCustomSourceKey,
  testCallerStampWins,
];
