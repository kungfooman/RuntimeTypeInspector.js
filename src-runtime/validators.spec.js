import {validateType} from './validateType.js';
import {validators, recurse} from './validators.js';
const warn = () => undefined;
// Every validator is registered in the dispatch table.
function testTableComplete() {
  for (const key of ['validateType', 'validateCondition', 'validateObject', 'validateRecord', 'validateReference', 'validateMap', 'validateMapping', 'validateArray', 'validateIntersection', 'validateIndexedAccess', 'validateKeyof', 'validateUnion', 'validateSet', 'validateTemplateLiteral', 'validateTuple', 'validateTypeof', 'validateNumber', 'validatePromise', 'validateArrayLike', 'validateTypedef', 'materializeMapping', 'evaluateCondition', 'decideIfEquals']) {
    if (typeof validators[key] !== 'function') {
      return false;
    }
  }
  return true;
}
// A userland override takes effect immediately through the table.
function testOverrideTakesEffect() {
  // Precise userland override (the precise version of the old
  // `typedefs['reference'] = 'any'` nuke): dispatch reads the table live.
  const orig = validators.validateReference;
  let calls = 0;
  validators.validateReference = (value, expect, loc, name, critical, warn, depth) => {
    calls++;
    return true;
  };
  let ret;
  try {
    ret = validateType([1, 2, '3'], {type: 'reference', name: 'ArrayLike', args: ['number']}, 'loc', 'name', true, warn, 0);
  } finally {
    validators.validateReference = orig;
  }
  return ret === true && calls === 1;
}
// Restoring the override brings back real validation.
function testOverrideRestored() {
  // After restore, real validation is back (invalid element fails).
  return validateType([1, 2, '3'], {type: 'reference', name: 'ArrayLike', args: ['number']}, 'loc', 'name', true, warn, 0) === false;
}
// Recursing without registration throws a helpful error.
function testRecurseGuard() {
  // Without registration: helpful error instead of a bare TypeError.
  const orig = validators.validateType;
  validators.validateType = undefined;
  let threw = null;
  try {
    validateType([1], {type: 'array', elementType: 'number'}, 'loc', 'name', true, warn, 0);
  } catch (e) {
    threw = e;
  } finally {
    validators.validateType = orig;
  }
  return threw instanceof Error && /not registered/.test(threw.message);
}
// The recursion entry behaves exactly like validateType.
function testRecurseMatchesValidateType() {
  // The recursion entry behaves like validateType itself.
  if (!recurse(1, 'number', 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (recurse('1', 'number', 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
export const tests = [
  testTableComplete,
  testOverrideTakesEffect,
  testOverrideRestored,
  testRecurseGuard,
  testRecurseMatchesValidateType,
];
