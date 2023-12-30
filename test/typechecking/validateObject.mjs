/**
 * @param {object} numbers
 * @param {number} numbers.a - A number.
 * @param {number} numbers.b - A number.
 */
function test(numbers) {
  // nothing
}
const a = new Date();
const b = Date.now();
test(123); // bad
test({a: 1, b: 2}); // good
test({a, b}); // bad
