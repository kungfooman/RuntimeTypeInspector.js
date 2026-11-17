import {netFanout} from './netFanout.js';
function testFansOutToAll() {
  // One broadcast update reaches every known peer: no silent first only.
  const got = [];
  const first = {
    postMessage(message) {
      got.push(['first', message]);
    },
  };
  const second = {
    postMessage(message) {
      got.push(['second', message]);
    },
  };
  const message = {
    net: 'my-app',
    channel: 'checks',
    verb: 'ping',
  };
  netFanout([first, second], message);
  return (
    got.length === 2 &&
    got[0][1] === message &&
    got[1][1] === message
  );
}
function testBrokenSinkSkipped() {
  // One dead sink (closed worker) must not abort the fan-out: live
  // peers behind it still get the message.
  const got = [];
  const broken = {
    postMessage() {
      throw new Error('closed');
    },
  };
  const live = {
    postMessage(message) {
      got.push(message);
    },
  };
  const message = {
    net: 'my-app',
    channel: 'checks',
    verb: 'ping',
  };
  netFanout([broken, live], message);
  return got.length === 1 && got[0] === message;
}
export const tests = [
  testFansOutToAll,
  testBrokenSinkSkipped,
];
