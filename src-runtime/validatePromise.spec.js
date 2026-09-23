import {validateType} from './validateType.js';
import {expandType} from '../src-transpiler/expandType.js';
const warn = () => undefined;
function testPromiseNumberValid() {
  // User snippet:
  //   /**
  //    * @param {Promise<number>} a
  //    */
  //   async function test(a) { const ret = await a; return ret; }
  //   const promise = new Promise((resolve, reject) => resolve(123));
  //   test(promise) must pass with no 'unchecked'.
  const expect = expandType('Promise<number>');
  if (JSON.stringify(expect) !== JSON.stringify({type: 'promise', elementType: 'number'})) {
    return false;
  }
  let unchecked = false;
  const promise = new Promise((resolve) => {
    resolve(123);
  });
  const ret = validateType(promise, expect, 'test', 'a', true, (...args) => {
    if (args[0] === 'unchecked') unchecked = true;
  }, 0);
  return ret === true && unchecked === false;
}
function testPromiseNumberInvalid() {
  // Non-Promise values must fail: number, string, plain object, null.
  const expect = expandType('Promise<number>');
  if (validateType(123, expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (validateType('123', expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (validateType({then: () => {}}, expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (validateType(null, expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  if (validateType(undefined, expect, 'test', 'a', true, warn, 0)) {
    return false;
  }
  return true;
}
function testPromiseInnerNotCheckableSync() {
  // Promise<string> instance still satisfies the instanceof check;
  // inner T can't be verified without awaiting, document the behavior.
  const expect = expandType('Promise<number>');
  const promise = Promise.resolve('not-a-number');
  return validateType(promise, expect, 'test', 'a', true, warn, 0) === true;
}
function testPromiseRejectsWithWarning() {
  // Failure must warn (not silently pass) and must not warn 'unchecked'.
  const expect = expandType('Promise<number>');
  const warnings = [];
  const ret = validateType(123, expect, 'test', 'a', true, (...args) => {
    warnings.push(args[0]);
  }, 0);
  if (ret !== false) {
    return false;
  }
  if (warnings.includes('unchecked')) {
    return false;
  }
  return warnings.length > 0;
}
export const tests = [
  testPromiseNumberValid,
  testPromiseNumberInvalid,
  testPromiseInnerNotCheckableSync,
  testPromiseRejectsWithWarning,
];
