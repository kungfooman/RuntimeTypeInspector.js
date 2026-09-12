// 1. Multiple declarators in a single statement (let / const / object mixed)
/**
 * @param {number} a - First number.
 * @param {number} b - Second number.
 * @returns {number} Sum.
 */
let add = function (a, b) {
  return a + b;
}, sub = function (a, b) {
  return a - b;
}, obj = {mul: function (a, b) {
  return a * b;
}};
// 2. Nested function expression in a declarator inside another function expression
/**
 * @param {number} a - Number.
 * @returns {Function} A function.
 */
const outer = function (a) {
  /**
   * @param {number} b - Number.
   * @returns {number} Sum with outer.
   */
  const inner = function (b) {
    return a + b;
  };
  return inner;
};
// 3. Named function expression uses its own name, not the variable
/**
 * @param {number} x - Number.
 * @returns {number} Doubled.
 */
const named = function label(x) {
  return x * 2;
};
// 4. Object property value reports the property name, not the object variable
/**
 * @param {number} y - Number.
 * @returns {number} Y plus one.
 */
const object = {
  method: function (y) {
    return y + 1;
  }
};
// 5. Assignment to a previously declared variable
let assigned;
/**
 * @param {number} z - Number.
 * @returns {number} Z minus one.
 */
assigned = function (z) {
  return z - 1;
};
// 6. Function passed as call argument has no name available
/**
 * @param {number[]} numbers - Numbers.
 * @returns {number[]} Squared numbers.
 */
function mapStuff(numbers) {
  return numbers.map(
    /**
     * @param {number} n - Number.
     * @returns {number} Squared.
     */
    function (n) {
      return n * n;
    }
  );
}