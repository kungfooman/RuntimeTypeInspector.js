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
  testBareNodeStaysSilent,
  testThrowingBusStaysSilent,
  testExtraArgsPassThrough,
];
function testBareNodeStaysSilent() {
  // No message host (bare Node loading the runtime) never throws: the
  // report is lost, the check that reported keeps running.
  const origParent = globalThis.parent;
  const origSelf = globalThis.self;
  globalThis.parent = undefined;
  globalThis.self = undefined;
  try {
    crossContextPostMessage({
      type: 'rti',
      action: 'addError',
    });
    return true;
  } finally {
    globalThis.parent = origParent;
    globalThis.self = origSelf;
  }
}
function testThrowingBusStaysSilent() {
  // A closed worker or torn down iframe throws mid post: the error is
  // lost, the check that reported keeps running.
  const origParent = globalThis.parent;
  const origSelf = globalThis.self;
  globalThis.parent = undefined;
  globalThis.self = {
    postMessage: () => {
      throw new Error('closed');
    },
  };
  try {
    crossContextPostMessage({
      type: 'rti',
      action: 'addError',
    });
    return true;
  } finally {
    globalThis.parent = origParent;
    globalThis.self = origSelf;
  }
}
function testExtraArgsPassThrough() {
  // Worker style multi argument posts keep working: transfer lists and
  // friends ride along behind the stamped message.
  const got = [];
  const origParent = globalThis.parent;
  const origSelf = globalThis.self;
  globalThis.parent = undefined;
  globalThis.self = {
    postMessage: (...args) => {
      got.push(...args);
    },
  };
  try {
    const msg = {
      type: 'rti',
      action: 'addError',
      destination: 'ui',
    };
    crossContextPostMessage(msg, 'transfer');
    return (
      got.length === 2 &&
      got[0] === msg &&
      got[1] === 'transfer' &&
      msg.source === options.runtimeId
    );
  } finally {
    globalThis.parent = origParent;
    globalThis.self = origSelf;
  }
}
