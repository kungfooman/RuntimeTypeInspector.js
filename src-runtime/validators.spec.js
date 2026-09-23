import {validateType} from './validateType.js';
import {validators, recurse} from './validators.js';
const warn = () => undefined;
function testTableComplete() {
  for (const key of ['validate', 'object', 'record', 'reference', 'map', 'mapping', 'array', 'intersection', 'keyof', 'union', 'set', 'templateLiteral', 'tuple', 'typeof', 'number', 'promise', 'arrayLike', 'typedef']) {
    if (typeof validators[key] !== 'function') {
      return false;
    }
  }
  return true;
}
function testOverrideTakesEffect() {
  // Precise userland override (the precise version of the old
  // `typedefs['reference'] = 'any'` nuke): dispatch reads the table live.
  const orig = validators.reference;
  let calls = 0;
  validators.reference = (value, expect, loc, name, critical, warn, depth) => {
    calls++;
    return true;
  };
  let ret;
  try {
    ret = validateType([1, 2, '3'], {type: 'reference', name: 'ArrayLike', args: ['number']}, 'loc', 'name', true, warn, 0);
  } finally {
    validators.reference = orig;
  }
  return ret === true && calls === 1;
}
function testOverrideRestored() {
  // After restore, real validation is back (invalid element fails).
  return validateType([1, 2, '3'], {type: 'reference', name: 'ArrayLike', args: ['number']}, 'loc', 'name', true, warn, 0) === false;
}
function testRecurseGuard() {
  // Without registration: helpful error instead of a bare TypeError.
  const orig = validators.validate;
  validators.validate = undefined;
  let threw = null;
  try {
    validateType([1], {type: 'array', elementType: 'number'}, 'loc', 'name', true, warn, 0);
  } catch (e) {
    threw = e;
  } finally {
    validators.validate = orig;
  }
  return threw instanceof Error && /not registered/.test(threw.message);
}
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
