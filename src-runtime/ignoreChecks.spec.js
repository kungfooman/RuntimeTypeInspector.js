import {inspectType} from './inspectType.js';
import {ignoredChecks} from './ignoredChecks.js';
/**
 * Captures the RTI error message posted for a check.
 * @param {Function} fn - The check to run.
 * @returns {object|undefined} The posted message, if any.
 */
function capturePost(fn) {
  let posted;
  const origSelf = globalThis.self;
  globalThis.self = {addEventListener: () => {}, postMessage: (msg) => {
    posted = msg;
  }};
  try {
    fn();
    return posted;
  } finally {
    globalThis.self = origSelf;
  }
}
function testLocNameSuppressed() {
  // A suppressed `loc.name` passes silently even for a wrong value.
  ignoredChecks.add('takeFloat.data');
  try {
    const posted = capturePost(() => inspectType('x', 'number', 'takeFloat', 'data'));
    return posted === undefined;
  } finally {
    ignoredChecks.delete('takeFloat.data');
  }
}
function testSiblingStillReports() {
  // Suppression is per-check: siblings under the same loc still report.
  ignoredChecks.add('takeFloat.data');
  try {
    const posted = capturePost(() => inspectType('x', 'number', 'takeFloat', 'other'));
    return posted !== undefined && posted.loc === 'takeFloat' && posted.name === 'other';
  } finally {
    ignoredChecks.delete('takeFloat.data');
  }
}
function testBareLocSuppressesAll() {
  // A bare `loc` entry silences every check of the function.
  ignoredChecks.add('takeFloat');
  try {
    const posted = capturePost(() => inspectType('x', 'number', 'takeFloat', 'data'));
    return posted === undefined;
  } finally {
    ignoredChecks.delete('takeFloat');
  }
}
function testUnlistedStillReports() {
  // Without any entry the same wrong value reports as usual.
  const posted = capturePost(() => inspectType('x', 'number', 'takeFloat', 'data'));
  return posted !== undefined && posted.loc === 'takeFloat' && posted.name === 'data';
}
const tests = [
  testLocNameSuppressed,
  testSiblingStillReports,
  testBareLocSuppressesAll,
  testUnlistedStillReports,
];
export {tests};
