import {netEnvelope} from './netEnvelope.js';
function testBuildsBroadcastByDefault() {
  // No recipient: `to` stays null, every listener on the channel gets it.
  const message = netEnvelope({
    net: 'my-app',
    channel: 'checks',
    verb: 'frame',
    from: 'a',
    payload: {
      n: 1,
    },
  });
  return (
    message.net === 'my-app' &&
    message.channel === 'checks' &&
    message.verb === 'frame' &&
    message.from === 'a' &&
    message.to === null &&
    message.n === 1
  );
}
function testBuildsPointToPoint() {
  // A named recipient: only the peer with that id picks it up.
  const message = netEnvelope({
    net: 'my-app',
    channel: 'checks',
    verb: 'ping',
    from: 'a',
    to: 'b',
  });
  return message.to === 'b' && message.from === 'a';
}
export const tests = [
  testBuildsBroadcastByDefault,
  testBuildsPointToPoint,
];
