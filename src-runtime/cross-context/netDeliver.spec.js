import {netDeliver} from './netDeliver.js';
/**
 * Builds one matching event on the test net.
 * @param {string} verb - The verb to deliver.
 * @param {string|null} to - Recipient id, or null to broadcast.
 * @returns {object} Message event carrying the verb.
 */
function testEvent(verb, to = null) {
  return {
    data: {
      net: 'my-app',
      channel: 'checks',
      verb,
      from: 'a',
      to,
    },
  };
}
function testDeliverRunsVerb() {
  // Matching mail runs its verb handler with envelope plus raw event,
  // so replies can target `data.from` without a lookup.
  let gotData;
  let gotEvent;
  const verbs = new Map([
    ['ping', (data, event) => {
      gotData = data;
      gotEvent = event;
    }],
  ]);
  const event = testEvent('ping');
  const out = netDeliver(event, 'my-app', 'checks', 'b', verbs, () => {});
  return (
    out === true &&
    gotData === event.data &&
    gotEvent === event
  );
}
function testUnknownVerbWarns() {
  // Unknown verbs warn instead of throwing and taking down the dispatch.
  const warns = [];
  const verbs = new Map();
  const event = testEvent('bogus');
  const out = netDeliver(event, 'my-app', 'checks', 'b', verbs, ({verb}) => warns.push(verb));
  return (
    out === false &&
    warns.length === 1 &&
    warns[0] === 'bogus'
  );
}
function testMissedMailStaysSilent() {
  // Mail for another peer or another net never runs and never warns.
  let ran = false;
  let warned = false;
  const verbs = new Map([
    ['ping', () => {
      ran = true;
    }],
  ]);
  const warn = () => {
    warned = true;
  };
  const foreignPeer = netDeliver(testEvent('ping', 'c'), 'my-app', 'checks', 'b', verbs, warn);
  const foreignNet = netDeliver({
    data: {
      net: 'other',
      channel: 'checks',
      verb: 'ping',
      to: null,
    },
  }, 'my-app', 'checks', 'b', verbs, warn);
  return (
    foreignPeer === false &&
    foreignNet === false &&
    ran === false &&
    warned === false
  );
}
export const tests = [
  testDeliverRunsVerb,
  testUnknownVerbWarns,
  testMissedMailStaysSilent,
];
