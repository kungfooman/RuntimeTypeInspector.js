import {crossContextPostMessage} from './crossContextPostMessage.js';
import {options                } from './options.js';
/**
 * Posts through a stub bus, returning what was sent.
 * @param {object} msg - The message to post.
 * @returns {object} The message as delivered.
 */
function deliver(msg) {
  let got;
  const origParent = globalThis.parent;
  const origSelf = globalThis.self;
  globalThis.parent = undefined;
  globalThis.self = {
    postMessage: (sent) => {
      got = sent;
    },
  };
  try {
    crossContextPostMessage(msg);
    return got;
  } finally {
    globalThis.parent = origParent;
    globalThis.self = origSelf;
  }
}
function testStampsOwnRuntimeId() {
  // Same-evaluation traffic carries this runtime's id, so the panel can
  // tell its own rows from a worker's or iframe's.
  const got = deliver({
    type: 'rti',
    action: 'addError',
    destination: 'ui',
  });
  return got.source === options.runtimeId && typeof got.source === 'string' && got.source.length > 0;
}
function testCallerSourceWins() {
  // Forwarders and tests stamp their own source: the choke point never
  // overwrites an explicit attribution.
  const got = deliver({
    type: 'rti',
    action: 'addError',
    destination: 'ui',
    source: 'other-runtime',
  });
  return got.source === 'other-runtime';
}
function testNonRtiUntouched() {
  // Non-RTI traffic passes through byte-identical: no source key appears.
  const payload = {
    hello: 'world',
  };
  const got = deliver(payload);
  return got.source === undefined && got.hello === 'world';
}
export const tests = [
  testStampsOwnRuntimeId,
  testCallerSourceWins,
  testNonRtiUntouched,
];
