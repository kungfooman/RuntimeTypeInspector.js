import {netMatch} from './netMatch.js';
function testBroadcastMatchesEveryPeer() {
  // `to: null` is a broadcast: every peer on the channel receives it.
  const event = {
    data: {
      net: 'my-app',
      channel: 'checks',
      verb: 'frame',
      to: null,
    },
  };
  const first = netMatch(event, 'my-app', 'checks', 'a');
  const second = netMatch(event, 'my-app', 'checks', 'b');
  return first === true && second === true;
}
function testPointToPointMatchesOnlyRecipient() {
  // Named mail reaches only its recipient: siblings on the channel stay deaf.
  const data = {
    net: 'my-app',
    channel: 'checks',
    verb: 'ping',
    to: 'b',
  };
  const event = {data};
  const recipient = netMatch(event, 'my-app', 'checks', 'b');
  const stranger = netMatch(event, 'my-app', 'checks', 'a');
  return recipient === true && stranger === false;
}
function testForeignMailMisses() {
  // Other nets, other channels and missing shapes never match: one net
  // stays deaf to analytics, devtools and sibling libs on the same bus.
  const otherNet = {
    data: {
      net: 'other',
      channel: 'checks',
      to: null,
    },
  };
  const otherChannel = {
    data: {
      net: 'my-app',
      channel: 'other',
      to: null,
    },
  };
  const noDataEvent = {
    data: null,
  };
  const noPayloadEvent = {};
  const otherNetOut = netMatch(otherNet, 'my-app', 'checks', 'a');
  const otherChannelOut = netMatch(otherChannel, 'my-app', 'checks', 'a');
  const noDataOut = netMatch(noDataEvent, 'my-app', 'checks', 'a');
  const noPayloadOut = netMatch(noPayloadEvent, 'my-app', 'checks', 'a');
  const noEventOut = netMatch(null, 'my-app', 'checks', 'a');
  const expected = false;
  return (
    otherNetOut === expected &&
    otherChannelOut === expected &&
    noDataOut === expected &&
    noPayloadOut === expected &&
    noEventOut === expected
  );
}
export const tests = [
  testBroadcastMatchesEveryPeer,
  testPointToPointMatchesOnlyRecipient,
  testForeignMailMisses,
];
