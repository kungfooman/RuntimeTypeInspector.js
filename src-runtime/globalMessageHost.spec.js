import {globalMessageHost} from './globalMessageHost.js';
/**
 * Runs a closure with exact `window`/`self` globals, restoring afterwards.
 * @param {*} windowValue - Value for `globalThis.window` (`undefined` deletes).
 * @param {*} selfValue - Value for `globalThis.self` (`undefined` deletes).
 * @param {Function} fn - The closure to run.
 * @returns {*} The closure result.
 */
function withHosts(windowValue, selfValue, fn) {
  const saved = {window: globalThis.window, self: globalThis.self};
  const apply = (key, value) => {
    if (value === undefined) {
      delete globalThis[key];
    } else {
      globalThis[key] = value;
    }
  };
  apply('window', windowValue);
  apply('self', selfValue);
  try {
    return fn();
  } finally {
    apply('window', saved.window);
    apply('self', saved.self);
  }
}
function testPrefersWindow() {
  // Pages have both: the window bus wins.
  return withHosts({name: 'win'}, {name: 'self'}, () => globalMessageHost()?.name === 'win');
}
function testFallsBackToSelf() {
  // Workers have no window: self carries the traffic.
  return withHosts(undefined, {name: 'self'}, () => globalMessageHost()?.name === 'self');
}
function testBareNodeIsUndefined() {
  // Bare Node has neither: undefined instead of a ReferenceError.
  return withHosts(undefined, undefined, () => globalMessageHost() === undefined);
}
export const tests = [
  testPrefersWindow,
  testFallsBackToSelf,
  testBareNodeIsUndefined,
];
