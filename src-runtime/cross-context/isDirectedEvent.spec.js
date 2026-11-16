import {isDirectedEvent} from './isDirectedEvent.js';
function testMatchesTagAndLane() {
  // Same shape, same tag, same lane: the bus claims its own mail.
  const event = {
    data: {
      type: 'my-app',
      destination: 'panel',
      action: 'ping',
    },
  };
  const out = isDirectedEvent(event, 'my-app', 'panel');
  const expected = true;
  return out === expected;
}
function testRejectsForeignMail() {
  // Other tags, other lanes and missing payloads never proceed: one
  // bus stays deaf to analytics, devtools and sibling libs.
  const otherTag = {
    data: {
      type: 'other',
      destination: 'panel',
    },
  };
  const otherLane = {
    data: {
      type: 'my-app',
      destination: 'checker',
    },
  };
  const noDataEvent = {
    data: null,
  };
  const noPayloadEvent = {};
  const otherTagOut = isDirectedEvent(otherTag, 'my-app', 'panel');
  const otherLaneOut = isDirectedEvent(otherLane, 'my-app', 'panel');
  const noDataOut = isDirectedEvent(noDataEvent, 'my-app', 'panel');
  const noPayloadOut = isDirectedEvent(noPayloadEvent, 'my-app', 'panel');
  const noEventOut = isDirectedEvent(null, 'my-app', 'panel');
  const expected = false;
  return (
    otherTagOut === expected &&
    otherLaneOut === expected &&
    noDataOut === expected &&
    noPayloadOut === expected &&
    noEventOut === expected
  );
}
export const tests = [
  testMatchesTagAndLane,
  testRejectsForeignMail,
];
