import {isProbeCall, probeCallNames} from './isProbeCall.js';
// Compiler probes never wrap: their metadata is not a user argument.
function testProbeCallSkips() {
  const node = {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'inspectType',
    },
    arguments: [],
  };
  return isProbeCall(node) === true;
}
// Wrappers never double-wrap: markFresh output stays bare.
function testMarkFreshSkips() {
  const node = {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'markFresh',
    },
    arguments: [],
  };
  return isProbeCall(node) === true;
}
// User calls still wrap: only probes skip.
function testUserCallWraps() {
  const node = {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'fetch',
    },
    arguments: [],
  };
  return isProbeCall(node) === false;
}
// The shared set exposes names so callers agree on one list.
function testSetShared() {
  return probeCallNames().has('inspectType') === true && probeCallNames().has('fetch') === false;
}
export const tests = [
  testProbeCallSkips,
  testMarkFreshSkips,
  testUserCallWraps,
  testSetShared,
];
