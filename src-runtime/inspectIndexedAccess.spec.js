import {inspectIndexedAccess} from './inspectIndexedAccess.js';
import {options             } from './options.js';
const tests = [
  () => inspectIndexedAccess([1, 2, 3], 1) === 2,
  () => inspectIndexedAccess('abc', 0) === 'a',
  () => inspectIndexedAccess({a: 5}, 'a') === 5,
  () => inspectIndexedAccess(new Float32Array([1, 2]), 1) === 2,
  // Out of bounds / negative / fractional indices still pass through
  () => inspectIndexedAccess([1, 2, 3], 42) === undefined,
  () => inspectIndexedAccess([1, 2, 3], -1) === undefined,
  () => inspectIndexedAccess([1, 2, 3], 1.5) === undefined,
  // Warnings: out of bounds
  () => {
    const before = options.count;
    inspectIndexedAccess([1, 2, 3], 42);
    return options.count === before + 1;
  },
  // Warnings: not an integer
  () => {
    const before = options.count;
    inspectIndexedAccess('abc', 1.5);
    return options.count === before + 1;
  },
  // Warnings: nullish value
  () => {
    const before = options.count;
    inspectIndexedAccess(null, 0);
    return options.count === before + 1;
  },
  // No warnings for valid accesses and non-sequence pass-through
  () => {
    const before = options.count;
    inspectIndexedAccess([1, 2, 3], 1);
    inspectIndexedAccess({a: 5}, 'a');
    inspectIndexedAccess({a: 5}, 1.5);
    return options.count === before;
  },
  // Disabled: straight pass-through without any warnings
  () => {
    const before = options.count;
    options.enabled = false;
    const ret = inspectIndexedAccess([1, 2], 9) === undefined;
    const noWarnings = options.count === before;
    options.enabled = true;
    return ret && noWarnings;
  },
];
export {tests};
