import {netListen} from './netListen.js';
/**
 * Builds a fake bus host with storable, firievable listeners.
 * @returns {object} Host with `fired` capture plus listener wiring.
 */
function testHost() {
  const listeners = new Map();
  return {
    fired: [],
    addEventListener(type, fn) {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      const kept = (listeners.get(type) ?? []).filter((keptFn) => keptFn !== fn);
      listeners.set(type, kept);
    },
    fire(type, event) {
      for (const fn of listeners.get(type) ?? []) {
        fn(event);
      }
    },
    count(type) {
      return (listeners.get(type) ?? []).length;
    },
  };
}
/**
 * Builds one matching event on the test net.
 * @param {string} verb - The verb to deliver.
 * @returns {object} Message event carrying the verb.
 */
function testEvent(verb) {
  return {
    data: {
      net: 'my-app',
      channel: 'checks',
      verb,
      from: 'a',
      to: null,
    },
  };
}
function testListensAndUnsubscribes() {
  // Subscribed verbs run; the unsubscribe closure removes the listener,
  // so short lived contexts never leak after teardown.
  const host = testHost();
  const got = [];
  const verbs = new Map([
    ['ping', (data) => {
      got.push(data.verb);
    }],
  ]);
  const off = netListen(host, 'my-app', 'checks', 'b', verbs, () => {});
  host.fire('message', testEvent('ping'));
  const before = host.count('message');
  off();
  host.fire('message', testEvent('ping'));
  return (
    got.length === 1 &&
    before === 1 &&
    host.count('message') === 0
  );
}
function testBareHostStaysSilent() {
  // Bare Node has no message host: subscribing degrades into a no-op
  // unsubscribe instead of throwing at import time.
  const off = netListen(undefined, 'my-app', 'checks', 'b', new Map(), () => {});
  off();
  return true;
}
export const tests = [
  testListensAndUnsubscribes,
  testBareHostStaysSilent,
];
