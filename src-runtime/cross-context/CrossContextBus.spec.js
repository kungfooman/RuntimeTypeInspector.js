import {CrossContextBus} from './CrossContextBus.js';
/**
 * Runs a closure with exact `parent`/`self` globals, restoring after.
 * @param {*} parentValue - Value for `globalThis.parent` (`undefined` deletes).
 * @param {*} selfValue - Value for `globalThis.self` (`undefined` deletes).
 * @param {Function} fn - The closure to run.
 * @returns {*} The closure result.
 */
function withTargets(parentValue, selfValue, fn) {
  const savedParent = globalThis.parent;
  const savedSelf = globalThis.self;
  if (parentValue === undefined) {
    delete globalThis.parent;
  } else {
    globalThis.parent = parentValue;
  }
  if (selfValue === undefined) {
    delete globalThis.self;
  } else {
    globalThis.self = selfValue;
  }
  try {
    return fn();
  } finally {
    if (savedParent === undefined) {
      delete globalThis.parent;
    } else {
      globalThis.parent = savedParent;
    }
    if (savedSelf === undefined) {
      delete globalThis.self;
    } else {
      globalThis.self = savedSelf;
    }
  }
}
/**
 * Builds one test peer with no shared vocabulary, so no spec can
 * pass by accident of sharing another project's words.
 * @returns {CrossContextBus} Test peer with its own net and id.
 */
function testBus() {
  return new CrossContextBus({
    net: 'my-app',
    id: 'panel',
  });
}
function testRequiresExplicitSettings() {
  // No silent vocabulary: every project names its own net and id.
  let failures = 0;
  try {
    expectConstructed(new CrossContextBus({}));
  } catch {
    failures += 1;
  }
  try {
    expectConstructed(new CrossContextBus({
      net: 'my-app',
    }));
  } catch {
    failures += 1;
  }
  return failures === 2;
}
/**
 * Binds a constructed peer so `no-new` stays quiet: the throw (or the
 * binding) is the assertion, the value itself is never read.
 * @param {CrossContextBus} bus - The constructed peer.
 * @returns {void}
 */
