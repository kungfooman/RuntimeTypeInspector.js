import {inspectType} from './inspectType.js';
import {validateType} from './validateType.js';
import {customChecks} from './customChecks.js';
import {recurse} from './validators.js';
import {expandType} from '../src-transpiler/expandType.js';
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
/**
 * Holes-skipped but present-values-checked: the tooth operation a plain
 * suppression cannot do (muting would also blind the strings below).
 * @param {*} value - The actual value.
 * @param {*} expect - The supposed type information.
 * @param {string} loc - The check location.
 * @param {string} name - The argument name.
 * @param {boolean} critical - Only false for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} True when every present element is a number.
 */
function holesSkipped(value, expect, loc, name, critical, warn, depth) {
  if (value === null || typeof value !== 'object' || typeof value.length !== 'number') {
    return false;
  }
  for (let i = 0; i < value.length; i++) {
    if (!(i in value)) {
      continue;
    }
    if (!recurse(value[i], 'number', loc, `${name}[${i}]`, critical, warn, depth + 1)) {
      return false;
    }
  }
  return true;
}
function testCustomApprovesHoles() {
  // A holey tail passes under host control that skips only absent indices.
  const sparse = [];
  sparse.length = 3;
  customChecks.set('takeFloat.data', holesSkipped);
  try {
    const posted = capturePost(() => inspectType(sparse, expandType('Array<number>'), 'takeFloat', 'data'));
    return posted === undefined;
  } finally {
    customChecks.delete('takeFloat.data');
  }
}
function testCustomStillFlagsStrings() {
  // Present-but-wrong values still fail under the same host control.
  customChecks.set('takeFloat.data', holesSkipped);
  try {
    const posted = capturePost(() => inspectType([1, 'x'], expandType('Array<number>'), 'takeFloat', 'data'));
    return posted !== undefined && posted.loc === 'takeFloat' && posted.name === 'data';
  } finally {
    customChecks.delete('takeFloat.data');
  }
}
function testCustomRejectsThroughPipeline() {
  // A failing custom check reports through the standard error pipeline.
  customChecks.set('takeFloat.data', () => false);
  try {
    const posted = capturePost(() => inspectType([1], expandType('Array<number>'), 'takeFloat', 'data'));
    return posted !== undefined && posted.loc === 'takeFloat';
  } finally {
    customChecks.delete('takeFloat.data');
  }
}
function testUnlistedUsesCore() {
  // Without an entry the core check runs (holes fail strictly).
  const sparse = [];
  sparse.length = 3;
  const posted = capturePost(() => inspectType(sparse, expandType('Array<number>'), 'takeFloat', 'data'));
  return posted !== undefined && posted.loc === 'takeFloat' && posted.name === 'data';
}
const tests = [
  testCustomApprovesHoles,
  testCustomStillFlagsStrings,
  testCustomRejectsThroughPipeline,
  testUnlistedUsesCore,
];
export {tests};
