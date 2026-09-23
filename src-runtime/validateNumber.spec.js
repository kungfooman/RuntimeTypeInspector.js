import {validateType} from './validateType.js';
import {validateNumber, validateNumberInObject} from './validateNumber.js';
const warn = () => undefined;
const expectNumber = 'number';
function testValidNumbers() {
  for (const value of [0, -0, 1, -1.5, 1e308, Number.MAX_SAFE_INTEGER]) {
    if (!validateNumber(value, expectNumber, 'loc', 'name', true, warn, 0)) {
      return false;
    }
  }
  return true;
}
function testIssueFalsePositive() {
  // Old global isNaN/isFinite coerced, so "1" passed as number.
  if (validateNumber('1', expectNumber, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType('1', expectNumber, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testNaNAndInfinity() {
  for (const value of [NaN, Infinity, -Infinity]) {
    if (validateNumber(value, expectNumber, 'loc', 'name', true, warn, 0)) {
      return false;
    }
    if (validateType(value, expectNumber, 'loc', 'name', true, warn, 0)) {
      return false;
    }
  }
  return true;
}
function testNullishAndWrongTypes() {
  for (const value of [null, undefined, true, 'str', 'NaN', 1n, new Date()]) {
    if (validateNumber(value, expectNumber, 'loc', 'name', true, warn, 0)) {
      return false;
    }
  }
  return true;
}
function testBoxedNumber() {
  // Boxed Number objects are `object`, not `number` — even with a good value.
  // eslint-disable-next-line no-new-wrappers
  const boxed = new Number(1);
  if (validateNumber(boxed, expectNumber, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(boxed, expectNumber, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  // eslint-disable-next-line no-new-wrappers
  if (validateNumber(new Number(NaN), expectNumber, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
function testFailuresWarn() {
  const warnings = [];
  const ret = validateType('1', expectNumber, 'test', 'a', true, (...args) => {
    warnings.push(args[0]);
  }, 0);
  if (ret !== false || warnings.length === 0) {
    return false;
  }
  return true;
}
function testInObjectValid() {
  const warnings = [];
  const ret = validateNumberInObject({a: 1}, 'a', (...args) => {
    warnings.push(args);
  });
  return ret === true && warnings.length === 0;
}
function testInObjectKeepsKeys() {
  // Old `validateNumber(obj, prop)` generated `type#prop` warning keys.
  const warnings = [];
  const ret = validateNumberInObject({b: '1'}, 'b', (...args) => {
    warnings.push(args);
  });
  if (ret !== false) {
    return false;
  }
  if (typeof warnings[0][0] !== 'string' || !warnings[0][0].includes('object#b')) {
    return false;
  }
  return true;
}
function testInObjectIssueExample() {
  // String element at index must fail.
  if (validateNumberInObject(['1', 2, 3], 0, warn)) {
    return false;
  }
  if (!validateNumberInObject(['1', 2, 3], 1, warn)) {
    return false;
  }
  if (validateNumberInObject({c: null}, 'c', warn)) {
    return false;
  }
  return true;
}
export const tests = [
  testValidNumbers,
  testIssueFalsePositive,
  testNaNAndInfinity,
  testNullishAndWrongTypes,
  testBoxedNumber,
  testFailuresWarn,
  testInObjectValid,
  testInObjectKeepsKeys,
  testInObjectIssueExample,
];