function expectConstructed(bus) {
  if (bus === null) {
    throw new Error('unreachable');
  }
}
function testMessageBuildsEnvelope() {
  // Tag plus sender stay fixed; recipient and payload ride along.
  const bus = testBus();
  const message = bus.message('checks', 'frame', 'checker', {
    n: 1,
  });
  return (
    message.net === 'my-app' &&
    message.channel === 'checks' &&
    message.verb === 'frame' &&
    message.from === 'panel' &&
    message.to === 'checker' &&
    message.n === 1
  );
}
function testMessageBroadcastsByDefault() {
  // No recipient: every listener on the channel receives it.
  const bus = testBus();
  const message = bus.message('checks', 'frame');
  return message.to === null && message.from === 'panel';
}
function testStampKeepsCallerStamp() {
  // Same peer stamps its id; forwarders keep their own stamp.
  const bus = testBus();
  const own = bus.stamp({
    net: 'my-app',
  });
  const foreign = bus.stamp({
    net: 'my-app',
    from: 'other',
  });
  const otherNet = bus.stamp({
    net: 'other',
  });
  return (
    own.from === bus.id &&
    foreign.from === 'other' &&
    otherNet.from === undefined
  );
}
function testCustomSourceKey() {
  // Projects pick their own stamp field instead of inheriting ours.
  const bus = new CrossContextBus({
    net: 'my-app',
    id: 'panel',
    sourceKey: 'sender',
  });
  const message = bus.stamp({
    net: 'my-app',
  });
  return message.sender === 'panel' && message.from === undefined;
}
function testPostStampsAndTargetsParent() {
  // Posting stamps and targets the parent when framed: one call, same object.
  const parent = {
    posted: [],
    postMessage(message) {
      this.posted.push(message);
    },
  };
  const bus = testBus();
  return withTargets(parent, {
    postMessage() {},
  }, () => {
    const message = {
      net: 'my-app',
      channel: 'checks',
      verb: 'frame',
      from: 'panel',
    };
    bus.post(message);
    return (
      parent.posted.length === 1 &&
      parent.posted[0] === message &&
      message.from === bus.id
    );
  });
}
function testIsOursMatchesAddressing() {
  // Broadcasts reach every peer; named mail reaches only its recipient;
  // other nets and channels stay deaf.
  const bus = testBus();
  const broadcast = {
    data: {
      net: 'my-app',
      channel: 'checks',
      to: null,
    },
  };
  const named = {
    data: {
      net: 'my-app',
      channel: 'checks',
      to: 'panel',
    },
  };
  const foreign = {
    data: {
      net: 'other',
      channel: 'checks',
      to: null,
    },
  };
  const wrongChannel = {
    data: {
      net: 'my-app',
      channel: 'other',
      to: null,
    },
  };
  return (
    bus.isOurs(broadcast, 'checks') === true &&
    bus.isOurs(named, 'checks') === true &&
    bus.isOurs(foreign, 'checks') === false &&
    bus.isOurs(broadcast, 'other') === false &&
    bus.isOurs(wrongChannel, 'checks') === false
  );
}
function testDispatchRunsVerb() {
  // Dispatch runs the verb on the channel; unknown verbs warn once.
  const bus = testBus();
  let got;
  const verbs = new Map([['frame', (data) => {
    got = data;
  }]]);
  const event = {
    data: {
      net: 'my-app',
      channel: 'checks',
      verb: 'frame',
      from: 'checker',
      to: null,
    },
  };
  const warns = [];
  const ran = bus.dispatch(event, 'checks', verbs, ({verb}) => warns.push(verb));
  const unknown = {
    data: {
      net: 'my-app',
      channel: 'checks',
      verb: 'bogus',
      from: 'checker',
      to: null,
    },
  };
  const missed = bus.dispatch(unknown, 'checks', verbs, ({verb}) => warns.push(verb));
  return (
    ran === true &&
    got === event.data &&
    missed === false &&
    warns.length === 1 &&
    warns[0] === 'bogus'
  );
}
function testListenSubscribes() {
  // Listening wires the host and returns the unsubscribe closure.
  const bus = testBus();
  const host = {
    added: [],
    removed: [],
    addEventListener(type, fn) {
      this.added.push([type, fn]);
    },
    removeEventListener(type, fn) {
      this.removed.push([type, fn]);
    },
  };
  let got;
  const verbs = new Map([['frame', (data) => {
    got = data;
  }]]);
  const off = bus.listen(host, 'checks', verbs, () => {});
  const event = {
    data: {
      net: 'my-app',
      channel: 'checks',
      verb: 'frame',
      from: 'checker',
      to: null,
    },
  };
  host.added[0][1](event);
  off();
  return (
    host.added.length === 1 &&
    host.removed.length === 1 &&
    got === event.data
  );
}
function testFanoutSkipsBrokenSink() {
  // One dead sink never aborts the fan-out: live peers behind it
  // still get the message.
  const bus = testBus();
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
  const message = bus.message('checks', 'ping');
  bus.fanout([broken, live], message);
  return got.length === 1 && got[0] === message;
}
function testNoteAndDrainCoalesce() {
  // Hot loop ticks collapse per key: the flush posts one delta per key.
  const bus = testBus();
  bus.note('frame');
  bus.note('frame');
  bus.note('tick');
  const out = bus.drain();
  return (
    out.get('frame') === 2 &&
    out.get('tick') === 1 &&
    bus.pendings.size === 0
  );
}
export const tests = [
  testRequiresExplicitSettings,
  testMessageBuildsEnvelope,
  testMessageBroadcastsByDefault,
  testStampKeepsCallerStamp,
  testCustomSourceKey,
  testPostStampsAndTargetsParent,
  testIsOursMatchesAddressing,
  testDispatchRunsVerb,
  testListenSubscribes,
  testFanoutSkipsBrokenSink,
  testNoteAndDrainCoalesce,
];
