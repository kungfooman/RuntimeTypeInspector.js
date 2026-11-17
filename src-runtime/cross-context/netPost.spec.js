import {netPost} from './netPost.js';
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
function testBuildsAndPosts() {
  // One call builds the envelope and posts it at the framed parent,
  // returning the envelope as posted for the sender's own bookkeeping.
  const parent = {
    posted: [],
    postMessage(message) {
      this.posted.push(message);
    },
  };
  return withTargets(parent, {
    postMessage() {},
  }, () => {
    const out = netPost({
      net: 'my-app',
      channel: 'checks',
      verb: 'frame',
      from: 'a',
      payload: {
        n: 1,
      },
    });
    return (
      parent.posted.length === 1 &&
      parent.posted[0] === out &&
      out.net === 'my-app' &&
      out.to === null &&
      out.n === 1
    );
  });
}
function testMissingBusStaysSilent() {
  // Bare Node and broken buses degrade into a lost message, never into
  // a broken sender: the envelope still returns for local bookkeeping.
  const broken = {
    postMessage() {
      throw new Error('closed');
    },
  };
  const lost = withTargets(undefined, undefined, () => netPost({
    net: 'my-app',
    channel: 'checks',
    verb: 'frame',
    from: 'a',
  }));
  const dropped = withTargets(broken, undefined, () => netPost({
    net: 'my-app',
    channel: 'checks',
    verb: 'frame',
    from: 'a',
  }));
  return (
    lost.net === 'my-app' &&
    dropped.net === 'my-app'
  );
}
export const tests = [
  testBuildsAndPosts,
  testMissingBusStaysSilent,
];
