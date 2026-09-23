import {options} from './options.js';
import {validateType} from './validateType.js';
const warn = () => undefined;
/**
 * @param {Function} fn - Test body running with non-strict null checks.
 * @returns {boolean} Result of the test body with the flag restored after.
 */
function withNonStrict(fn) {
  const prev = options.strictNullChecks;
  options.strictNullChecks = false;
  try {
    return fn();
  } finally {
    options.strictNullChecks = prev;
  }
}
function testStrictByDefault() {
  if (options.strictNullChecks !== true) {
    return false;
  }
  if (validateType(null, 'number', 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(undefined, 'number', 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(null, {type: 'object', properties: {}}, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testNonStrictNullPasses() {
  return withNonStrict(() => {
    for (const expect of ['number', 'string', 'boolean', 'object', {type: 'array', elementType: 'number'}]) {
      if (!validateType(null, expect, 'loc', 'name', true, warn, 0)) {
        return false;
      }
      if (!validateType(undefined, expect, 'loc', 'name', true, warn, 0)) {
        return false;
      }
    }
    return true;
  });
}
function testNonStrictStillRejectsWrong() {
  return withNonStrict(() => {
    if (validateType('1', 'number', 'loc', 'name', true, warn, 0)) {
      return false;
    }
    if (validateType(1, 'string', 'loc', 'name', true, warn, 0)) {
      return false;
    }
    if (validateType([1, 'x'], {type: 'array', elementType: 'number'}, 'loc', 'name', true, warn, 0)) {
      return false;
    }
    return true;
  });
}
function testNonStrictNonNullable() {
  // Matches TypeScript with strictNullChecks off: null is in every domain.
  return withNonStrict(() => validateType(null, {type: 'reference', name: 'NonNullable', args: ['number']}, 'loc', 'name', true, warn, 0));
}
function testFlagRestored() {
  withNonStrict(() => true);
  if (options.strictNullChecks !== true) {
    return false;
  }
  return !validateType(null, 'number', 'loc', 'name', true, warn, 0);
}
export const tests = [
  testStrictByDefault,
  testNonStrictNullPasses,
  testNonStrictStillRejectsWrong,
  testNonStrictNonNullable,
  testFlagRestored,
];
