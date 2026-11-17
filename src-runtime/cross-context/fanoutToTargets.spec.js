import {fanoutToTargets} from './fanoutToTargets.js';
function testFansOutToAll() {
  // Every known checking context gets the setting: no silent first only.
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
    net: 'net',
  };
  fanoutToTargets([first, second], message);
  return (
    got.length === 2 &&
    got[0][1] === message &&
    got[1][1] === message
  );
}
function testBrokenSinkSkipped() {
  // One dead sink (closed worker) must not abort the fan out: the live
  // contexts behind it still get the setting.
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
    net: 'net',
  };
  fanoutToTargets([broken, live], message);
  return got.length === 1 && got[0] === message;
}
function testEmptyFanoutIsSilent() {
  // No known contexts yet (worker not started) is a no-op, not a throw.
  fanoutToTargets([], {
    net: 'net',
  });
  fanoutToTargets(null, {
    net: 'net',
  });
  return true;
}
export const tests = [
  testFansOutToAll,
  testBrokenSinkSkipped,
  testEmptyFanoutIsSilent,
];
