import {resolvePostTarget} from './resolvePostTarget.js';
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
function testPrefersParent() {
  // Framed pages post to the embedding parent, not to themselves.
  const parent = {
    name: 'parent',
  };
  const self = {
    name: 'self',
  };
  return withTargets(parent, self, () => resolvePostTarget() === parent);
}
function testFallsBackToSelf() {
  // Top level pages and workers have no parent: self carries the traffic.
  const self = {
    name: 'self',
  };
  return withTargets(undefined, self, () => resolvePostTarget() === self);
}
function testBareNodeIsUndefined() {
  // Bare Node has neither host: undefined instead of a ReferenceError.
  return withTargets(undefined, undefined, () => resolvePostTarget() === undefined);
}
export const tests = [
  testPrefersParent,
  testFallsBackToSelf,
  testBareNodeIsUndefined,
];
