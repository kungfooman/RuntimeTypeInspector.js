/**
 * @param {Set<object>} numbers - Some numbers
 */
function test(numbers) {
  console.log("Got", numbers);
}
const a = {};
const b = {};
const data = new Set([a, b, 3]);
test({a: 1, b: 2}); // bad
test(data); // bad
