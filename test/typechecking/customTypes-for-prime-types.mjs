import {customTypes, disableTypeChecking, enableTypeChecking} from '@runtime-type-inspector/runtime';
/**
 * @ignoreRTI
 * @param {*} value - The value.
 * @returns {boolean} Whether "value" if of type  "expect".
 */
function validatePrime(value) {
  if (typeof value !== 'number') {
    return false;
  }
  // Preventation for: Uncaught RangeError: Maximum call stack size exceeded
  disableTypeChecking();
  const ret = isPrime(value);
  enableTypeChecking();
  return ret;
}
customTypes.prime = validatePrime;
/**
 * @typedef {number} prime
 */
/**
 * @param {prime} a - 1st prime addend.
 * @param {prime} b - 2nd prime addend.
 * @returns {number} The sum.
 */
function addPrimesOnly(a, b) {
  return a + b;
}
/**
 * @param {number} x - The number to test.
 * @returns {boolean} Whether number is a prime.
 */
function isPrime(x) {
  if (x > 2 && x % 2 === 0) {
    return false;
  }
  const n = Math.ceil(Math.sqrt(x));
  for (let i = 3; i <= n; i += 2) {
    if (x % i === 0) {
      return false;
    }
  }
  return x > 1;
}
// Tests:
addPrimesOnly(11, 13); // works, both prime
addPrimesOnly(1, 13); // fails, 1 isn't prime
addPrimesOnly(11, undefined); // not even a number
const primes = [];
for (let i = 0; i < 200; i++) {
  const prime = isPrime(i);
  if (prime) {
    primes.push(i);
  }
}
console.log("Primes:", primes);
