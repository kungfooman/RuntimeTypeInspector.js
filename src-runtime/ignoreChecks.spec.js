import {inspectType} from './inspectType.js';
import {ignoredChecks} from './ignoredChecks.js';
import {options} from './options.js';
import {getCheckStats, resetCheckStats} from './checkStats.js';
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
function testSuppressionRecordsASkip() {
  // Suppressed checks stay cheap and silent, but they are counted: the
  // Stats button totals skips across rows, so examples that skip
  // something show it at a glance. No validation row is recorded, only
  // the skip ledger moves.
  options.checkStats = true;
  resetCheckStats();
  ignoredChecks.add('skipRow.data');
  try {
    const ok = inspectType('x', 'number', 'skipRow', 'data') === true;
    const rows = getCheckStats();
    return ok && rows.length === 1 && rows[0].loc === 'skipRow data' &&
      rows[0].skips === 1 && rows[0].checks === 0;
  } finally {
    ignoredChecks.delete('skipRow.data');
    resetCheckStats();
  }
}
const tests = [
  testLocNameSuppressed,
  testSiblingStillReports,
  testBareLocSuppressesAll,
  testUnlistedStillReports,
  testSuppressionRecordsASkip,
];
export {tests};
