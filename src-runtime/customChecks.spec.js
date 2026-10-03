import {inspectType} from './inspectType.js';
import {validateType} from './validateType.js';
import {customChecks} from './customChecks.js';
import {recurse} from './validators.js';
import {validateArrayLikeSparse} from './validateArrayLikeSparse.js';
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
  customChecks.set('takeFloatHoles.data', holesSkipped);
  try {
    const posted = capturePost(() => inspectType(sparse, expandType('Array<number>'), 'takeFloatHoles', 'data'));
    return posted === undefined;
  } finally {
    customChecks.delete('takeFloatHoles.data');
  }
}
function testCustomStillFlagsStrings() {
  // Present-but-wrong values still fail under the same host control.
  customChecks.set('takeFloatStrings.data', holesSkipped);
  try {
    const posted = capturePost(() => inspectType([1, 'x'], expandType('Array<number>'), 'takeFloatStrings', 'data'));
    return posted !== undefined && posted.loc === 'takeFloatStrings' && posted.name === 'data';
  } finally {
    customChecks.delete('takeFloatStrings.data');
  }
}
function testCustomRejectsThroughPipeline() {
  // A failing custom check reports through the standard error pipeline.
  customChecks.set('takeFloatReject.data', () => false);
  try {
    const posted = capturePost(() => inspectType([1], expandType('Array<number>'), 'takeFloatReject', 'data'));
    return posted !== undefined && posted.loc === 'takeFloatReject';
  } finally {
    customChecks.delete('takeFloatReject.data');
  }
}
function testUnlistedUsesCore() {
  // Without an entry the core check runs (holes fail strictly).
  const sparse = [];
  sparse.length = 3;
  const posted = capturePost(() => inspectType(sparse, expandType('Array<number>'), 'takeFloatCore', 'data'));
  return posted !== undefined && posted.loc === 'takeFloatCore' && posted.name === 'data';
}
function testBareValidatorRegistersDirectly() {
  // Uniform contracts compose without adapters: the shipped sparse
  // validator plugs straight into the registry, no wrapper needed.
  const sparse = [1];
  sparse.length = 3;
  customChecks.set('takeFloatSparse.data', validateArrayLikeSparse);
  try {
    const posted = capturePost(() => inspectType(sparse, expandType('Array<number>'), 'takeFloatSparse', 'data'));
    return posted === undefined;
  } finally {
    customChecks.delete('takeFloatSparse.data');
  }
}
const tests = [
  testCustomApprovesHoles,
  testCustomStillFlagsStrings,
  testCustomRejectsThroughPipeline,
  testUnlistedUsesCore,
  testBareValidatorRegistersDirectly,
];
export {tests};
