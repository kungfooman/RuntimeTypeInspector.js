import {options} from './options.js';
import {validateNumber} from './validateNumber.js';
import {validateType} from './validateType.js';
const warn = () => undefined;
function testInfinityCheckedByDefault() {
  const prev = options.checkInfinity;
  options.checkInfinity = true;
  const ret = validateNumber(Infinity, 'number', 'loc', 'name', true, warn, 0) === false &&
    validateNumber(-Infinity, 'number', 'loc', 'name', true, warn, 0) === false &&
    validateType(Infinity, 'number', 'loc', 'name', true, warn, 0) === false;
  options.checkInfinity = prev;
  return ret;
}
function testInfinityOptOut() {
  const prev = options.checkInfinity;
  options.checkInfinity = false;
  const ret = validateNumber(Infinity, 'number', 'loc', 'name', true, warn, 0) === true &&
    validateNumber(-Infinity, 'number', 'loc', 'name', true, warn, 0) === true &&
    validateType(Infinity, 'number', 'loc', 'name', true, warn, 0) === true;
  options.checkInfinity = prev;
  return ret;
}
function testNaNAlwaysFails() {
  const prev = options.checkInfinity;
  options.checkInfinity = false;
  const ret = validateNumber(NaN, 'number', 'loc', 'name', true, warn, 0) === false &&
    validateType(NaN, 'number', 'loc', 'name', true, warn, 0) === false;
  options.checkInfinity = prev;
  return ret;
}
const tests = [
  testInfinityCheckedByDefault,
  testInfinityOptOut,
  testNaNAlwaysFails,
];
export {tests};
