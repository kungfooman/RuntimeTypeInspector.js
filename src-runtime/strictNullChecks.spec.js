import {options     } from './options.js';
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
  const rejectsNull = validateType(null, 'number', 'loc', 'name', true, warn, 0) === false;
  const rejectsUndefined = validateType(undefined, 'number', 'loc', 'name', true, warn, 0) === false;
  const emptyObject = {
    type: 'object',
    properties: {},
  };
  const acceptsNullObject = validateType(null, emptyObject, 'loc', 'name', true, warn, 0);
  if (rejectsNull === false || rejectsUndefined === false || acceptsNullObject) {
    return false;
  }
  return true;
}
function testNonStrictNullPasses() {
  const arrayExpect = {
    type: 'array',
    elementType: 'number',
  };
  const expects = ['number', 'string', 'boolean', 'object', arrayExpect];
  return withNonStrict(() => {
    for (const expect of expects) {
      const passesNull = validateType(null, expect, 'loc', 'name', true, warn, 0);
      const passesUndefined = validateType(undefined, expect, 'loc', 'name', true, warn, 0);
      if (passesNull === false || passesUndefined === false) {
        return false;
      }
    }
    return true;
  });
}
function testNonStrictStillRejectsWrong() {
  const arrayExpect = {
    type: 'array',
    elementType: 'number',
  };
  return withNonStrict(() => {
    const acceptsWrongNumber = validateType('1', 'number', 'loc', 'name', true, warn, 0);
    const acceptsWrongString = validateType(1, 'string', 'loc', 'name', true, warn, 0);
    const acceptsWrongElement = validateType([1, 'x'], arrayExpect, 'loc', 'name', true, warn, 0);
    if (acceptsWrongNumber || acceptsWrongString || acceptsWrongElement) {
      return false;
    }
    return true;
  });
}
function testNonStrictNonNullable() {
  const nonNullable = {
    type: 'reference',
    name: 'NonNullable',
    args: ['number'],
  };
  // Matches TypeScript with strictNullChecks off: null is in every domain.
  return withNonStrict(() => validateType(null, nonNullable, 'loc', 'name', true, warn, 0));
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
