import {markTypeofRequirements} from './markTypeofRequirements.js';
import {requiredTypeofs} from './expandType.js';
/**
 * Drops a mark the test added: the requirement map lives for the whole
 * process, so every mark here cleans up after itself.
 * @param {string} name - The marked name.
 */
function dropMark(name) {
  delete requiredTypeofs[name];
}
function testMarksTypeofName() {
  // A `typeof Name` query marks the name missing for the declaration pass.
  markTypeofRequirements('@param {typeof RTI_PROBE_A} m');
  try {
    return requiredTypeofs.RTI_PROBE_A === 'missing';
  } finally {
    dropMark('RTI_PROBE_A');
  }
}
function testIgnoresPlainText() {
  // Names without `typeof` never mark, even in screaming case.
  markTypeofRequirements('@param {RTI_PROBE_B} m is only prose');
  try {
    return !('RTI_PROBE_B' in requiredTypeofs);
  } finally {
    dropMark('RTI_PROBE_B');
  }
}
function testKeepsFound() {
  // An already-found name is never demoted back to missing.
  requiredTypeofs.RTI_PROBE_C = 'found';
  try {
    markTypeofRequirements('@param {typeof RTI_PROBE_C} m');
    return requiredTypeofs.RTI_PROBE_C === 'found';
  } finally {
    dropMark('RTI_PROBE_C');
  }
}
export const tests = [
  testMarksTypeofName,
  testIgnoresPlainText,
  testKeepsFound,
];
