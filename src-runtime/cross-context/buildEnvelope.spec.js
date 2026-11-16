import {buildEnvelope} from './buildEnvelope.js';
function testBuildsEnvelope() {
  // Tag plus destination stay fixed; the payload rides along untouched.
  const message = buildEnvelope('my-app', 'ping', 'panel', {
    n: 1,
  });
  return (
    message.type === 'my-app' &&
    message.action === 'ping' &&
    message.destination === 'panel' &&
    message.n === 1
  );
}
function testPayloadDefaultsEmpty() {
  // Payload free envelopes still build a valid message.
  const message = buildEnvelope('my-app', 'pong', 'checker');
  return (
    message.type === 'my-app' &&
    message.action === 'pong' &&
    message.destination === 'checker'
  );
}
export const tests = [
  testBuildsEnvelope,
  testPayloadDefaultsEmpty,
];
