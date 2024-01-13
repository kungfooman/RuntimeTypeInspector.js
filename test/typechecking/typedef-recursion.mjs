import {typedefs} from '@runtime-type-inspector/runtime';
/** @typedef {Test & Test} Test */
/**
 * @param {Test} a - First argument.
 * @param {Test} b - Second argument.
 * @returns {any} Not specified.
 */
function add(a, b) {
  return a + b;
}
/** @type {number[]} */
const arr = [10_20];
const [a, b] = arr;
const ret = add(a, b);
console.log("ret", ret);
console.log("typedefs", typedefs);
