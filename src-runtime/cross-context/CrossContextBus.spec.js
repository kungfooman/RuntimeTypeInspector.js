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
function testDefaultsAreRti() {
  // No settings: the bus speaks RTI out of the box, so existing code
  // migrates by deleting its hand rolled helpers, not by configuring.
  const bus = new CrossContextBus({});
  return (
    bus.tag === 'rti' &&
    bus.ui === 'ui' &&
    bus.worker === 'worker' &&
    typeof bus.runtimeId === 'string' &&
    bus.runtimeId.length > 0
  );
}
function testMessageBuildsEnvelope() {
  // One envelope builder: tag plus lane stay fixed, payload rides along.
  const bus = new CrossContextBus({
    tag: 'my-app',
  });
  const message = bus.message('ping', 'panel', {
    n: 1,
  });
  return (
    message.type === 'my-app' &&
    message.action === 'ping' &&
    message.destination === 'panel' &&
    message.n === 1
  );
}
function testStampKeepsCallerStamp() {
  // Same run stamps its id; forwarders and tests keep their own stamp.
  const bus = new CrossContextBus({
    tag: 'my-app',
  });
  const own = bus.stamp({
    type: 'my-app',
  });
  const foreign = bus.stamp({
    type: 'my-app',
    source: 'other',
  });
  const otherTag = bus.stamp({
    type: 'other',
  });
  return (
    own.source === bus.runtimeId &&
    foreign.source === 'other' &&
    otherTag.source === undefined
  );
}
function testPostStampsAndTargetsParent() {
  // Posting stamps and targets the parent when framed: one call, same object.
  const parent = {
    posted: [],
    postMessage(message) {
      this.posted.push(message);
    },
  };
  const bus = new CrossContextBus({
    tag: 'my-app',
  });
  return withTargets(parent, {
    postMessage() {},
  }, () => {
    const message = {
      type: 'my-app',
      action: 'ping',
      destination: 'panel',
    };
    bus.post(message);
    return (
      parent.posted.length === 1 &&
      parent.posted[0] === message &&
      message.source === bus.runtimeId
    );
  });
}
function testGuardsStayPerBus() {
  // Display and checker guards follow this bus's tag and lanes only.
  const bus = new CrossContextBus({
    tag: 'my-app',
  });
  const displayEvent = {
    data: {
      type: 'my-app',
      destination: 'ui',
    },
  };
  const checkerEvent = {
    data: {
      type: 'my-app',
      destination: 'worker',
    },
  };
  const rtiEvent = {
    data: {
      type: 'rti',
      destination: 'ui',
    },
  };
  return (
    bus.isDisplay(displayEvent) === true &&
    bus.isDisplay(checkerEvent) === false &&
    bus.isDisplay(rtiEvent) === false &&
    bus.isChecker(checkerEvent) === true &&
    bus.isChecker(displayEvent) === false
  );
}
function testDispatchRunsHandler() {
  // Dispatch runs the handler by action; unknown actions warn once.
  const bus = new CrossContextBus({
    tag: 'my-app',
  });
  let got;
  const handlers = new Map([
    ['ping', (event) => {
      got = event;
    }],
  ]);
  const event = {
    data: {
      type: 'my-app',
      destination: 'ui',
      action: 'ping',
    },
  };
  const warns = [];
  const ran = bus.dispatch(event, handlers, ({action}) => warns.push(action));
  const unknown = {
    data: {
      type: 'my-app',
      destination: 'ui',
      action: 'bogus',
    },
  };
  const missed = bus.dispatch(unknown, handlers, ({action}) => warns.push(action));
  return (
    ran === true &&
    got === event &&
    missed === false &&
    warns.length === 1 &&
    warns[0] === 'bogus'
  );
}
function testApplyRunsCommand() {
  // Checker commands run keyed by action; unknown stays false for the
  // caller to warn once instead of throwing mid dispatch.
  const bus = new CrossContextBus({
    tag: 'my-app',
  });
  let got;
  const commands = {
    enable(data) {
      got = data;
    },
  };
  const event = {
    data: {
      type: 'my-app',
      destination: 'worker',
      action: 'enable',
      value: true,
    },
  };
  const ran = bus.apply(event, commands);
  const missed = bus.apply({
    data: {
      type: 'my-app',
      destination: 'worker',
      action: 'bogus',
    },
  }, commands);
  return (
    ran === true &&
    got.value === true &&
    missed === false
  );
}
function testFanoutSkipsBrokenSink() {
  // One dead sink never aborts the fan-out: live contexts behind it
  // still get the message.
  const bus = new CrossContextBus({
    tag: 'my-app',
  });
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
  const message = bus.message('ping', 'worker');
  bus.fanout([broken, live], message);
  return got.length === 1 && got[0] === message;
}
function testNoteAndDrainCoalesce() {
  // Hot loop ticks collapse per key: the flush posts one delta per key.
  const bus = new CrossContextBus({
    tag: 'my-app',
  });
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
  testDefaultsAreRti,
  testMessageBuildsEnvelope,
  testStampKeepsCallerStamp,
  testPostStampsAndTargetsParent,
  testGuardsStayPerBus,
  testDispatchRunsHandler,
  testApplyRunsCommand,
  testFanoutSkipsBrokenSink,
  testNoteAndDrainCoalesce,
];
